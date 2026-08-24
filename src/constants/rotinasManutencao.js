/** Preventiva por célula — não é O.S. de peça. */

export const ROTINAS_COMUNS = [
    { id: 'preventiva', label: 'Preventiva geral', dias: 90, hint: 'Revisão da máquina, não da peça.' },
    { id: 'lubrificacao', label: 'Lubrificação', dias: 30, hint: 'Guias, fusos e pontos de graxa.' },
    { id: 'calibracao', label: 'Calibração / geometria', dias: 180, hint: 'Nivelamento, esquadro, conferência.' },
    { id: 'corretiva', label: 'Corretiva programada', dias: 7, hint: 'Serviço já marcado — não é emergência.' },
    { id: 'outros', label: 'Outra rotina', dias: 30, hint: 'Descreva o serviço.' },
];

export const ROTINAS_POR_SETOR = {
    CNC: [
        { id: 'coolant', label: 'Filtro / fluido de corte', dias: 30, hint: 'Coolant, chips e filtro da central.' },
        { id: 'spindle', label: 'Spindle / cone', dias: 90, hint: 'Cone, gripper e ruído de eixo.' },
        { id: 'magazine', label: 'Magazine / ATC', dias: 60, hint: 'Troca automática e potes.' },
    ],
    EDM_FIO: [
        { id: 'alinhamento_fio', label: 'Alinhamento de fio', dias: 14, hint: 'Verticalidade e guias.' },
        { id: 'resina', label: 'Resina / condutividade', dias: 21, hint: 'Desionização e qualidade da água.' },
        { id: 'tanque', label: 'Tanque e filtros', dias: 15, hint: 'Limpeza do dielétrico.' },
    ],
    TORNO: [
        { id: 'castanhas', label: 'Castanhas / contraponta', dias: 60, hint: 'Aperto e concentricidade.' },
        { id: 'coolant_torno', label: 'Fluido / cavaco', dias: 30, hint: 'Bomba, filtro e bandeja.' },
    ],
    RETIFICA: [
        { id: 'rebolo', label: 'Rebolo / dressagem', dias: 21, hint: 'Perfil e balanceamento.' },
    ],
};

export function rotinasParaSetor(setor) {
    const extra = ROTINAS_POR_SETOR[setor] || [];
    return [...extra, ...ROTINAS_COMUNS];
}

export function rotinaPorId(id, setor) {
    return rotinasParaSetor(setor).find((r) => r.id === id) || ROTINAS_COMUNS.find((r) => r.id === id) || null;
}

export function rotuloSetorMaquina(setor) {
    if (setor === 'EDM_FIO') return 'Eletrofio';
    if (setor === 'TORNO') return 'Torno';
    if (setor === 'RETIFICA') return 'Retífica';
    if (setor === 'LASER') return 'Laser';
    if (setor === 'EXTERNO') return 'Externo';
    return 'CNC';
}

export function agruparMaquinasPorSetor(maquinas = []) {
    const grupos = {};
    (maquinas || []).forEach((m) => {
        const s = m.setor || 'CNC';
        if (!grupos[s]) grupos[s] = [];
        grupos[s].push(m);
    });
    return Object.entries(grupos).map(([setor, lista]) => ({
        setor,
        label: rotuloSetorMaquina(setor),
        maquinas: lista,
    }));
}
