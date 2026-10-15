-- ==========================================
-- CNC LEAN — Campos específicos do centro de usinagem
-- Execute DEPOIS de 01_schema.sql.
-- Idempotente: pode rodar quantas vezes quiser.
-- ==========================================

-- --- Ordens de Serviço ---

-- Multi-setup (OP10, OP20, virada de peça...)
alter table public.ordens_servico add column if not exists total_setups integer default 1;
alter table public.ordens_servico add column if not exists setup_atual integer default 1;
alter table public.ordens_servico add column if not exists nomes_setups jsonb default '[]'::jsonb;
alter table public.ordens_servico add column if not exists detalhes_setups jsonb default '[]'::jsonb;

-- Identificação de molde / programa CAM
alter table public.ordens_servico add column if not exists codigo_molde text;
alter table public.ordens_servico add column if not exists componente_molde text;
alter table public.ordens_servico add column if not exists numero_programa text;

-- Metadados da folha de processo importada (arquivo, ferramentas, operações)
alter table public.ordens_servico add column if not exists nx_import jsonb;

-- Caminho do programa CAM (diferente do desenho) e checklist de ferramentas do estoque
alter table public.ordens_servico add column if not exists link_programa text;
alter table public.ordens_servico add column if not exists checklist_ferramentas jsonb default '[]'::jsonb;

-- 'individual' = troca ferramenta a ferramenta | 'lote' = magazine montado no setup
alter table public.ordens_servico add column if not exists estrategia_ferramental text;

-- Peça enviada para tratamento térmico externo
alter table public.ordens_servico add column if not exists aguardando_tt boolean default false;
alter table public.ordens_servico add column if not exists observacao_tt text;

-- Fila do molde: import ZW3D fica fora do kanban do setor até liberar
alter table public.ordens_servico add column if not exists em_fila boolean default false;

-- --- Configurações da empresa ---

alter table public.configuracoes_empresa add column if not exists modo_magazine_default text default 'individual';
alter table public.configuracoes_empresa add column if not exists baixa_estoque_setup boolean default false;
