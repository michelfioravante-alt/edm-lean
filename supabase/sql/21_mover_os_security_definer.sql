-- mover_os / pausar / retomar / etc. chamam os_gravar_linha (bypass de trigger).
-- os_gravar_linha NÃO deve ser executável por authenticated; os wrappers
-- precisam ser SECURITY DEFINER (dono postgres) para poder chamá-la.
-- Sem isso: "permission denied for function os_gravar_linha".

alter function public.os_gravar_linha(public.ordens_servico) owner to postgres;
alter function public.mover_os(uuid, text, jsonb) owner to postgres;
alter function public.pausar_os(uuid, text, text) owner to postgres;
alter function public.retomar_os(uuid) owner to postgres;
alter function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) owner to postgres;
alter function public.excluir_os(uuid) owner to postgres;

alter function public.mover_os(uuid, text, jsonb) security definer;
alter function public.pausar_os(uuid, text, text) security definer;
alter function public.retomar_os(uuid) security definer;
alter function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) security definer;
alter function public.excluir_os(uuid) security definer;

revoke all on function public.os_gravar_linha(public.ordens_servico) from public, anon, authenticated;

grant execute on function public.mover_os(uuid, text, jsonb) to authenticated;
grant execute on function public.pausar_os(uuid, text, text) to authenticated;
grant execute on function public.retomar_os(uuid) to authenticated;
grant execute on function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.excluir_os(uuid) to authenticated;
