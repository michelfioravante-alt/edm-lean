-- 16_auth_hardening.sql
-- Rate limit por IP nas RPCs públicas de auth/join + PIN mais rígido.
-- Idempotente.

create table if not exists public.rate_limit_auth (
  chave text primary key,
  contagem integer not null default 0,
  janela_inicio timestamptz not null default timezone('utc'::text, now()),
  bloqueado_ate timestamptz
);

alter table public.rate_limit_auth enable row level security;

-- Sem policies: só SECURITY DEFINER acessa (API direta fica bloqueada pelo RLS).

create or replace function public._client_ip()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(trim(split_part(coalesce(
      (nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for'),
      ''
    ), ',', 1)), ''),
    nullif(trim(coalesce(
      (nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip'),
      ''
    )), ''),
    nullif(trim(coalesce(
      (nullif(current_setting('request.headers', true), '')::json ->> 'x-real-ip'),
      ''
    )), ''),
    'unknown'
  );
$$;

create or replace function public.assert_rate_limit(
  p_acao text,
  p_max integer,
  p_janela interval,
  p_bloqueio interval
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text := p_acao || ':' || public._client_ip();
  v_row public.rate_limit_auth;
begin
  insert into public.rate_limit_auth (chave, contagem, janela_inicio, bloqueado_ate)
  values (v_chave, 0, timezone('utc'::text, now()), null)
  on conflict (chave) do nothing;

  select * into v_row from public.rate_limit_auth where chave = v_chave for update;

  if v_row.bloqueado_ate is not null and v_row.bloqueado_ate > timezone('utc'::text, now()) then
    raise exception 'Muitas tentativas deste IP. Aguarde alguns minutos e tente de novo.';
  end if;

  if v_row.janela_inicio < timezone('utc'::text, now()) - p_janela then
    update public.rate_limit_auth
    set contagem = 1,
        janela_inicio = timezone('utc'::text, now()),
        bloqueado_ate = null
    where chave = v_chave;
    return;
  end if;

  if v_row.contagem + 1 >= p_max then
    update public.rate_limit_auth
    set contagem = v_row.contagem + 1,
        bloqueado_ate = timezone('utc'::text, now()) + p_bloqueio
    where chave = v_chave;
    raise exception 'Muitas tentativas deste IP. Aguarde alguns minutos e tente de novo.';
  end if;

  update public.rate_limit_auth
  set contagem = v_row.contagem + 1
  where chave = v_chave;
end;
$$;

revoke all on function public.assert_rate_limit(text, integer, interval, interval) from public, anon, authenticated;
revoke all on function public._client_ip() from public, anon, authenticated;

-- Lookup de empresa no /join: 20 / 5 min por IP → bloqueio 15 min
create or replace function public.buscar_empresa_por_codigo(p_codigo text)
returns table (id uuid, nome_fantasia text)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_rate_limit('buscar_empresa', 20, interval '5 minutes', interval '15 minutes');

  return query
  select e.id, e.nome_fantasia
  from public.empresas e
  where e.codigo_convite = upper(trim(p_codigo))
  limit 1;
end;
$$;

grant execute on function public.buscar_empresa_por_codigo(text) to anon, authenticated;

-- Cadastro inicial: 8 / hora por IP → bloqueio 1 h
create or replace function public.registrar_conta_inicial(
  p_user_id uuid,
  p_email text,
  p_company_name_or_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(p_company_name_or_code);
  v_empresa_id uuid;
begin
  perform public.assert_rate_limit('registrar_conta', 8, interval '1 hour', interval '1 hour');

  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Usuário inválido.';
  end if;
  if auth.uid() is null and not exists (
    select 1 from auth.users
    where id = p_user_id and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'Usuário inválido.';
  end if;
  if exists (select 1 from public.perfis where id = p_user_id) then
    return;
  end if;
  if coalesce(v_nome, '') = '' then
    raise exception 'Informe o nome da empresa.';
  end if;

  insert into public.empresas (nome_fantasia, codigo_convite)
  values (v_nome, upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)))
  returning id into v_empresa_id;

  insert into public.perfis (id, empresa_id, nome, funcao)
  values (p_user_id, v_empresa_id, split_part(p_email, '@', 1), 'admin');
end;
$$;

grant execute on function public.registrar_conta_inicial(uuid, text, text) to anon, authenticated;

-- PIN: 3 falhas → 15 min; também rate limit por IP (30 / 5 min)
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
    perform public.assert_rate_limit('pin_join', 30, interval '5 minutes', interval '15 minutes');

    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Usuário não autenticado no Supabase Auth.';
    end if;

    v_code_upper := upper(trim(p_invite_code));

    select * into v_attempt from public.tentativas_login_pin where codigo_convite = v_code_upper;
    if v_attempt.bloqueado_ate is not null and now() < v_attempt.bloqueado_ate then
        raise exception 'Muitas tentativas incorretas. Terminal bloqueado temporariamente por 15 minutos.';
    end if;

    select * into v_empresa from public.empresas where codigo_convite = v_code_upper;
    if v_empresa.id is null then
        perform pg_sleep(0.8);
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
            perform pg_sleep(1.4);
            insert into public.tentativas_login_pin (codigo_convite, tentativas_falhas, atualizado_em)
            values (v_code_upper, 1, now())
            on conflict (codigo_convite) do update
            set tentativas_falhas = public.tentativas_login_pin.tentativas_falhas + 1,
                bloqueado_ate = case
                    when public.tentativas_login_pin.tentativas_falhas + 1 >= 3 then now() + interval '15 minutes'
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

grant execute on function public.vincular_acesso_por_pin(text, text) to authenticated;

-- Legado (fallback do app): mesmo critério de PIN
create or replace function public.vincular_perfil_operador(
    p_invite_code text,
    p_pin text,
    p_nome text default 'Terminal de Produção'
)
returns table (
    empresa_id uuid,
    nome_fantasia text,
    codigo_convite text,
    plano text,
    created_at timestamp with time zone
) as $$
declare
    v_empresa_id uuid;
    v_correct_pin text;
    v_user_id uuid;
    v_empresa public.empresas;
    v_code_upper text;
    v_attempt public.tentativas_login_pin;
begin
    perform public.assert_rate_limit('pin_join', 30, interval '5 minutes', interval '15 minutes');

    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Usuário não autenticado no Supabase Auth.';
    end if;

    v_code_upper := upper(trim(p_invite_code));

    select * into v_attempt from public.tentativas_login_pin where codigo_convite = v_code_upper;
    if v_attempt.bloqueado_ate is not null and now() < v_attempt.bloqueado_ate then
        raise exception 'Muitas tentativas incorretas. Terminal bloqueado temporariamente por 15 minutos.';
    end if;

    select * into v_empresa
    from public.empresas
    where codigo_convite = v_code_upper;

    if v_empresa.id is null then
        perform pg_sleep(0.8);
        raise exception 'Código de convite inválido.';
    end if;

    v_empresa_id := v_empresa.id;

    select pin_onboarding into v_correct_pin
    from public.configuracoes_empresa
    where empresa_id = v_empresa_id;

    if v_correct_pin is null then
        v_correct_pin := '1234';
    end if;

    if p_pin != v_correct_pin then
        perform pg_sleep(1.4);

        insert into public.tentativas_login_pin (codigo_convite, tentativas_falhas, atualizado_em)
        values (v_code_upper, 1, now())
        on conflict (codigo_convite) do update
        set tentativas_falhas = public.tentativas_login_pin.tentativas_falhas + 1,
            bloqueado_ate = case
                when public.tentativas_login_pin.tentativas_falhas + 1 >= 3 then now() + interval '15 minutes'
                else null
            end,
            atualizado_em = now();

        raise exception 'PIN de Segurança incorreto.';
    end if;

    insert into public.tentativas_login_pin (codigo_convite, tentativas_falhas, bloqueado_ate, atualizado_em)
    values (v_code_upper, 0, null, now())
    on conflict (codigo_convite) do update
    set tentativas_falhas = 0, bloqueado_ate = null, atualizado_em = now();

    insert into public.perfis (id, empresa_id, nome, funcao)
    values (v_user_id, v_empresa_id, coalesce(nullif(trim(p_nome), ''), 'Terminal de Produção'), 'operador')
    on conflict (id) do update
    set empresa_id = EXCLUDED.empresa_id,
        nome = EXCLUDED.nome,
        funcao = 'operador';

    return query
    select v_empresa.id, v_empresa.nome_fantasia, v_empresa.codigo_convite, v_empresa.plano, v_empresa.created_at;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.vincular_perfil_operador(text, text, text) to authenticated;
