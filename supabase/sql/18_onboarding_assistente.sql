-- 18) Assistente de fábrica — flag de onboarding por empresa
-- Aplicar no projeto após 17_regras_no_banco.sql

alter table public.configuracoes_empresa
  add column if not exists onboarding_concluido boolean not null default false;

-- Empresas que já têm máquina + operador não precisam do wizard automático
update public.configuracoes_empresa c
set onboarding_concluido = true
where c.onboarding_concluido = false
  and exists (select 1 from public.maquinas m where m.empresa_id = c.empresa_id)
  and exists (select 1 from public.operadores o where o.empresa_id = c.empresa_id);

create or replace function public.marcar_onboarding_concluido(p_concluido boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_user_empresa_id() is null then
    raise exception 'Sessão sem empresa.';
  end if;
  if not public.usuario_e_admin() then
    raise exception 'Somente o gestor pode alterar o onboarding.';
  end if;
  if not public.empresa_pode_escrever() then
    raise exception 'Plano sem permissão de escrita.';
  end if;

  insert into public.configuracoes_empresa (empresa_id, onboarding_concluido)
  values (public.get_user_empresa_id(), coalesce(p_concluido, true))
  on conflict (empresa_id) do update
  set onboarding_concluido = excluded.onboarding_concluido;
end;
$$;

revoke all on function public.marcar_onboarding_concluido(boolean) from public;
grant execute on function public.marcar_onboarding_concluido(boolean) to authenticated;
