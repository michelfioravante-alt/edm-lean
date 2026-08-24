export const PAPEIS_CONVITE = [
    { id: 'cnc', label: 'Programador CNC', funcao: 'programmer', setor: 'CNC' },
    { id: 'fio', label: 'Programador eletrofio', funcao: 'programmer', setor: 'EDM_FIO' },
    { id: 'gestor', label: 'Gestor', funcao: 'admin', setor: 'TODOS' },
];

export function rotuloPapelConvite(convite) {
    if (convite?.funcao === 'admin') return 'Gestor';
    if (convite?.setor_padrao === 'EDM_FIO' || convite?.setorPadrao === 'EDM_FIO') return 'Eletrofio';
    return 'CNC';
}

export function papelFromId(id) {
    return PAPEIS_CONVITE.find((p) => p.id === id) || PAPEIS_CONVITE[0];
}

export function pinConviteLivre(pin, pinsUsados = [], pinMaster = '1234', ignorarPin = null) {
    const valor = String(pin || '').replace(/\D/g, '');
    if (valor.length !== 4) return 'O PIN precisa ter 4 dígitos.';
    if (valor === String(pinMaster || '1234')) return 'Esse PIN já é o PIN mestre da fábrica.';
    const ocupado = pinsUsados.some((p) => String(p) === valor && String(p) !== String(ignorarPin || ''));
    if (ocupado) return 'Esse PIN já está em outro convite ativo.';
    return null;
}

export function gerarPinConvite(pinsUsados = [], pinMaster = '1234') {
    const usados = new Set(
        [String(pinMaster || '1234'), ...pinsUsados.map((p) => String(p))].filter(Boolean)
    );
    for (let i = 0; i < 100; i += 1) {
        const pin = String(Math.floor(1000 + Math.random() * 9000));
        if (!usados.has(pin)) return pin;
    }
    throw new Error('Não foi possível gerar um PIN livre. Revogue um convite antigo.');
}
