-- Endurecimento multi-tenant: papel/empresa do perfil, PIN mestre, RPCs, prints e plano vencido.
-- Rodar depois do 13_ciclo_dados.sql. Idempotente.

-- --- 1. Perfis: ninguém escolhe a própria empresa nem se promove ---

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and funcao = 'admin' and empresa_id is not null
  );
$$;

-- Perfis só nascem pelas RPCs security definer (cadastro e vínculo por PIN).
drop policy if exists "Usuários inserem próprio perfil" on public.perfis;

drop policy if exists "Usuários atualizam próprio perfil" on public.perfis;
create policy "Usuários atualizam próprio perfil"
on public.perfis for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins atualizam perfis da mesma empresa" on public.perfis;
create policy "Admins atualizam perfis da mesma empresa"
on public.perfis for update
using (empresa_id = public.get_user_empresa_id() and public.usuario_e_admin())
with check (empresa_id = public.get_user_empresa_id() or empresa_id is null);

-- Sem security definer: current_user identifica chamadas diretas da API.
create or replace function public.proteger_colunas_perfil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Não é permitido alterar o id do perfil.';
  end if;

  if new.funcao is distinct from old.funcao and not public.usuario_e_admin() then
    raise exception 'Somente o gestor altera papéis.';
  end if;

  if new.empresa_id is distinct from old.empresa_id then
    if new.empresa_id is not null or old.id = auth.uid() or not public.usuario_e_admin() then
      raise exception 'Não é permitido trocar a empresa do perfil.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_colunas_perfil on public.perfis;
create trigger trg_proteger_colunas_perfil
  before update on public.perfis
  for each row execute function public.proteger_colunas_perfil();

-- --- 2. Configurações: PIN mestre e tarifas (R$/h) só para o gestor ---

drop policy if exists "Usuários veem configurações da própria empresa" on public.configuracoes_empresa;
create policy "Usuários veem configurações da própria empresa"
on public.configuracoes_empresa for select
using (empresa_id = public.get_user_empresa_id() and public.usuario_e_admin());

create or replace function public.buscar_configuracoes_empresa()
returns setof public.configuracoes_empresa
language sql
stable
security definer
set search_path = public
as $$
  select (jsonb_populate_record(
    null::public.configuracoes_empresa,
    case when public.usuario_e_admin() then to_jsonb(c)
         else to_jsonb(c) - array['pin_onboarding', 'custo_hora_maquina', 'custo_hora_cnc', 'custo_hora_edm']
    end
  )).*
  from public.configuracoes_empresa c
  where c.empresa_id = public.get_user_empresa_id()
  limit 1;
$$;

-- --- 3. RPCs ---

-- Oráculos de PIN sem limite de tentativas e sem uso no app.
drop function if exists public.verificar_pin_onboarding(text, text);
drop function if exists public.registrar_operador_com_pin(uuid, text, text);
drop function if exists public.buscar_convite_por_pin(text, text);

-- Estoque: a empresa vem sempre da sessão; emp_id fica na assinatura só por compatibilidade.
create or replace function public.movimentar_estoque(item_id uuid, delta int, emp_id uuid default null)
returns setof public.estoque_itens
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.estoque_itens
  set quantidade = greatest(quantidade + delta, 0)
  where id = item_id and empresa_id = public.get_user_empresa_id() and public.empresa_pode_escrever()
  returning *;
end;
$$;

create or replace function public.decrementar_estoque(item_id uuid, delta int default 1, emp_id uuid default null)
returns setof public.estoque_itens
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.estoque_itens
  set quantidade = greatest(quantidade - delta, 0)
  where id = item_id and empresa_id = public.get_user_empresa_id() and public.empresa_pode_escrever()
  returning *;
end;
$$;

-- Cadastro sempre cria uma empresa nova como admin. Entrar em fábrica existente só por código + PIN.
-- Sem sessão (confirmação de e-mail ligada) aceita apenas usuário recém-criado.
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

