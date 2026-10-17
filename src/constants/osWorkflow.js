import { SECTORS } from './sectorConstants';

/** Etapas do roteiro: só CNC/EDM/externo geram cartão. Laser/retífica/torno/montagem são marcos. */
export const ETAPAS_ROTEIRO = [
    { id: 'CNC', kind: 'kanban', label: 'CNC', geraCartao: true },
    { id: 'EDM_FIO', kind: 'kanban', label: 'Eletrofio', geraCartao: true },
    { id: 'EXTERNO', kind: 'externo', label: 'Externo', geraCartao: true },
    { id: 'LASER', kind: 'marco', label: 'Laser', geraCartao: false },
    { id: 'RETIFICA', kind: 'marco', label: 'Retífica', geraCartao: false },
    { id: 'TORNO', kind: 'marco', label: 'Torno', geraCartao: false },
    { id: 'MONTAGEM', kind: 'marco', label: 'Montagem', geraCartao: false },
];

export const TIPOS_KANBAN_GESTOR = ETAPAS_ROTEIRO;

export const TIPOS_SERVICO_EXTERNO = [
    { id: 'tratamento', label: 'Tratamento térmico' },
    { id: 'tempera', label: 'Têmpera' },
    { id: 'usinagem', label: 'Usinagem terceira' },
    { id: 'outro', label: 'Outro' },
];

/** Normaliza legado do banco (ex.: tempera) para o id da UI. */
export function normalizarTipoServicoExterno(tipo) {
    const t = String(tipo || '').trim().toLowerCase();
    if (!t) return 'outro';
    if (t === 'tempera' || t === 'têmpera' || t === 'tt') return 'tempera';
    if (t === 'tratamento' || t === 'tratamento_termico' || t === 'tratamento térmico') return 'tratamento';
    if (t === 'usinagem' || t === 'terceiro') return 'usinagem';
    if (TIPOS_SERVICO_EXTERNO.some((x) => x.id === t)) return t;
    return 'outro';
}

export function rotuloTipoServicoExterno(tipo) {
    const id = normalizarTipoServicoExterno(tipo);
    return TIPOS_SERVICO_EXTERNO.find((t) => t.id === id)?.label || tipo || '—';
}

export function slugEtapaPersonalizada(label) {
    const base = String(label || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 40);
    return `PX_${base || Date.now().toString(36)}`;
}

export function listaEtapasRoteiro(personalizadas = []) {
    const extra = (personalizadas || []).filter((e) => e?.id && e?.label).map((e) => ({
        id: e.id,
        kind: e.kind || 'marco',
        label: e.label,
        geraCartao: e.geraCartao === true,
        personalizada: true,
    }));
    return [...ETAPAS_ROTEIRO, ...extra];
}

export function defEtapa(setor, personalizadas) {
    const found = listaEtapasRoteiro(personalizadas).find((e) => e.id === setor);
    if (found) return found;
    if (typeof setor === 'string' && setor.startsWith('PX_')) {
        return {
            id: setor,
            kind: 'marco',
            label: setor.replace(/^PX_/, '').replace(/_/g, ' '),
            geraCartao: false,
            personalizada: true,
        };
    }
    return { id: setor, kind: 'kanban', label: setor, geraCartao: true };
}

export function geraCartaoEtapa(setor, personalizadas) {
    return defEtapa(setor, personalizadas).geraCartao !== false;
}

export function labelSetor(setor, personalizadas) {
    return defEtapa(setor, personalizadas).label || SECTORS[setor]?.shortLabel || setor || 'CNC';
}

export function montarRoteiro(etapasIds, personalizadas) {
    return (etapasIds || []).map((setor, i) => {
        const def = defEtapa(setor, personalizadas);
        return {
            id: `${def.id}-${i}`,
            setor: def.id,
            kind: def.kind,
            label: def.label,
            feito: false,
        };
    });
}

export function statusEhConcluido(os) {
    const s = os?.status || '';
    return s === 'Concluído';
}

export function roteiroDaOs(os, irmaos) {
    const r = os?.roteiro;
    if (Array.isArray(r) && r.length) return r;
    const lista = (irmaos && irmaos.length ? irmaos : (os ? [os] : []));
    return lista.map((k, i) => {
        const setor = k.setor;
        const def = defEtapa(setor);
        return {
            id: k.id || `${setor}-${i}`,
            setor,
            kind: def.kind,
            label: def.label,
            feito: statusEhConcluido(k),
        };
    });
}

export function primeiroPassoAberto(head, kanbans) {
    const passos = roteiroDaOs(head, kanbans);
    for (const p of passos) {
        if (p.kind === 'marco' && !p.feito) return { kind: 'marco', label: p.label };
        const k = (kanbans || []).find((c) => (c.setor) === p.setor && !statusEhConcluido(c));
        if (k) return { kind: p.kind, os: k, label: p.label };
    }
    return null;
}

export function textoRoteiroPassos(passos) {
    return (passos || []).map((p) => p.label || labelSetor(p.setor)).join('  →  ');
}

export function diasEntre(inicio, fim) {
    if (!inicio) return null;
    const a = new Date(inicio).getTime();
    const b = (fim ? new Date(fim) : new Date()).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.max(0, (b - a) / (1000 * 60 * 60 * 24));
}

