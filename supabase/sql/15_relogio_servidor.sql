-- Relógio no servidor: tempos de fase e pausas usam now() do banco, com a linha da O.S. travada.
-- Espelho em JS (modo demonstração e cronômetro do cartão): src/utils/relogioOs.js
-- Turnos ainda não entram: o tempo da fase é corrido, descontadas as pausas.
-- Rodar depois do 14_seguranca.sql. Idempotente.

create or replace function public.os_coluna(p_status text)
returns text
language sql
immutable
as $$
  select case p_status
    when 'A fazer' then 'aFazer'
    when 'Set-up' then 'setup'
    when 'Em Usinagem' then 'emCorte'
    when 'Inspeção' then 'afericao'
    when 'Concluído' then 'concluido'
  end;
$$;

create or replace function public.os_status_da_coluna(p_coluna text)
returns text
language sql
immutable
as $$
  select case p_coluna
    when 'aFazer' then 'A fazer'
    when 'setup' then 'Set-up'
    when 'emCorte' then 'Em Usinagem'
    when 'afericao' then 'Inspeção'
    when 'concluido' then 'Concluído'
  end;
$$;

create or replace function public.os_entrada_fase(p_os public.ordens_servico, p_coluna text)
returns timestamptz
language sql
stable
as $$
  select coalesce(
    case p_coluna
      when 'setup' then p_os.timestamp_entrada_setup
      when 'emCorte' then p_os.timestamp_entrada_emcorte
      when 'afericao' then p_os.timestamp_entrada_afericao
      when 'concluido' then p_os.timestamp_entrada_concluido
    end,
    p_os.created_at
  );
$$;

/** Histórico de pausas com a pausa em aberto (se houver) encerrada em p_agora. */
create or replace function public.os_historico_com_pausa_fechada(p_os public.ordens_servico, p_agora timestamptz)
returns jsonb
language sql
stable
as $$
  select case
    when p_os.is_pausado and p_os.data_pausa is not null then
      coalesce(p_os.historico_pausas, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'inicio', p_os.data_pausa,
        'fim', p_agora,
        'motivo', p_os.motivo_pausa,
        'observacao', p_os.observacao_pausa,
        'duracaoHoras', greatest(0, extract(epoch from p_agora - p_os.data_pausa) / 3600),
        'fase', public.os_coluna(p_os.status)
      ))
    else coalesce(p_os.historico_pausas, '[]'::jsonb)
  end;
$$;

/** Horas de pausa da fase dentro de [p_entrada, p_agora]: pausas de passagens anteriores não contam. */
create or replace function public.os_horas_pausadas(p_historico jsonb, p_coluna text, p_entrada timestamptz, p_agora timestamptz)
returns numeric
language sql
immutable
as $$
  select coalesce(sum(greatest(0, extract(epoch from
           least((p->>'fim')::timestamptz, p_agora) - greatest((p->>'inicio')::timestamptz, p_entrada)
         ) / 3600)), 0)
  from jsonb_array_elements(coalesce(p_historico, '[]'::jsonb)) p
  where p->>'fase' = p_coluna
    and p->>'inicio' is not null
    and p->>'fim' is not null;
$$;

create or replace function public.os_gravar_linha(p_os public.ordens_servico)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_colunas text;
  v_linha public.ordens_servico;
begin
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

-- Campos que só o servidor calcula; o resto de p_campos vai direto para a linha.
create or replace function public.os_campos_livres(p_campos jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(p_campos, '{}'::jsonb) - array[
    'id', 'empresa_id', 'created_at', 'atualizado_em', 'status',
    'tempos_fases', 'historico_pausas', 'is_pausado', 'data_pausa', 'motivo_pausa', 'observacao_pausa',
    'timestamp_entrada_setup', 'timestamp_entrada_emcorte', 'timestamp_entrada_afericao', 'timestamp_entrada_concluido'
  ];
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
begin
  if v_status is null then
    raise exception 'Coluna de destino inválida: %', p_destino;
  end if;

  select * into v_os from public.ordens_servico where id = p_os_id for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  v_origem := public.os_coluna(v_os.status);
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
    -- Saiu da fila: a peça voltou do tratamento térmico externo.
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

  return public.os_gravar_linha(v_os);
end;
$$;

create or replace function public.pausar_os(p_os_id uuid, p_motivo text, p_observacao text default null)
returns public.ordens_servico
language plpgsql
set search_path = public
as $$
declare
  v_os public.ordens_servico;
begin
  select * into v_os from public.ordens_servico where id = p_os_id for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;
  if v_os.is_pausado then
    return v_os;
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
begin
  select * into v_os from public.ordens_servico where id = p_os_id for update;
  if not found then
    raise exception 'O.S. não encontrada.';
  end if;

  v_os.historico_pausas := public.os_historico_com_pausa_fechada(v_os, now());
  v_os.is_pausado := false;
  v_os.data_pausa := null;
  v_os.motivo_pausa := null;
  v_os.observacao_pausa := null;
  return public.os_gravar_linha(v_os);
end;
$$;

/** Pausa informada depois do fato (falta de energia, quebra): entra no histórico da fase atual. */
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
  if p_inicio is null or p_fim is null or p_fim <= p_inicio then
    raise exception 'Horário da pausa inválido.';
  end if;
  if p_fim > now() + interval '1 minute' then
    raise exception 'A pausa não pode terminar no futuro.';
  end if;

  select * into v_os from public.ordens_servico where id = p_os_id for update;
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

revoke execute on function public.mover_os(uuid, text, jsonb) from public, anon;
revoke execute on function public.pausar_os(uuid, text, text) from public, anon;
revoke execute on function public.retomar_os(uuid) from public, anon;
revoke execute on function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) from public, anon;
revoke execute on function public.os_gravar_linha(public.ordens_servico) from public, anon;

grant execute on function public.mover_os(uuid, text, jsonb) to authenticated;
grant execute on function public.pausar_os(uuid, text, text) to authenticated;
grant execute on function public.retomar_os(uuid) to authenticated;
grant execute on function public.registrar_pausa_os(uuid, timestamptz, timestamptz, text, text) to authenticated;
-- Roda com a permissão de quem chama (RLS vale); as funções acima dependem dela.
grant execute on function public.os_gravar_linha(public.ordens_servico) to authenticated;

alter function public.os_coluna(text) set search_path = public;
alter function public.os_status_da_coluna(text) set search_path = public;
alter function public.os_entrada_fase(public.ordens_servico, text) set search_path = public;
alter function public.os_historico_com_pausa_fechada(public.ordens_servico, timestamptz) set search_path = public;
alter function public.os_horas_pausadas(jsonb, text, timestamptz, timestamptz) set search_path = public;
alter function public.os_campos_livres(jsonb) set search_path = public;
alter function public.trg_os_atualizado_em() set search_path = public;

-- Funções de gatilho não são RPC.
revoke execute on function public.trg_auth_auto_confirm() from public, anon, authenticated;
revoke execute on function public.trg_os_ciclo() from public, anon, authenticated;
