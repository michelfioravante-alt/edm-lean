-- 17_regras_no_banco.sql
-- Fecha bypass do front: estado da OS só via RPC; estoque qty só via RPC;
-- convites PIN só gestor; mover_os valida transição + máquina.
-- Rodar depois do 16. Idempotente.

-- ---------------------------------------------------------------------------
-- 1) Bypass flags + proteção de colunas de estado na OS
-- ---------------------------------------------------------------------------
create or replace function public.os_rpc_ativo()
returns boolean
language sql
stable
as $$
  select coalesce(nullif(current_setting('edm.os_rpc', true), ''), '') = 'on';
$$;

create or replace function public.trg_os_proteger_estado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.os_rpc_ativo() then
    return new;
  end if;

  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'Não é permitido alterar a empresa da O.S.';
  end if;

  if new.status is distinct from old.status
     or new.tempos_fases is distinct from old.tempos_fases
     or new.historico_pausas is distinct from old.historico_pausas
     or new.is_pausado is distinct from old.is_pausado
     or new.data_pausa is distinct from old.data_pausa
     or new.motivo_pausa is distinct from old.motivo_pausa
     or new.observacao_pausa is distinct from old.observacao_pausa
     or new.timestamp_entrada_setup is distinct from old.timestamp_entrada_setup
     or new.timestamp_entrada_emcorte is distinct from old.timestamp_entrada_emcorte
     or new.timestamp_entrada_afericao is distinct from old.timestamp_entrada_afericao
     or new.timestamp_entrada_concluido is distinct from old.timestamp_entrada_concluido
  then
    raise exception 'Estado da O.S. (status/tempos/pausas) só muda pelo fluxo oficial (mover/pausar/excluir).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_os_proteger_estado on public.ordens_servico;
create trigger trg_os_proteger_estado
  before update on public.ordens_servico
  for each row
  execute function public.trg_os_proteger_estado();

revoke execute on function public.trg_os_proteger_estado() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) os_gravar_linha: liga bypass; NÃO conceder a authenticated
-- ---------------------------------------------------------------------------
create or replace function public.os_gravar_linha(p_os public.ordens_servico)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_colunas text;
  v_linha public.ordens_servico;
begin
  perform set_config('edm.os_rpc', 'on', true);

  select string_agg(quote_ident(attname), ', ' order by attnum)
    into v_colunas
  from pg_attribute
  where attrelid = 'public.ordens_servico'::regclass
    and attnum > 0
    and not attisdropped
    and attname <> 'id';

  execute format(
    'update public.ordens_servico set (%1$s) = (select %1$s from jsonb_populate_record(null::public.ordens_servico, $1)) where id = $2 returning *',
    v_colunas
  ) into v_linha using to_jsonb(p_os), p_os.id;
  return v_linha;
end;
$$;

revoke all on function public.os_gravar_linha(public.ordens_servico) from public, anon, authenticated;

-- Soft delete oficial
create or replace function public.excluir_os(p_os_id uuid)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
begin
  if not public.empresa_pode_escrever() then
    raise exception 'Plano/piloto não permite escrita.';
  end if;

  select * into v_os
  from public.ordens_servico
  where id = p_os_id and empresa_id = public.get_user_empresa_id()
  for update;

  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  perform set_config('edm.os_rpc', 'on', true);
  update public.ordens_servico
  set status = 'Excluído'
  where id = p_os_id
  returning * into v_os;

  return v_os;
end;
$$;

revoke all on function public.excluir_os(uuid) from public, anon;
grant execute on function public.excluir_os(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) mover_os com regras de transição + máquina ocupada
-- ---------------------------------------------------------------------------
create or replace function public.os_transicao_permitida(p_origem text, p_destino text)
returns boolean
language sql
immutable
as $$
  select case
    when p_origem is null or p_destino is null then false
    when p_origem = p_destino then true
    when p_origem = 'concluido' then false
    when p_origem = 'aFazer' and p_destino in ('setup', 'emCorte', 'afericao') then true
    when p_origem = 'setup' and p_destino in ('aFazer', 'emCorte', 'afericao') then true
    when p_origem = 'emCorte' and p_destino in ('aFazer', 'setup', 'afericao', 'concluido') then true
    when p_origem = 'afericao' and p_destino in ('aFazer', 'setup', 'concluido') then true
    else false
  end;
$$;

create or replace function public.mover_os(p_os_id uuid, p_destino text, p_campos jsonb default '{}'::jsonb)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
  v_agora timestamptz := now();
  v_status text := public.os_status_da_coluna(p_destino);
  v_origem text;
  v_entrada timestamptz;
  v_campos jsonb := public.os_campos_livres(p_campos);
  v_horas numeric;
  v_maquina text;
  v_ocupada boolean;
