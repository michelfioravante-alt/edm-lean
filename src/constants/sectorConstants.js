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
        themeColor: '#7B808F',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Prep. Ferramental', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Usinagem', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Ferramenta',
            'Quebra de Ferramenta',
            'Troca de Inserto',
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
        themeColor: '#4A9D74',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'Fila', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Preparação', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Corte', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
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
    TORNO: {
        id: 'TORNO',
        label: 'Torno CNC',
        shortLabel: 'Torno CNC',
        icon: 'RotateCw',
        color: 'amber',
        themeColor: '#D97D3D',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Prep. Ferramental', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Torneamento', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Inserto / Pastilha',
            'Troca de Ferramenta',
            'Ajuste de Corretor / Zero',
            'Troca de Castanhas',
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
    RETIFICA: {
        id: 'RETIFICA',
        label: 'Retífica',
        shortLabel: 'Retífica',
        icon: 'Wrench',
        color: 'steel',
        themeColor: '#9DA2AE',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Preparação', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Retífica', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Rebolo',
            'Ajuste de Medida',
            'Entrada de outra O.S.',
            'Intervalo',
            'Falta de Energia',
            'Manutenção Corretiva',
            'Falta de Operador',
            'Outros'
        ]
    },
    EXTERNO: {
        id: 'EXTERNO',
        label: 'Serviço externo',
        shortLabel: 'Externo',
        icon: 'Factory',
        color: 'warn',
        themeColor: '#C99A4A',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A enviar', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Separação', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'No terceiro', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Retorno / inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Aguardando terceiro',
            'Frete / logística',
            'Aguardando NF',
            'Outros'
        ]
    },
    TODOS: {
        id: 'TODOS',
        label: 'Visão Geral (Toda a Fábrica)',
        shortLabel: 'Toda Fábrica',
        icon: 'Factory',
        color: 'indigo',
        themeColor: '#9DA2AE',
        kanbanColumns: {
            aFazer: { key: 'aFazer', label: 'A fazer / Fila', theme: 'kanban-steel' },
            setup: { key: 'setup', label: 'Setup / Preparação', theme: 'kanban-amber' },
            emCorte: { key: 'emCorte', label: 'Em Execução', theme: 'kanban-teal' },
            afericao: { key: 'afericao', label: 'Inspeção', theme: 'kanban-violet' },
            concluido: { key: 'concluido', label: 'Concluído', theme: 'kanban-green' },
        },
        motivosPausa: [
            'Troca de Ferramenta',
            'Quebra de Ferramenta',
            'Troca de Inserto',
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
    { value: SECTORS.TORNO.id, label: SECTORS.TORNO.label, shortLabel: SECTORS.TORNO.shortLabel },
    { value: SECTORS.RETIFICA.id, label: SECTORS.RETIFICA.label, shortLabel: SECTORS.RETIFICA.shortLabel },
    { value: SECTORS.EXTERNO.id, label: SECTORS.EXTERNO.label, shortLabel: SECTORS.EXTERNO.shortLabel },
    { value: SECTORS.TODOS.id, label: SECTORS.TODOS.label, shortLabel: SECTORS.TODOS.shortLabel },
];
