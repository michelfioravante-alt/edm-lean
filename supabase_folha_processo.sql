-- Folha de processo: observações de chão e URL do print (arquivo no bucket os-prints).
alter table public.ordens_servico add column if not exists observacoes text;
alter table public.ordens_servico add column if not exists folha_imagem text;