-- Por padrão o Postgres dá EXECUTE a PUBLIC (inclui anon) em toda função nova.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon', f.assinatura);
    execute format('grant execute on function %s to authenticated', f.assinatura);
  end loop;
end $$;

grant execute on function public.buscar_empresa_por_codigo(text) to anon;
grant execute on function public.registrar_conta_inicial(uuid, text, text) to anon;
-- Usadas dentro das policies: anon recebe vazio em vez de erro de permissão.
grant execute on function public.get_user_empresa_id() to anon;
grant execute on function public.usuario_e_admin() to anon;

-- --- 4. Prints: bucket privado, leitura só da própria empresa (URL assinada) ---

update storage.buckets set public = false where id = 'os-prints';

drop policy if exists "os_prints_public_read" on storage.objects;
drop policy if exists "os_prints_select_empresa" on storage.objects;
create policy "os_prints_select_empresa"
on storage.objects for select
to authenticated
using (
  bucket_id = 'os-prints'
  and (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

-- Links públicos antigos viram caminho no bucket.
update public.ordens_servico
set folha_imagem = split_part(split_part(folha_imagem, '/object/public/os-prints/', 2), '?', 1)
where folha_imagem like '%/object/public/os-prints/%';

-- --- 5. Valor orçado fora de ordens_servico: programador nunca vê preço ---
-- (ordens_servico é lida por toda a equipe e vai inteira no realtime)

create table if not exists public.os_valores (
  os_id uuid primary key references public.ordens_servico(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  valor_orcado numeric
);

create index if not exists idx_os_valores_empresa on public.os_valores (empresa_id);

alter table public.os_valores enable row level security;
drop policy if exists "os_valores_gestor" on public.os_valores;
create policy "os_valores_gestor"
on public.os_valores for all
to authenticated
using (empresa_id = public.get_user_empresa_id() and public.usuario_e_admin())
with check (
  empresa_id = public.get_user_empresa_id()
  and public.usuario_e_admin()
  and exists (select 1 from public.ordens_servico o where o.id = os_id and o.empresa_id = os_valores.empresa_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ordens_servico' and column_name = 'valor_orcado'
  ) then
    insert into public.os_valores (os_id, empresa_id, valor_orcado)
    select id, empresa_id, valor_orcado from public.ordens_servico where valor_orcado is not null
    on conflict (os_id) do nothing;
    alter table public.ordens_servico drop column valor_orcado;
  end if;
end $$;

-- --- 6. Plano piloto vencido (30 dias): empresa fica só leitura ---

create or replace function public.empresa_pode_escrever()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empresas e
    where e.id = public.get_user_empresa_id()
      and (e.plano is distinct from 'piloto' or e.created_at > now() - interval '30 days')
  );
$$;

grant execute on function public.empresa_pode_escrever() to authenticated;

do $$
declare
  t record;
begin
  for t in
    select c.relname as tabela
    from pg_class c
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'empresa_id' and not a.attisdropped
    where c.relnamespace = 'public'::regnamespace
      and c.relkind = 'r'
      and c.relrowsecurity
      and c.relname not in ('perfis', 'empresas')
  loop
    execute format('drop policy if exists plano_ativo_insert on public.%I', t.tabela);
    execute format('drop policy if exists plano_ativo_update on public.%I', t.tabela);
    execute format('drop policy if exists plano_ativo_delete on public.%I', t.tabela);
    execute format('create policy plano_ativo_insert on public.%I as restrictive for insert to authenticated with check (public.empresa_pode_escrever())', t.tabela);
    execute format('create policy plano_ativo_update on public.%I as restrictive for update to authenticated using (public.empresa_pode_escrever())', t.tabela);
    execute format('create policy plano_ativo_delete on public.%I as restrictive for delete to authenticated using (public.empresa_pode_escrever())', t.tabela);
  end loop;
end $$;