begin
  if not public.empresa_pode_escrever() then
    raise exception 'Plano/piloto não permite escrita.';
  end if;

  if v_status is null then
    raise exception 'Coluna de destino inválida: %', p_destino;
  end if;

  select * into v_os
  from public.ordens_servico
  where id = p_os_id and empresa_id = public.get_user_empresa_id()
  for update;

  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  if v_os.status = 'Excluído' then
    raise exception 'O.S. excluída não pode ser movida.';
  end if;

  if coalesce(v_os.em_fila, false) then
    raise exception 'Peça ainda na fila do molde. Liberar na aba Moldes antes de mover.';
  end if;

  v_origem := public.os_coluna(v_os.status);

  if not public.os_transicao_permitida(v_origem, p_destino) then
    raise exception 'Transição inválida: % → %', coalesce(v_origem, v_os.status), p_destino;
  end if;

  -- CNC/EDM: usinagem → concluído só via inspeção. EXTERNO pode concluir direto.
  if v_origem = 'emCorte'
     and p_destino = 'concluido'
     and coalesce(v_os.setor, 'CNC') <> 'EXTERNO'
  then
    raise exception 'De usinagem vá para inspeção antes de concluir.';
  end if;

  if v_origem = 'aFazer'
     and p_destino in ('setup', 'emCorte')
     and coalesce(v_os.setor, 'CNC') <> 'EXTERNO'
     and v_os.programado is distinct from true
  then
    raise exception 'Este kanban ainda não foi programado.';
  end if;

  v_os.historico_pausas := public.os_historico_com_pausa_fechada(v_os, v_agora);

  if v_origem in ('setup', 'emCorte', 'afericao') then
    v_entrada := public.os_entrada_fase(v_os, v_origem);
    v_horas := greatest(0,
      extract(epoch from v_agora - v_entrada) / 3600
      - public.os_horas_pausadas(v_os.historico_pausas, v_origem, v_entrada, v_agora));
    v_os.tempos_fases := jsonb_set(
      coalesce(v_os.tempos_fases, '{}'::jsonb),
      array[v_origem],
      to_jsonb(coalesce((v_os.tempos_fases->>v_origem)::numeric, 0) + v_horas)
    );
  end if;

  if p_destino = 'aFazer' then
    v_os.maquina_nome := null;
    v_os.operador_atual := null;
  elsif v_os.aguardando_tt and not (v_campos ? 'aguardando_tt') then
    v_os.aguardando_tt := false;
    v_os.observacao_tt := null;
  end if;

  v_os := jsonb_populate_record(v_os, v_campos);
  v_os.status := v_status;
  v_os.is_pausado := false;
  v_os.data_pausa := null;
  v_os.motivo_pausa := null;
  v_os.observacao_pausa := null;

  case p_destino
    when 'setup' then v_os.timestamp_entrada_setup := v_agora;
    when 'emCorte' then v_os.timestamp_entrada_emcorte := v_agora;
    when 'afericao' then v_os.timestamp_entrada_afericao := v_agora;
    when 'concluido' then v_os.timestamp_entrada_concluido := v_agora;
    else null;
  end case;

  -- Máquina ocupada em setup / usinagem (outra OS ativa na mesma máquina)
  if p_destino in ('setup', 'emCorte') then
    v_maquina := nullif(trim(coalesce(v_os.maquina_nome, '')), '');
    if v_maquina is not null then
      select exists (
        select 1
        from public.ordens_servico o
        where o.empresa_id = v_os.empresa_id
          and o.id <> v_os.id
          and o.status = v_status
          and coalesce(o.is_pausado, false) = false
          and coalesce(o.em_fila, false) = false
          and o.maquina_nome = v_maquina
      ) into v_ocupada;
      if v_ocupada then
        raise exception 'Máquina "%" já está ocupada nesta etapa.', v_maquina;
      end if;
    end if;
  end if;

  return public.os_gravar_linha(v_os);
end;
$$;

-- pausar / retomar / registrar: checagem de empresa + escrita
create or replace function public.pausar_os(p_os_id uuid, p_motivo text, p_observacao text default null)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
begin
  if not public.empresa_pode_escrever() then
    raise exception 'Plano/piloto não permite escrita.';
  end if;
  select * into v_os
  from public.ordens_servico
  where id = p_os_id and empresa_id = public.get_user_empresa_id()
  for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;
  if v_os.is_pausado then
    return v_os;
  end if;
  if public.os_coluna(v_os.status) not in ('setup', 'emCorte') then
    raise exception 'Só é possível pausar em setup ou usinagem.';
  end if;

  v_os.is_pausado := true;
  v_os.data_pausa := now();
  v_os.motivo_pausa := p_motivo;
  v_os.observacao_pausa := p_observacao;
  return public.os_gravar_linha(v_os);
