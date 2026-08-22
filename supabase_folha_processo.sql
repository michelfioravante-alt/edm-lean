-- Folha de processo: observações de chão e print da peça (data URL ou link).
alter table public.ordens_servico add column if not exists observacoes text;
alter table public.ordens_servico add column if not exists folha_imagem text;
