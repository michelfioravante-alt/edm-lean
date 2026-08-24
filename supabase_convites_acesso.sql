-- Convites sem e-mail: o gestor cria nome + papel e entrega o PIN.
create table if not exists public.convites_acesso (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    funcao text not null default 'programmer',
    setor_padrao text not null default 'CNC',
    pin text not null,
    ativo boolean not null default true,
    usado_em timestamptz,
    created_at timestamptz not null default now()
);

create unique index if not exists convites_acesso_empresa_pin_ativos
    on public.convites_acesso (empresa_id, pin)
    where ativo = true;

alter table public.convites_acesso enable row level security;

drop policy if exists "Equipe ve convites da empresa" on public.convites_acesso;
create policy "Equipe ve convites da empresa"
on public.convites_acesso for select
using (empresa_id in (select empresa_id from public.perfis where id = auth.uid()));

drop policy if exists "Gestores gerenciam convites" on public.convites_acesso;
create policy "Gestores gerenciam convites"
on public.convites_acesso for all
using (
    exists (
        select 1 from public.perfis p
        where p.id = auth.uid()
          and p.empresa_id = convites_acesso.empresa_id
          and p.funcao = 'admin'
    )
)
with check (
    exists (
        select 1 from public.perfis p
        where p.id = auth.uid()
          and p.empresa_id = convites_acesso.empresa_id
          and p.funcao = 'admin'
    )
);

create or replace function public.buscar_convite_por_pin(p_codigo text, p_pin text)
returns table (
    id uuid,
    nome text,
    funcao text,
    setor_padrao text,
    empresa_id uuid,
    nome_fantasia text,
    codigo_convite text,
    plano text,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        c.id,
        c.nome,
        c.funcao,
        c.setor_padrao,
        e.id,
        e.nome_fantasia,
        e.codigo_convite,
        e.plano,
        e.created_at
    from public.convites_acesso c
    join public.empresas e on e.id = c.empresa_id
    where e.codigo_convite = upper(trim(p_codigo))
      and c.pin = p_pin
      and c.ativo = true
    limit 1;
end;
$$;

grant execute on function public.buscar_convite_por_pin(text, text) to anon, authenticated;

-- PIN de convite (nome + papel) ou PIN mestre da fábrica
create or replace function public.vincular_acesso_por_pin(
    p_invite_code text,
    p_pin text
)
returns table (
    empresa_id uuid,
    nome_fantasia text,
    codigo_convite text,
    plano text,
    created_at timestamptz,
    funcao text,
    setor_padrao text,
    nome_pessoa text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_empresa public.empresas;
    v_empresa_id uuid;
    v_user_id uuid;
    v_code_upper text;
    v_attempt public.tentativas_login_pin;
    v_conv public.convites_acesso;
    v_master text;
    v_funcao text;
    v_setor text;
    v_nome text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Usuário não autenticado no Supabase Auth.';
    end if;

    v_code_upper := upper(trim(p_invite_code));

    select * into v_attempt from public.tentativas_login_pin where codigo_convite = v_code_upper;
    if v_attempt.bloqueado_ate is not null and now() < v_attempt.bloqueado_ate then
        raise exception 'Muitas tentativas incorretas. Terminal bloqueado temporariamente por 5 minutos.';
    end if;

    select * into v_empresa from public.empresas where codigo_convite = v_code_upper;
    if v_empresa.id is null then
        raise exception 'Código de convite inválido.';
    end if;
    v_empresa_id := v_empresa.id;

    select * into v_conv
    from public.convites_acesso
    where empresa_id = v_empresa_id
      and pin = p_pin
      and ativo = true
    limit 1;

    if v_conv.id is not null then
        v_funcao := v_conv.funcao;
        v_setor := v_conv.setor_padrao;
        v_nome := v_conv.nome;
        update public.convites_acesso set usado_em = now() where id = v_conv.id;
    else
        select pin_onboarding into v_master
        from public.configuracoes_empresa
        where empresa_id = v_empresa_id;
        if v_master is null then
            v_master := '1234';
        end if;
        if p_pin != v_master then
            perform pg_sleep(1.2);
            insert into public.tentativas_login_pin (codigo_convite, tentativas_falhas, atualizado_em)
            values (v_code_upper, 1, now())
            on conflict (codigo_convite) do update
            set tentativas_falhas = public.tentativas_login_pin.tentativas_falhas + 1,
                bloqueado_ate = case
                    when public.tentativas_login_pin.tentativas_falhas + 1 >= 5 then now() + interval '5 minutes'
                    else null
                end,
                atualizado_em = now();
            raise exception 'PIN de Segurança incorreto.';
        end if;
        v_funcao := 'programmer';
        v_setor := 'CNC';
        v_nome := 'Terminal de Produção';
    end if;

    insert into public.tentativas_login_pin (codigo_convite, tentativas_falhas, bloqueado_ate, atualizado_em)
    values (v_code_upper, 0, null, now())
    on conflict (codigo_convite) do update
    set tentativas_falhas = 0, bloqueado_ate = null, atualizado_em = now();

    insert into public.perfis (id, empresa_id, nome, funcao, setor_padrao)
    values (v_user_id, v_empresa_id, v_nome, v_funcao, v_setor)
    on conflict (id) do update
    set empresa_id = EXCLUDED.empresa_id,
        nome = EXCLUDED.nome,
        funcao = EXCLUDED.funcao,
        setor_padrao = EXCLUDED.setor_padrao;

    return query
    select v_empresa.id, v_empresa.nome_fantasia, v_empresa.codigo_convite, v_empresa.plano, v_empresa.created_at,
           v_funcao, v_setor, v_nome;
end;
$$;

grant execute on function public.vincular_acesso_por_pin(text, text) to anon, authenticated;
