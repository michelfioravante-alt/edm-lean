-- Completa o ciclo de dados: colunas/FKs/índices/tabelas de auditoria que o app já espera.
-- Idempotente. Não apaga dados.

-- --- O.S. ---
alter table public.ordens_servico
  add column if not exists checklist_ferramentas jsonb default '[]'::jsonb,
  add column if not exists link_programa text,
  add column if not exists atualizado_em timestamptz default timezone('utc'::text, now());

create index if not exists idx_os_empresa_status on public.ordens_servico (empresa_id, status);
create index if not exists idx_os_empresa_setor on public.ordens_servico (empresa_id, setor);
create index if not exists idx_os_grupo on public.ordens_servico (empresa_id, os_grupo_id);
create index if not exists idx_os_parent on public.ordens_servico (parent_id);

comment on column public.ordens_servico.parent_id is 'O.S. de origem quando is_retrabalho = true.';
comment on column public.ordens_servico.is_retrabalho is 'Kanban gerado a partir de refugo da O.S. em parent_id.';
comment on column public.ordens_servico.os_grupo_id is 'Agrupa kanbans da mesma O.S. mãe / molde.';
comment on column public.ordens_servico.checklist_ferramentas is 'IDs/nomes de SKUs do estoque ligados ao setup.';
comment on column public.ordens_servico.link_programa is 'Caminho do programa CAM na rede, distinto do desenho.';

-- --- Config / estoque / ferramental ---
alter table public.configuracoes_empresa
  add column if not exists etapas_personalizadas jsonb default '[]'::jsonb;

alter table public.estoque_itens
  add column if not exists unidade text default 'un';

alter table public.ferramental
  add column if not exists estoque_item_id uuid references public.estoque_itens(id) on delete set null;

create index if not exists idx_ferramental_estoque_item on public.ferramental (estoque_item_id);

-- --- Auditoria de ciclo da O.S. ---
create table if not exists public.os_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  tipo text not null,
  de_status text,
  para_status text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_os_eventos_os on public.os_eventos (os_id, created_at desc);
create index if not exists idx_os_eventos_empresa on public.os_eventos (empresa_id, created_at desc);

alter table public.os_eventos enable row level security;

drop policy if exists "os_eventos_select" on public.os_eventos;
create policy "os_eventos_select" on public.os_eventos for select
  using (empresa_id = public.get_user_empresa_id());

drop policy if exists "os_eventos_insert" on public.os_eventos;
create policy "os_eventos_insert" on public.os_eventos for insert
  with check (empresa_id = public.get_user_empresa_id());

create or replace function public.trg_os_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_os_atualizado_em on public.ordens_servico;
create trigger trg_os_atualizado_em
  before insert or update on public.ordens_servico
  for each row execute function public.trg_os_atualizado_em();

