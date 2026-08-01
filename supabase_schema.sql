-- ========================================================
-- EDM LEAN - SUPABASE INITIAL SCHEMA
-- Execute este script no "SQL Editor" do seu painel Supabase
-- ========================================================

-- 1. EXTENSÕES ÚTEIS
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. TABELAS BASE (MULTI-TENANT)
-- ==========================================

-- Tabela de Empresas (Tenants)
create table if not exists public.empresas (
    id uuid primary key default uuid_generate_v4(),
    nome_fantasia text not null,
    codigo_convite text unique, -- Código de 8 dígitos para operadores
    plano text default 'piloto',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante que a coluna exista caso a tabela já tenha sido criada antes
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='empresas' and column_name='codigo_convite') then
        alter table public.empresas add column codigo_convite text unique;
    end if;
end $$;

-- Política anterior removida: não expor mais todas as empresas publicamente
-- create policy "Busca pública de empresas por código"
-- on public.empresas for select
-- using (true);

-- Tabela de Perfis de Usuário (Estendendo a autenticação nativa)
create table public.perfis (
    id uuid primary key references auth.users(id) on delete cascade,
    empresa_id uuid references public.empresas(id) on delete set null,
    nome text not null,
    funcao text default 'operador', -- 'operador', 'gerente', 'admin'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Máquinas
create table public.maquinas (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    status text default 'Parada',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Estoque / Insumos
create table public.estoque_itens (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    quantidade integer default 0,
    alerta_minimo integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Clientes
create table public.clientes (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    email text,
    telefone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Operadores (Nomes para seleção, diferente dos Perfis de login)
create table public.operadores (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    funcao text default 'Operador',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Programadores
create table public.programadores (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Configurações da Empresa (Custo, Turnos, PIN Onboarding)
create table if not exists public.configuracoes_empresa (
    empresa_id uuid primary key references public.empresas(id) on delete cascade,
    custo_hora_maquina numeric default 50,
    turnos jsonb default '[{"id": "t1", "nome": "Turno 1", "inicio": "07:30", "fim": "15:30"}, {"id": "t2", "nome": "Turno 2", "inicio": "15:30", "fim": "23:30"}, {"id": "t3", "nome": "Turno 3", "inicio": "23:30", "fim": "07:30"}]'::jsonb,
    pin_onboarding text default '1234', -- PIN padrão para segurança do link Join
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante que a coluna pin_onboarding exista para migração
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='configuracoes_empresa' and column_name='pin_onboarding') then
        alter table public.configuracoes_empresa add column pin_onboarding text default '1234';
    end if;
end $$;

-- RLS para Configurações (PROTEGIDO: PIN nunca sai do servidor)
alter table public.configuracoes_empresa enable row level security;
create policy "Usuários veem configurações da própria empresa"
    on public.configuracoes_empresa
    for select
    using (empresa_id = get_user_empresa_id());

-- Apenas admins da empresa podem criar/alterar configurações
create policy "Admins atualizam configuracoes da empresa"
    on public.configuracoes_empresa
    for all
    using (
        empresa_id = get_user_empresa_id()
        and exists (
            select 1
            from public.perfis p
            where p.id = auth.uid()
              and p.empresa_id = get_user_empresa_id()
              and p.funcao = 'admin'
        )
    )
    with check (
        empresa_id = get_user_empresa_id()
        and exists (
            select 1
            from public.perfis p
            where p.id = auth.uid()
              and p.empresa_id = get_user_empresa_id()
              and p.funcao = 'admin'
        )
    );
-- create policy "Acesso público ao PIN para Onboarding" on public.configuracoes_empresa for select using (true); -- REMOVIDA PARA SEGURANÇA MÁXIMA

-- Tabela de Histórico de Consumíveis / Trocas
create table public.historico_consumiveis (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    maquina_id uuid references public.maquinas(id) on delete set null,
    item_nome text not null,
    operador_nome text,
    data_instalacao timestamp with time zone default timezone('utc'::text, now()) not null,
    data_fim timestamp with time zone,
    horas_produzidas numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Kanbans Automáticos
create table if not exists public.kanbans_automaticos (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    tipo text not null,
    descricao text,
    maquina_nome text,
    dias_intervalo integer default 0,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela Principal: Ordens de Serviço (Kanban)
create table public.ordens_servico (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    
    -- Dados Básicos
    codigo_peca text not null,
    cliente text,
    link_desenho text,
    is_prioridade boolean default false,
    
    -- Status no Kanban
    status text default 'A fazer' not null,
    maquina_nome text, -- Para compatibilidade simples com o front atual, ideal seria maquina_id
    operador_atual text, -- Nome do operador que puxou para a máquina
    
    -- Tempos Estimados
    tempo_estimado_corte_horas integer default 0,
    tempo_estimado_corte_minutos integer default 0,
    tempo_estimado_setup_horas integer default 0,
    tempo_estimado_setup_minutos integer default 0,
    
    prazo_entrega timestamp with time zone,
    programador text,
    
    -- Controle de Estado
    is_pausado boolean default false,
    data_pausa timestamp with time zone,
    motivo_pausa text,
    observacao_pausa text,
    resultado_afericao text,
    motivo_refugo text,
    
    -- Controle de Lote e Ordem
    quantidade integer default 1,
    quantidade_concluida integer default 0,
    posicao integer,
    parent_id uuid references public.ordens_servico(id) on delete set null,
    
    -- Timestamps de Transição (Vital para Lead Time)
    timestamp_entrada_setup timestamp with time zone,
    timestamp_entrada_emcorte timestamp with time zone,
    timestamp_entrada_afericao timestamp with time zone,
    timestamp_entrada_concluido timestamp with time zone,
    
    -- JSON para flexibilidade sem quebrar o esquema
    tempos_fases jsonb default '{"setup": 0, "emCorte": 0, "afericao": 0}'::jsonb,
    historico_pausas jsonb default '[]'::jsonb,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante que a coluna programador exista para migração
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='ordens_servico' and column_name='programador') then
        alter table public.ordens_servico add column programador text;
    end if;
end $$;


-- ==========================================
-- 3. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Ativar RLS em todas as tabelas
alter table public.empresas enable row level security;
create policy "Usuários veem a própria empresa"
    on public.empresas for select
    using (id = get_user_empresa_id());
alter table public.perfis enable row level security;
alter table public.maquinas enable row level security;
alter table public.estoque_itens enable row level security;
alter table public.ordens_servico enable row level security;

-- Criar Políticas (Policies)
-- A REGRA DE OURO: O usuário só pode ler/escrever dados onde o empresa_id for igual ao empresa_id atrelado ao seu perfil logado.

-- Função Auxiliar para pegar a Empresa do Usuário Logado
create or replace function public.get_user_empresa_id()
returns uuid as $$
  select empresa_id from public.perfis where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- --- Políticas de Ordens de Serviço ---
create policy "Usuários veem apenas OS da sua empresa" 
on public.ordens_servico for select 
using (empresa_id = get_user_empresa_id());

create policy "Usuários inserem OS na sua empresa" 
on public.ordens_servico for insert 
with check (empresa_id = get_user_empresa_id());

create policy "Usuários atualizam OS da sua empresa" 
on public.ordens_servico for update 
using (empresa_id = get_user_empresa_id());

create policy "Usuários deletam OS da sua empresa" 
on public.ordens_servico for delete 
using (empresa_id = get_user_empresa_id());

-- --- Políticas de Máquinas ---
create policy "Usuários veem apenas Máquinas da sua empresa" 
on public.maquinas for all 
using (empresa_id = get_user_empresa_id());

-- --- Políticas de Estoque ---
create policy "Usuários veem apenas Estoque da sua empresa" 
on public.estoque_itens for all 
using (empresa_id = get_user_empresa_id());

-- --- Políticas de Perfis ---
create policy "Usuários veem perfis da mesma empresa" 
on public.perfis for select 
using (empresa_id = get_user_empresa_id());

-- Permite criar perfil próprio (login operador anônimo)
create policy "Usuários inserem próprio perfil" 
on public.perfis for insert 
with check (id = (select auth.uid()));

create policy "Usuários atualizam próprio perfil" 
on public.perfis for update 
using (id = (select auth.uid()));

create policy "Admins atualizam perfis da mesma empresa"
on public.perfis for update
using (
    empresa_id = get_user_empresa_id()
    and exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.empresa_id = get_user_empresa_id()
          and p.funcao = 'admin'
    )
);

-- --- Políticas de Clientes ---
create policy "Usuários veem apenas Clientes da sua empresa" 
on public.clientes for all 
using (empresa_id = get_user_empresa_id());

create policy "Usuários veem apenas Operadores da sua empresa" 
on public.operadores for select 
using (empresa_id = get_user_empresa_id());

-- Admins/usuários da empresa podem inserir operadores (Configurações)
create policy "Usuários inserem Operadores na sua empresa" 
on public.operadores for insert 
with check (empresa_id = get_user_empresa_id());

create policy "Usuários atualizam Operadores da sua empresa" 
on public.operadores for update 
using (empresa_id = get_user_empresa_id());

create policy "Usuários deletam Operadores da sua empresa" 
on public.operadores for delete 
using (empresa_id = get_user_empresa_id());

-- ==========================================
-- 6. FUNÇÕES SEGURAS (RPC)
-- ==========================================

-- Busca operadores da empresa do usuário logado (bypass RLS - funciona com operador anônimo)
create or replace function public.buscar_operadores_empresa()
returns setof public.operadores as $$
    select * from public.operadores
    where empresa_id = get_user_empresa_id()
    order by created_at asc;
$$ language sql stable security definer set search_path = public;

create or replace function public.buscar_programadores_empresa()
returns setof public.programadores as $$
    select * from public.programadores
    where empresa_id = get_user_empresa_id()
    order by created_at asc;
$$ language sql stable security definer set search_path = public;

-- Busca máquinas da empresa do usuário logado (bypass RLS)
create or replace function public.buscar_maquinas_empresa()
returns setof public.maquinas as $$
    select * from public.maquinas
    where empresa_id = get_user_empresa_id()
    order by created_at asc;
$$ language sql stable security definer set search_path = public;

-- Busca configurações da empresa do usuário logado (bypass RLS)
create or replace function public.buscar_configuracoes_empresa()
returns setof public.configuracoes_empresa as $$
    select * from public.configuracoes_empresa
    where empresa_id = get_user_empresa_id()
    limit 1;
$$ language sql stable security definer set search_path = public;

-- Busca estoque da empresa do usuário logado (bypass RLS)
create or replace function public.buscar_estoque_empresa()
returns setof public.estoque_itens as $$
    select * from public.estoque_itens
    where empresa_id = get_user_empresa_id()
    order by nome asc;
$$ language sql stable security definer set search_path = public;

-- Decremento atômico de item no estoque
create or replace function public.decrementar_estoque(
    item_id uuid,
    delta integer default 1,
    emp_id uuid default null
)
returns setof public.estoque_itens as $$
declare
    v_empresa_id uuid;
begin
    v_empresa_id := coalesce(emp_id, get_user_empresa_id());
    return query
    update public.estoque_itens
    set quantidade = greatest(quantidade - delta, 0)
    where id = item_id and empresa_id = v_empresa_id
    returning *;
end;
$$ language plpgsql security definer set search_path = public;

-- Cria cliente na empresa do usuário logado (bypass RLS - funciona com operador anônimo no mobile)
create or replace function public.criar_cliente_empresa(
    p_nome text,
    p_email text default null,
    p_telefone text default null
)
returns public.clientes as $$
declare
    v_empresa_id uuid;
    v_cliente public.clientes;
begin
    v_empresa_id := get_user_empresa_id();
    if v_empresa_id is null then
        raise exception 'Usuário não autenticado';
    end if;
    insert into public.clientes (empresa_id, nome, email, telefone)
    values (v_empresa_id, trim(p_nome), nullif(trim(p_email), ''), nullif(trim(p_telefone), ''))
    returning * into v_cliente;
    return v_cliente;
end;
$$ language plpgsql security definer set search_path = public;

-- Busca empresa por código de convite, expondo apenas id e nome_fantasia
create or replace function public.buscar_empresa_por_codigo(
    p_codigo text
)
returns table (id uuid, nome_fantasia text) as $$
begin
    return query
    select e.id, e.nome_fantasia
    from public.empresas e
    where e.codigo_convite = upper(p_codigo);
end;
$$ language plpgsql security definer set search_path = public;

-- Verifica se o PIN de onboarding é válido para um determinado código de convite.
-- Retorna TRUE se o PIN estiver correto, FALSE caso contrário.
create or replace function public.verificar_pin_onboarding(
    p_invite_code text,
    p_pin text
)
returns boolean as $$
declare
    v_empresa_id uuid;
    v_correct_pin text;
begin
    -- 1. Localiza a empresa pelo código de convite
    select id into v_empresa_id
    from public.empresas
    where codigo_convite = upper(p_invite_code);

    if v_empresa_id is null then
        -- Código de convite inválido
        return false;
    end if;

    -- 2. Busca o PIN configurado para a empresa
    select pin_onboarding into v_correct_pin
    from public.configuracoes_empresa
    where empresa_id = v_empresa_id;

    -- Se não houver config, usa o default '1234'
    if v_correct_pin is null then
        v_correct_pin := '1234';
    end if;

    -- 3. Compara o PIN informado com o PIN correto
    if p_pin = v_correct_pin then
        return true;
    else
        return false;
    end if;
end;
$$ language plpgsql security definer set search_path = public;

-- Função para registrar operador validando o PIN no SERVIDOR (Máxima Segurança)
create or replace function public.registrar_operador_com_pin(
    p_empresa_id uuid,
    p_nome text,
    p_pin text
)
returns void as $$
declare
    v_correct_pin text;
begin
    -- 1. Busca o PIN configurado para a empresa
    select pin_onboarding into v_correct_pin 
    from public.configuracoes_empresa 
    where empresa_id = p_empresa_id;

    -- Se não houver config, usa o default '1234'
    if v_correct_pin is null then
        v_correct_pin := '1234';
    end if;

    -- 2. Valida o PIN (Comparação no servidor)
    if p_pin != v_correct_pin then
        raise exception 'PIN de Segurança incorreto.';
    end if;

    -- 3. Se estiver correto, realiza a inserção
    insert into public.operadores (empresa_id, nome, funcao)
    values (p_empresa_id, p_nome, 'Operador');
end;
$$ language plpgsql security definer set search_path = public;

-- Tabela para rastreamento de tentativas e bloqueio por força bruta
create table if not exists public.tentativas_login_pin (
    codigo_convite text primary key,
    tentativas_falhas integer default 0,
    bloqueado_ate timestamp with time zone,
    atualizado_em timestamp with time zone default timezone('utc'::text, now())
);

alter table public.tentativas_login_pin enable row level security;

-- Função segura para vincular o perfil do operador anônimo validando o PIN no SERVIDOR (com Proteção Anti Força Bruta)
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
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Usuário não autenticado no Supabase Auth.';
    end if;

    v_code_upper := upper(trim(p_invite_code));

    select * into v_attempt from public.tentativas_login_pin where codigo_convite = v_code_upper;
    if v_attempt.bloqueado_ate is not null and now() < v_attempt.bloqueado_ate then
        raise exception 'Muitas tentativas incorretas. Terminal bloqueado temporariamente por 5 minutos.';
    end if;

    select * into v_empresa
    from public.empresas
    where codigo_convite = v_code_upper;

    if v_empresa.id is null then
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


-- ==========================================
-- FUNÇÃO RPC PARA CADASTRO INICIAL (SEGURANÇA BYPASS)
-- ==========================================
-- Essa função é chamada logo após o supabase.auth.signUp() no frontend.
-- Como ela roda com 'security definer', ela pode inserir a Empresa e o Perfil
-- do usuário mesmo que ele ainda não tenha confirmado o e-mail (e portanto não 
-- tenha uma sessão ativa válida para o RLS).
create or replace function public.registrar_conta_inicial(
    p_user_id uuid,
    p_email text,
    p_company_name_or_code text
)
returns void as $$
declare
    v_input text;
    v_empresa_id uuid;
    v_role text := 'admin';
    v_existing_company record;
    v_codigo_convite text;
begin
    v_input := trim(p_company_name_or_code);

    -- 1. Verifica se já existe um perfil para este usuário
    if exists (select 1 from public.perfis where id = p_user_id) then
        return; -- Já registrado
    end if;

    -- 2. Só trata como CÓDIGO de convite se for exatamente 8 caracteres alfanuméricos (ex: ABCD1234).
    --    (evita que nome de empresa com 8 letras, ex: "MinhaFabr", vire convite e vire operador)
    if length(v_input) = 8 and upper(v_input) ~ '^[A-Z0-9]{8}$' then
        select id into v_empresa_id
        from public.empresas
        where codigo_convite = upper(v_input)
        limit 1;

        if v_empresa_id is not null then
            v_role := 'operador';
        end if;
    end if;

    -- 3. Se não achamos empresa pelo código, criamos uma nova
    if v_empresa_id is null then
        -- Gera um código de convite aleatório de 8 caracteres
        v_codigo_convite := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

        insert into public.empresas (nome_fantasia, codigo_convite)
        values (v_input, v_codigo_convite)
        returning id into v_empresa_id;
    end if;

    -- 4. Cria o Perfil vinculado à empresa
    insert into public.perfis (id, empresa_id, nome, funcao)
    values (
        p_user_id, 
        v_empresa_id, 
        split_part(p_email, '@', 1), 
        v_role
    );
end;
$$ language plpgsql security definer set search_path = public;

create policy "Usuários veem apenas Programadores da sua empresa" 
on public.programadores for all 
using (empresa_id = get_user_empresa_id());

-- --- Políticas de Kanban Automático ---
create policy "Usuários veem apenas Kanban Auto da sua empresa" 
on public.kanbans_automaticos for all 
using (empresa_id = get_user_empresa_id());

-- --- Políticas de Histórico Consumíveis ---
create policy "Usuários veem apenas Histórico da sua empresa" 
on public.historico_consumiveis for all 
using (empresa_id = get_user_empresa_id());

-- ==========================================
-- 4. ATIVAR RLS NAS NOVAS TABELAS
-- ==========================================
alter table public.clientes enable row level security;
alter table public.operadores enable row level security;
alter table public.programadores enable row level security;
alter table public.kanbans_automaticos enable row level security;
alter table public.historico_consumiveis enable row level security;


-- ==========================================
-- 4. REALTIME (Sincronização Websocket)
-- ==========================================
-- Avisar o Supabase para disparar eventos nessas tabelas
alter publication supabase_realtime add table public.ordens_servico;
alter publication supabase_realtime add table public.maquinas;
alter publication supabase_realtime add table public.operadores;
alter publication supabase_realtime add table public.programadores;
alter publication supabase_realtime add table public.clientes;
alter publication supabase_realtime add table public.estoque_itens;
alter publication supabase_realtime add table public.historico_consumiveis;

-- ==========================================
-- 5. DADOS FALSOS INICIAIS (SEED) PARA SUA EMPRESA PILOTO
-- ==========================================
/* Descomente os blocos abaixo caso queira popular com 1 dados teste rápido

-- Substitua 'uuid-da-empresa' após criar a primeira e o primeiro usuário!
-- insert into public.empresas (nome_fantasia) values ('Minha Fábrica Piloto');
-- *Lembre de adicionar o ID gerado da empresa no seu usuário em Auth -> Users.*

*/

-- ==========================================
-- 6. OTIMIZAÇÃO DE PERFORMANCE: ÍNDICES
-- ==========================================
create index if not exists idx_perfis_empresa_id on public.perfis(empresa_id);
create index if not exists idx_maquinas_empresa_id on public.maquinas(empresa_id);
create index if not exists idx_estoque_itens_empresa_id on public.estoque_itens(empresa_id);
create index if not exists idx_clientes_empresa_id on public.clientes(empresa_id);
create index if not exists idx_operadores_empresa_id on public.operadores(empresa_id);
create index if not exists idx_programadores_empresa_id on public.programadores(empresa_id);
create index if not exists idx_historico_consumiveis_empresa_id on public.historico_consumiveis(empresa_id);
create index if not exists idx_ordens_servico_empresa_id on public.ordens_servico(empresa_id);
create index if not exists idx_kanbans_automaticos_empresa_id on public.kanbans_automaticos(empresa_id);

-- Índice composto para acelerar buscas e ordenações do Kanban
create index if not exists idx_ordens_servico_empresa_status_pos on public.ordens_servico(empresa_id, status, posicao);

-- Índices adicionais para chaves estrangeiras (Foreign Keys)
create index if not exists idx_historico_consumiveis_maquina_id on public.historico_consumiveis(maquina_id);
create index if not exists idx_ordens_servico_parent_id on public.ordens_servico(parent_id);