export function rankingFornecedoresExternos(kanban) {
    const cards = todosKanbans(kanban).filter((k) => (k.setor) === 'EXTERNO');
    const map = new Map();
    cards.forEach((k) => {
        const nome = k.fornecedor_nome || 'Sem fornecedor';
        if (!map.has(nome)) map.set(nome, { nome, laAgora: 0, ciclos: [] });
        const row = map.get(nome);
        const s = k.status || '';
        if (!statusEhConcluido(k) && s === 'Em Usinagem') row.laAgora += 1;
        const d = diasEntre(k.enviado_em, k.voltou_em);
        if (k.enviado_em && k.voltou_em && d != null) row.ciclos.push(d);
    });
    return [...map.values()].map((r) => ({
        nome: r.nome,
        laAgora: r.laAgora,
        ciclos: r.ciclos.length,
        mediaDias: r.ciclos.length ? r.ciclos.reduce((s, x) => s + x, 0) / r.ciclos.length : null,
    })).sort((a, b) => (a.mediaDias ?? 999) - (b.mediaDias ?? 999));
}

/** Precisa programar enquanto programado !== true (null/legado também bloqueia setup). EXTERNO não programa. */
export function kanbanPrecisaProgramar(os) {
    if (!os) return false;
    if ((os.setor) === 'EXTERNO') return false;
    return os.programado !== true;
}

/** Peça importada ainda na fila do molde (aba Moldes): só entra no quadro do setor quando o gestor libera. */
export function kanbanEmFila(os) {
    return os?.em_fila === true;
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
    const fases = os?.tempos_fases || {};
    const setupReal = Number(fases.setup) || 0;
    const corteReal = Number(fases.emCorte) || 0;
    const afericaoReal = Number(fases.afericao) || 0;
    const reais = setupReal + corteReal + afericaoReal;
    const setupEst = (Number(os?.tempo_estimado_setup_horas) || 0)
        + (Number(os?.tempo_estimado_setup_minutos) || 0) / 60;
    const corteEst = (Number(os?.tempo_estimado_corte_horas) || 0)
        + (Number(os?.tempo_estimado_corte_minutos) || 0) / 60;
    const estimadas = setupEst + corteEst;
    const baseReal = setupReal + corteReal;
    const eficienciaCam = (estimadas > 0 && baseReal > 0) ? (estimadas / baseReal) * 100 : null;
    return { reais, estimadas, setupEst, corteEst, setupReal, corteReal, afericaoReal, eficienciaCam };
}

export function custoHoraKanban(os, config) {
    const rate = custoHoraDoSetor(os?.setor, config);
    const { reais, estimadas } = horasKanban(os);
    const horas = reais > 0 ? reais : estimadas;
    return { rate, horas, custo: horas * rate, reais, estimadas };
}

export function listarKanbansDoGrupo(kanban, os) {
    const grupo = os?.os_grupo_id;
    if (!grupo) return os ? [os] : [];
    const all = [];
    Object.values(kanban || {}).forEach((col) => {
        (col || []).forEach((card) => {
            if ((card.os_grupo_id) === grupo) all.push(card);
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

export function labelStatusExterno(os) {
    const colish = os?.status || '';
    if (colish === 'Concluído') return 'Voltou';
    if (colish === 'Inspeção') return 'Retorno / inspeção';
    if (colish === 'Em Usinagem') return 'No terceiro';
    if (colish === 'Set-up') return 'Separação';
    return 'A enviar';
}

export function prazoOs(os) {
    return os?.prazo_entrega || '';
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

export function venceHojeOs(os) {
    const prazo = prazoOs(os);
    if (!prazo || statusEhConcluido(os)) return false;
    const safe = prazo.includes('T') ? prazo : `${prazo}T12:00:00`;
    const d = new Date(safe);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate();
}

export function agruparCarteira(kanban, config = {}) {
    const cards = todosKanbans(kanban);
    const groups = new Map();
    cards.forEach((c) => {
        const gid = c.os_grupo_id || c.id;
        if (!groups.has(gid)) groups.set(gid, []);
        groups.get(gid).push(c);
    });

    return [...groups.entries()].map(([grupoId, kanbans]) => {
        kanbans.sort((a, b) => (a.roteiro_ordem || 0) - (b.roteiro_ordem || 0));
        const head = kanbans.find((k) => k.codigo_molde) || kanbans[0];
        // Molde = tem código de ferramenta/job. Roteiro multi-setor sem código ≠ molde.
        const isMolde = !!(head.codigo_molde && String(head.codigo_molde).trim());
        const abertos = kanbans.filter((k) => !statusEhConcluido(k));
        const gargalo = abertos[0] || null;
        const custos = kanbans.map((k) => custoHoraKanban(k, config));
        const custoHora = custos.reduce((s, x) => s + x.custo, 0);
        const orcado = Number(head.valor_orcado);
        const externos = kanbans.filter((k) => (k.setor) === 'EXTERNO');
        const emTerceiro = externos.some((k) => {
            const s = k.status || '';
            return s === 'Em Usinagem';
        });
        const aProgramar = kanbans.some(kanbanPrecisaProgramar);
        const pecaPronta = kanbans.some(statusEhConcluido) && abertos.length > 0;
        const tudoPronto = abertos.length === 0;

        return {
            grupoId,
            head,
            kanbans,
            isMolde,
            titulo: isMolde
                ? (head.codigo_molde || head.codigo_peca)
                : (head.codigo_peca),
            cliente: head.cliente,
            prazo: prazoOs(head),
            atrasada: atrasadaOs(head) || abertos.some(atrasadaOs),
            gargalo,
            passoAberto: primeiroPassoAberto(head, kanbans),
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
