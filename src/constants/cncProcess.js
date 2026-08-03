/**
 * Configuração central do fluxo CNC (Centro de Usinagem).
 * Ajuste os labels aqui conforme você mapear o processo real no chão de fábrica.
 */

export const APP_BRAND = 'Lean Shopfloor';


export const KANBAN_COLUMNS = {
    aFazer: {
        key: 'aFazer',
        label: 'A fazer',
        dbStatus: 'A fazer',
        theme: 'kanban-steel',
        icon: 'afazer',
    },
    setup: {
        key: 'setup',
        label: 'Setup',
        dbStatus: 'Set-up',
        theme: 'kanban-amber',
        icon: 'setup',
    },
    emCorte: {
        key: 'emCorte',
        label: 'Em Usinagem',
        dbStatus: 'Em Usinagem',
        theme: 'kanban-teal',
        icon: 'corte',
    },
    afericao: {
        key: 'afericao',
        label: 'Inspeção',
        dbStatus: 'Inspeção',
        theme: 'kanban-violet',
        icon: 'afericao',
    },
    concluido: {
        key: 'concluido',
        label: 'Concluído',
        dbStatus: 'Concluído',
        theme: 'kanban-green',
        icon: 'concluido',
    },
};

/** Mapa status do banco → chave interna da coluna */
export const STATUS_TO_COL = Object.fromEntries(
    Object.values(KANBAN_COLUMNS).map((col) => [col.dbStatus, col.key])
);

/** Mapa chave interna → status gravado no banco */
export const COL_TO_STATUS = Object.fromEntries(
    Object.values(KANBAN_COLUMNS).map((col) => [col.key, col.dbStatus])
);

/** Labels para exibição rápida { aFazer: 'A fazer', ... } */
export const COLUMN_LABELS = Object.fromEntries(
    Object.values(KANBAN_COLUMNS).map((col) => [col.key, col.label])
);

/** Status legados do EDM Lean — compatibilidade se reutilizar banco antigo */
const LEGACY_STATUS_TO_COL = {
    'Prep. Ferramental': 'setup',
    'Set-up': 'setup',
    'Em Corte': 'emCorte',
    'Aferição': 'afericao',
};

export function statusToColKey(status) {
    return STATUS_TO_COL[status] || LEGACY_STATUS_TO_COL[status] || null;
}

export function colKeyToStatus(colKey) {
    return COL_TO_STATUS[colKey] || null;
}

export const MOTIVOS_PAUSA_CNC = [
    'Entrada de outra O.S.',
    'Troca de Ferramenta',
    'Troca de Insumo',
    'Quebra de Ferramenta',
    'Troca de Insert',
    'Ajuste de Offset / Zero',
    'Intervalo',
    'Falta de Energia',
    'Manutenção Corretiva',
    'Falta de Material',
    'Falta de Operador',
    'Outros',
];

export const TIPOS_FERRAMENTAL = [
    'Fresa',
    'Broca',
    'Insert',
    'Porta-ferramenta',
    'Mandril',
    'Macho',
    'Alargador',
    'Outro',
];

export const STATUS_FERRAMENTAL = {
    disponivel: { label: 'Disponível', color: 'text-kanban-green' },
    em_uso: { label: 'Em uso', color: 'text-kanban-teal' },
    alerta: { label: 'Vida útil baixa', color: 'text-kanban-amber' },
    quebrado: { label: 'Quebrado', color: 'text-red-400' },
};

/** Estratégia de montagem de ferramentas por O.S. */
export const ESTRATEGIA_FERRAMENTAL = {
    lote: {
        key: 'lote',
        label: 'Magazine completo no setup',
        hint: 'Monta todas as ferramentas antes de usinar (ex.: turno noturno). Troca automática do magazine não é registrada.',
    },
    individual: {
        key: 'individual',
        label: 'Uma a uma durante a usinagem',
        hint: 'Cada montagem física desconta do estoque na pausa "Troca de Ferramenta".',
    },
};

export const ESTRATEGIA_FERRAMENTAL_OPTIONS = Object.values(ESTRATEGIA_FERRAMENTAL);
