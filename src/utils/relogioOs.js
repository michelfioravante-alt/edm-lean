/**
 * Regras de tempo da O.S. — espelho de supabase/sql/15_relogio_servidor.sql.
 * Em produção quem calcula é o banco (mover_os, pausar_os, retomar_os, registrar_pausa_os);
 * aqui servem à atualização otimista do quadro e ao cronômetro ao vivo do cartão.
 */
import { colKeyToStatus, statusToColKey } from '../constants/cncProcess';
import { osPatch } from './osPayload';

const HORA_MS = 60 * 60 * 1000;

export const FASES_CRONOMETRADAS = ['setup', 'emCorte', 'afericao'];

const COLUNA_ENTRADA = {
    setup: 'timestamp_entrada_setup',
    emCorte: 'timestamp_entrada_emcorte',
    afericao: 'timestamp_entrada_afericao',
    concluido: 'timestamp_entrada_concluido',
};

const CAMPOS_DO_SERVIDOR = [
    'id', 'empresa_id', 'created_at', 'atualizado_em', 'status',
    'tempos_fases', 'historico_pausas', 'is_pausado', 'data_pausa', 'motivo_pausa', 'observacao_pausa',
    ...Object.values(COLUNA_ENTRADA),
];

const ms = (iso) => new Date(iso).getTime();

export function entradaFase(os, col) {
    return os?.[COLUNA_ENTRADA[col]] || os?.created_at;
}

export function historicoComPausaFechada(os, agoraIso) {
    const historico = os?.historico_pausas || [];
    if (!os?.is_pausado || !os.data_pausa) return historico;
    return [...historico, {
        inicio: os.data_pausa,
        fim: agoraIso,
        motivo: os.motivo_pausa,
        observacao: os.observacao_pausa,
        duracaoHoras: Math.max(0, (ms(agoraIso) - ms(os.data_pausa)) / HORA_MS),
        fase: statusToColKey(os.status),
    }];
}

/** Pausas da fase recortadas em [entrada, agora]: pausas de passagens anteriores não contam. */
function horasPausadas(historico, col, entradaMs, agoraMs) {
    return historico
        .filter((p) => p.fase === col && p.inicio && p.fim)
        .reduce((soma, p) => soma + Math.max(0, Math.min(ms(p.fim), agoraMs) - Math.max(ms(p.inicio), entradaMs)), 0) / HORA_MS;
}

/** Horas líquidas da passagem atual pela fase (o que mover_os soma em tempos_fases). */
export function horasPassagemAtual(os, col, agoraMs = Date.now()) {
    if (!FASES_CRONOMETRADAS.includes(col)) return 0;
    const entradaMs = ms(entradaFase(os, col));
    if (!entradaMs) return 0;
    const historico = historicoComPausaFechada(os, new Date(agoraMs).toISOString());
    return Math.max(0, (agoraMs - entradaMs) / HORA_MS - horasPausadas(historico, col, entradaMs, agoraMs));
}

export function camposLivres(params) {
    const campos = osPatch(params);
    CAMPOS_DO_SERVIDOR.forEach((c) => delete campos[c]);
    return campos;
}

/** Linha da O.S. depois de mover para `destCol` (mesmas regras de public.mover_os). */
export function osMovida(os, destCol, params = {}, agoraIso = new Date().toISOString()) {
    const status = colKeyToStatus(destCol);
    if (!status) throw new Error(`Coluna de destino inválida: ${destCol}`);
    const origem = statusToColKey(os.status);
    const tempos = { ...(os.tempos_fases || {}) };
    if (FASES_CRONOMETRADAS.includes(origem)) {
        tempos[origem] = (Number(tempos[origem]) || 0) + horasPassagemAtual(os, origem, ms(agoraIso));
    }
    const campos = camposLivres(params);
    const ajustes = destCol === 'aFazer'
        ? { maquina_nome: null, operador_atual: null }
        : (os.aguardando_tt && campos.aguardando_tt === undefined ? { aguardando_tt: false, observacao_tt: null } : {});

    return {
        ...os,
        ...ajustes,
        ...campos,
        status,
        tempos_fases: tempos,
        historico_pausas: historicoComPausaFechada(os, agoraIso),
        is_pausado: false,
        data_pausa: null,
        motivo_pausa: null,
        observacao_pausa: null,
        ...(COLUNA_ENTRADA[destCol] && { [COLUNA_ENTRADA[destCol]]: agoraIso }),
    };
}

