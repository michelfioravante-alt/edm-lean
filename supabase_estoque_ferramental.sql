-- SKU (caixa) × instância (ferramental). Idempotente.

alter table public.estoque_itens add column if not exists unidade text default 'un';

alter table public.ferramental add column if not exists estoque_item_id uuid references public.estoque_itens(id) on delete set null;

create index if not exists idx_ferramental_estoque_item on public.ferramental(estoque_item_id);
