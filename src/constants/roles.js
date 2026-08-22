export const SETORES_PROGRAMADOR = ['CNC', 'EDM_FIO'];

/** Login: só gerente (admin) e programador. Qualquer outro valor vira programador. */
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
    return lista.filter((os) => (os.setor || os.tipo_processo || 'CNC') === setor);
}