create or replace function public.trg_os_ciclo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.os_eventos (empresa_id, os_id, tipo, para_status, payload)
    values (
      new.empresa_id,
      new.id,
      case when coalesce(new.is_retrabalho, false) then 'retrabalho_criado' else 'criado' end,
      new.status,
      jsonb_build_object(
        'parent_id', new.parent_id,
        'os_grupo_id', new.os_grupo_id,
        'setor', new.setor,
        'quantidade', new.quantidade
      )
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.os_eventos (empresa_id, os_id, tipo, de_status, para_status, payload)
    values (
      new.empresa_id,
      new.id,
      'status',
      old.status,
      new.status,
      jsonb_build_object(
        'resultado_afericao', new.resultado_afericao,
        'motivo_refugo', new.motivo_refugo,
        'maquina_nome', new.maquina_nome,
        'setup_atual', new.setup_atual
      )
    );
  elsif new.resultado_afericao is distinct from old.resultado_afericao
        and new.resultado_afericao is not null then
    insert into public.os_eventos (empresa_id, os_id, tipo, de_status, para_status, payload)
    values (
      new.empresa_id,
      new.id,
      'afericao',
      old.status,
      new.status,
      jsonb_build_object('resultado', new.resultado_afericao, 'motivo', new.motivo_refugo)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_os_ciclo on public.ordens_servico;
create trigger trg_os_ciclo
  after insert or update on public.ordens_servico
  for each row execute function public.trg_os_ciclo();

-- --- Movimentações de estoque ---
create table if not exists public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  item_nome text not null,
  tipo text not null,
  quantidade integer not null,
  quantidade_resultante integer,
  motivo text,
  operador_nome text,
  observacao text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.movimentacoes_estoque enable row level security;
drop policy if exists "mov_est_select" on public.movimentacoes_estoque;
create policy "mov_est_select" on public.movimentacoes_estoque for select
  using (empresa_id = public.get_user_empresa_id());
drop policy if exists "mov_est_insert" on public.movimentacoes_estoque;
create policy "mov_est_insert" on public.movimentacoes_estoque for insert
  with check (empresa_id = public.get_user_empresa_id());
create index if not exists idx_mov_est_empresa on public.movimentacoes_estoque (empresa_id, created_at desc);

create or replace function public.movimentar_estoque(item_id uuid, delta int, emp_id uuid)
returns setof public.estoque_itens
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.estoque_itens
  set quantidade = greatest(quantidade + delta, 0)
  where id = item_id and empresa_id = emp_id
  returning *;
end;
$$;

create or replace function public.decrementar_estoque(item_id uuid, delta int default 1, emp_id uuid default null)
returns setof public.estoque_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp uuid;
begin
  v_emp := coalesce(emp_id, public.get_user_empresa_id());
  return query
  update public.estoque_itens
  set quantidade = greatest(quantidade - delta, 0)
  where id = item_id and empresa_id = v_emp
  returning *;
end;
$$;

create or replace function public.buscar_estoque_empresa()
returns setof public.estoque_itens
language sql
stable
security definer
set search_path = public
as $$
  select * from public.estoque_itens
  where empresa_id = public.get_user_empresa_id()
  order by nome;
$$;

create or replace function public.buscar_configuracoes_empresa()
returns setof public.configuracoes_empresa
language sql
stable
security definer
set search_path = public
as $$
  select * from public.configuracoes_empresa
  where empresa_id = public.get_user_empresa_id()
  limit 1;
$$;

grant execute on function public.movimentar_estoque(uuid, int, uuid) to authenticated;
grant execute on function public.decrementar_estoque(uuid, int, uuid) to authenticated;
grant execute on function public.buscar_estoque_empresa() to authenticated;
grant execute on function public.buscar_configuracoes_empresa() to authenticated;

-- --- Quebras de insumo (ciclo estoque ↔ máquina ↔ O.S.) ---
create table if not exists public.historico_quebras_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  item_nome text,
  maquina_nome text,
  operador_nome text,
  codigo_peca text,
  os_id uuid references public.ordens_servico(id) on delete set null,
  observacao text,
  hora_inicio timestamptz,
  hora_fim timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.historico_quebras_estoque enable row level security;
drop policy if exists "hqe_all" on public.historico_quebras_estoque;
create policy "hqe_all" on public.historico_quebras_estoque for all
  using (empresa_id = public.get_user_empresa_id())
  with check (empresa_id = public.get_user_empresa_id());

-- --- Ferramenta montada na máquina ---
create table if not exists public.ferramentas_maquina (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  maquina_id uuid references public.maquinas(id) on delete set null,
  maquina_nome text,
  estoque_item_id uuid references public.estoque_itens(id) on delete set null,
  item_nome text,
  os_id uuid references public.ordens_servico(id) on delete set null,
  codigo_peca text,
  posicao text,
  quantidade integer default 1,
  motivo text,
  operador_nome text,
  instalado_em timestamptz default timezone('utc'::text, now()),
  removido_em timestamptz,
  motivo_remocao text,
  ativo boolean default true
);

alter table public.ferramentas_maquina enable row level security;
drop policy if exists "ftm_all" on public.ferramentas_maquina;
create policy "ftm_all" on public.ferramentas_maquina for all
  using (empresa_id = public.get_user_empresa_id())
  with check (empresa_id = public.get_user_empresa_id());
create index if not exists idx_ftm_ativas on public.ferramentas_maquina (empresa_id, ativo) where ativo = true;

-- --- Convites por PIN ---
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
  on public.convites_acesso (empresa_id, pin) where ativo = true;

alter table public.convites_acesso enable row level security;
drop policy if exists "Equipe ve convites da empresa" on public.convites_acesso;
create policy "Equipe ve convites da empresa" on public.convites_acesso for select
  using (empresa_id = public.get_user_empresa_id());
drop policy if exists "Gestores gerenciam convites" on public.convites_acesso;
create policy "Gestores gerenciam convites" on public.convites_acesso for all
  using (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.empresa_id = convites_acesso.empresa_id and p.funcao = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.empresa_id = convites_acesso.empresa_id and p.funcao = 'admin'
    )
  );

-- Piloto: cadastro entra sem confirmar e-mail (desligar no dashboard quando for a produção)
create or replace function public.trg_auth_auto_confirm()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists trg_auth_auto_confirm on auth.users;
create trigger trg_auth_auto_confirm
  before insert on auth.users
  for each row execute function public.trg_auth_auto_confirm();

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
