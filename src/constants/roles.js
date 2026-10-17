export const SETORES_PROGRAMADOR = ['CNC', 'EDM_FIO'];

/** Login: só gestor (admin) e programador. Qualquer outro valor vira programador. */
export function normalizarRole(funcao) {
    if (funcao === 'admin') return 'admin';
    return 'programmer';
}

export function setorPermitido(role, setor) {
    if (role === 'admin') return true;
    return SETORES_PROGRAMADOR.includes(setor || 'CNC');
}

export function filtrarPorSetorDoPerfil(lista, role, setorAtivo) {
    if (role === 'admin' || !lista) return lista || [];
    const setor = SETORES_PROGRAMADOR.includes(setorAtivo) ? setorAtivo : 'CNC';
    return lista.filter((os) => (os.setor || 'CNC') === setor);
}

export function setorEfetivoProgramador(setorPadrao, activeSector) {
    if (SETORES_PROGRAMADOR.includes(activeSector)) return activeSector;
    if (SETORES_PROGRAMADOR.includes(setorPadrao)) return setorPadrao;
    return 'CNC';
}

export function filtrarEstoqueDoPerfil(itens, role, setor) {
    if (role === 'admin' || !itens) return itens || [];
    // Inclui TODOS (fluídos comuns) + itens do setor do programador
    return itens.filter((i) => {
        const s = i.setor || 'TODOS';
        return s === setor || s === 'TODOS';
    });
}

export function nomesClienteAutocomplete(clientes = [], nomeEmpresa) {
    const nomes = new Set();
    (clientes || []).forEach((c) => {
        const n = String(c?.nome || '').trim();
        if (n) nomes.add(n);
    });
    const empresa = String(nomeEmpresa || '').trim();
    if (empresa) nomes.add(empresa);
    nomes.add('Outros');
    return Array.from(nomes).sort((a, b) => {
        if (a === 'Outros') return 1;
        if (b === 'Outros') return -1;
        if (empresa && a === empresa) return -1;
        if (empresa && b === empresa) return 1;
        return a.localeCompare(b, 'pt-BR');
    });
}