end;
$$;

create or replace function public.retomar_os(p_os_id uuid)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
  v_col text;
  v_maquina text;
  v_ocupada boolean;
begin
  if not public.empresa_pode_escrever() then
    raise exception 'Plano/piloto não permite escrita.';
  end if;
  select * into v_os
  from public.ordens_servico
  where id = p_os_id and empresa_id = public.get_user_empresa_id()
  for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  v_col := public.os_coluna(v_os.status);
  v_maquina := nullif(trim(coalesce(v_os.maquina_nome, '')), '');
  if v_col in ('setup', 'emCorte') and v_maquina is not null then
    select exists (
      select 1 from public.ordens_servico o
      where o.empresa_id = v_os.empresa_id
        and o.id <> v_os.id
        and o.status = v_os.status
        and coalesce(o.is_pausado, false) = false
        and o.maquina_nome = v_maquina
    ) into v_ocupada;
    if v_ocupada then
      raise exception 'Máquina "%" já está ocupada. Pause a outra O.S. antes de retomar.', v_maquina;
    end if;
  end if;

  v_os.historico_pausas := public.os_historico_com_pausa_fechada(v_os, now());
  v_os.is_pausado := false;
  v_os.data_pausa := null;
  v_os.motivo_pausa := null;
  v_os.observacao_pausa := null;
  return public.os_gravar_linha(v_os);
end;
$$;

create or replace function public.registrar_pausa_os(
  p_os_id uuid,
  p_inicio timestamptz,
  p_fim timestamptz,
  p_motivo text,
  p_observacao text default null
)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
begin
  if not public.empresa_pode_escrever() then
    raise exception 'Plano/piloto não permite escrita.';
  end if;
  if p_inicio is null or p_fim is null or p_fim <= p_inicio then
    raise exception 'Horário da pausa inválido.';
  end if;
  if p_fim > now() + interval '1 minute' then
    raise exception 'A pausa não pode terminar no futuro.';
  end if;

  select * into v_os
  from public.ordens_servico
  where id = p_os_id and empresa_id = public.get_user_empresa_id()
  for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  v_os.historico_pausas := coalesce(v_os.historico_pausas, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'inicio', p_inicio,
    'fim', p_fim,
    'motivo', p_motivo,
    'observacao', p_observacao,
    'duracaoHoras', extract(epoch from p_fim - p_inicio) / 3600,
    'fase', public.os_coluna(v_os.status)
  ));
  return public.os_gravar_linha(v_os);
end;
$$;

revoke all on function public.mover_os(uuid, text, jsonb) from public, anon;
revoke all on function public.pausar_os(uuid, text, text) from public, anon;
revoke all on function public.retomar_os(uuid) from public, anon;
revoke all on function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.mover_os(uuid, text, jsonb) to authenticated;
grant execute on function public.pausar_os(uuid, text, text) to authenticated;
grant execute on function public.retomar_os(uuid) to authenticated;
grant execute on function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Estoque: quantidade só via RPC
-- ---------------------------------------------------------------------------
create or replace function public.trg_estoque_proteger_quantidade()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('edm.estoque_rpc', true), ''), '') = 'on' then
    return new;
  end if;
  if new.quantidade is distinct from old.quantidade then
    raise exception 'Quantidade de estoque só muda via movimentação oficial.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_estoque_proteger_quantidade on public.estoque_itens;
create trigger trg_estoque_proteger_quantidade
  before update on public.estoque_itens
  for each row
  execute function public.trg_estoque_proteger_quantidade();

revoke execute on function public.trg_estoque_proteger_quantidade() from public, anon, authenticated;

create or replace function public.movimentar_estoque(item_id uuid, delta int, emp_id uuid default null)
returns setof public.estoque_itens
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('edm.estoque_rpc', 'on', true);
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
  perform set_config('edm.estoque_rpc', 'on', true);
  return query
  update public.estoque_itens
  set quantidade = greatest(quantidade - delta, 0)
  where id = item_id and empresa_id = public.get_user_empresa_id() and public.empresa_pode_escrever()
  returning *;
end;
$$;

grant execute on function public.movimentar_estoque(uuid, int, uuid) to authenticated;
grant execute on function public.decrementar_estoque(uuid, int, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Convites: PIN só para gestor (remove SELECT da equipe)
-- ---------------------------------------------------------------------------
drop policy if exists "Equipe ve convites da empresa" on public.convites_acesso;
