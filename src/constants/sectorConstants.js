/**
 * Configurações de Setores Produtivos (Multi-Setor)
 * Permite isolar a visualização do Kanban por setor produtivo (EDM Fio vs CNC)
 */

export const SECTORS = {
    CNC: {
        id: 'CNC',
        label: 'Centro de Usinagem CNC',
        shortLabel: 'CNC',
        icon: 'Cpu',
        color: 'cyan',
        themeColor: '#06b6d4',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer', dbStatus: 'A fazer', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Prep. Ferramental', dbStatus: 'Set-up', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Usinagem', dbStatus: 'Em Usinagem', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', dbStatus: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', dbStatus: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Ferramenta',
            'Quebra de Ferramenta',
            'Troca de Insert',
            'Ajuste de Offset / Zero',
            'Entrada de outra O.S.',
            'Troca de Insumo',
            'Intervalo',
            'Falta de Energia',
            'Manutenção Corretiva',
            'Falta de Material',
            'Falta de Operador',
            'Outros'
        ]
    },
    EDM_FIO: {
        id: 'EDM_FIO',
        label: 'Eletroerosão a Fio',
        shortLabel: 'EDM Fio',
        icon: 'Zap',
        color: 'emerald',
        themeColor: '#10b981',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'Fila', dbStatus: 'Fila', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Preparação', dbStatus: 'Preparação', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Corte', dbStatus: 'Em Corte', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', dbStatus: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', dbStatus: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Quebra de Fio',
            'Passagem de Fio (Threading)',
            'Troca de Resina / Filtro',
            'Entrada de outra O.S.',
            'Troca de Insumo',
            'Intervalo',
            'Falta de Energia',
            'Manutenção Corretiva',
            'Falta de Material',
            'Falta de Operador',
            'Outros'
        ]
    },
    TODOS: {
        id: 'TODOS',
        label: 'Visão Geral (Toda a Fábrica)',
        shortLabel: 'Toda Fábrica',
        icon: 'Factory',
        color: 'indigo',
        themeColor: '#6366f1',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer / Fila', dbStatus: 'A fazer', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Setup / Preparação', dbStatus: 'Set-up', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Execução', dbStatus: 'Em Usinagem', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', dbStatus: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', dbStatus: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Ferramenta',
            'Quebra de Ferramenta',
            'Troca de Insert',
            'Quebra de Fio',
            'Passagem de Fio',
            'Troca de Resina / Filtro',
            'Ajuste de Offset / Zero',
            'Entrada de outra O.S.',
            'Troca de Insumo',
            'Intervalo',
            'Falta de Energia',
            'Manutenção Corretiva',
            'Falta de Material',
            'Falta de Operador',
            'Outros'
        ]
    }
};

export const SECTOR_OPTIONS = [
    { value: SECTORS.CNC.id, label: SECTORS.CNC.label, shortLabel: SECTORS.CNC.shortLabel },
    { value: SECTORS.EDM_FIO.id, label: SECTORS.EDM_FIO.label, shortLabel: SECTORS.EDM_FIO.shortLabel },
    { value: SECTORS.TODOS.id, label: SECTORS.TODOS.label, shortLabel: SECTORS.TODOS.shortLabel },
];
