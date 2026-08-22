import { SECTORS } from './sectorConstants';

export const TIPOS_KANBAN_GESTOR = [
    { id: 'CNC', label: 'CNC' },
    { id: 'EDM_FIO', label: 'Eletrofio' },
    { id: 'TORNO', label: 'Torno' },
    { id: 'RETIFICA', label: 'Retífica' },
    { id: 'EXTERNO', label: 'Serviço externo' },
];

export function labelSetor(setor) {
    return SECTORS[setor]?.shortLabel || setor || 'CNC';
}

/** Cartões antigos (sem flag) já podem ir para set-up. Novos nascem programado=false. */
export function kanbanPrecisaProgramar(os) {
    if (!os) return false;
    if ((os.setor || os.tipo_processo) === 'EXTERNO') return false;
    if (os.programado === true) return false;
    if (os.programado === false) return true;
    return false;
}

export function custoHoraDoSetor(setor, config = {}) {
    const cnc = Number(config.custoHoraCnc) || 80;
    const edm = Number(config.custoHoraEdm) || 120;
    const padrao = Number(config.custoHoraMaquina) || 50;
    if (setor === 'CNC') return cnc;
    if (setor === 'EDM_FIO') return edm;
    return padrao;
}

export function horasKanban(os) {
    const fases = os?.tempos_fases || os?.temposFases || {};
    const reais = (Number(fases.setup) || 0) + (Number(fases.emCorte) || 0) + (Number(fases.afericao) || 0);
    const estH = (Number(os?.tempo_estimado_corte_horas || os?.tempoEstimadoCorteHoras) || 0)
        + (Number(os?.tempo_estimado_setup_horas || os?.tempoEstimadoSetupHoras) || 0);
    const estM = (Number(os?.tempo_estimado_corte_minutos || os?.tempoEstimadoCorteMinutos) || 0)
        + (Number(os?.tempo_estimado_setup_minutos || os?.tempoEstimadoSetupMinutos) || 0);
    const estimadas = estH + estM / 60;
    return { reais, estimadas };
}

export function custoHoraKanban(os, config) {
    const rate = custoHoraDoSetor(os?.setor || os?.tipo_processo, config);
    const { reais, estimadas } = horasKanban(os);
    const horas = reais > 0 ? reais : estimadas;
    return { rate, horas, custo: horas * rate, reais, estimadas };
}

export function listarKanbansDoGrupo(kanban, os) {
    const grupo = os?.os_grupo_id || os?.osGrupoId;
    if (!grupo) return os ? [os] : [];
    const all = [];
    Object.values(kanban || {}).forEach((col) => {
        (col || []).forEach((card) => {
            if ((card.os_grupo_id || card.osGrupoId) === grupo) all.push(card);
        });
    });
    return all.sort((a, b) => (a.roteiro_ordem || 0) - (b.roteiro_ordem || 0));
}

export function novoGrupoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todosKanbans(kanban) {
    return Object.values(kanban || {}).flatMap((col) => col || []);
}

export function colKeyDoKanban(kanban, osId) {
    for (const key of Object.keys(kanban || {})) {
        if ((kanban[key] || []).some((c) => c.id === osId)) return key;
    }
    return null;
}

function statusEhConcluido(os) {
    const s = os?.statusLocal || os?.status || '';
    return s === 'Concluído';
}

export function labelStatusExterno(os) {
    const colish = os?.statusLocal || os?.status || '';
    if (colish === 'Concluído') return 'Voltou';
    if (colish === 'Inspeção') return 'Retorno / inspeção';
    if (colish === 'Em Usinagem' || colish === 'Em Corte') return 'No terceiro';
    if (colish === 'Set-up' || colish === 'Preparação') return 'Separação';
    return 'A enviar';
}

export function prazoOs(os) {
    return os?.prazo_entrega || os?.prazoEntrega || '';
}

export function atrasadaOs(os) {
    const prazo = prazoOs(os);
    if (!prazo || statusEhConcluido(os)) return false;
    const safe = prazo.includes('T') ? prazo : `${prazo}T12:00:00`;
    const d = new Date(safe);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
}

export function agruparCarteira(kanban, config = {}) {
    const cards = todosKanbans(kanban);
    const groups = new Map();
    cards.forEach((c) => {
        const gid = c.os_grupo_id || c.osGrupoId || c.id;
        if (!groups.has(gid)) groups.set(gid, []);
        groups.get(gid).push(c);
    });

    return [...groups.entries()].map(([grupoId, kanbans]) => {
        kanbans.sort((a, b) => (a.roteiro_ordem || 0) - (b.roteiro_ordem || 0));
        const head = kanbans.find((k) => k.codigo_molde || k.codigoMolde) || kanbans[0];
        const isMolde = kanbans.length > 1 || !!(head.codigo_molde || head.codigoMolde);
        const abertos = kanbans.filter((k) => !statusEhConcluido(k));
        const gargalo = abertos[0] || null;
        const custos = kanbans.map((k) => custoHoraKanban(k, config));
        const custoHora = custos.reduce((s, x) => s + x.custo, 0);
        const orcado = Number(head.valor_orcado ?? head.valorOrcado);
        const externos = kanbans.filter((k) => (k.setor || k.tipo_processo) === 'EXTERNO');
        const emTerceiro = externos.some((k) => !statusEhConcluido(k));
        const aProgramar = kanbans.some(kanbanPrecisaProgramar);
        const pecaPronta = kanbans.some(statusEhConcluido) && abertos.length > 0;
        const tudoPronto = abertos.length === 0;

        return {
            grupoId,
            head,
            kanbans,
            isMolde,
            titulo: isMolde
                ? (head.codigo_molde || head.codigoMolde || head.codigo_peca || head.codigoPeca)
                : (head.codigo_peca || head.codigoPeca),
            cliente: head.cliente,
            prazo: prazoOs(head),
            atrasada: atrasadaOs(head) || abertos.some(atrasadaOs),
            gargalo,
            custoHora,
            orcado: Number.isFinite(orcado) ? orcado : null,
            emTerceiro,
            aProgramar,
            pecaPronta,
            tudoPronto,
            externos,
        };
    }).sort((a, b) => {
        if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
        if (a.tudoPronto !== b.tudoPronto) return a.tudoPronto ? 1 : -1;
        return 0;
    });
}
