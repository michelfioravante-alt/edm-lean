-- 19) Persiste última execução das rotinas automáticas (evita O.S. MANUT duplicada após F5)

alter table public.kanbans_automaticos
  add column if not exists ultima_execucao timestamptz;

update public.kanbans_automaticos
set ultima_execucao = criado_em
where ultima_execucao is null;
