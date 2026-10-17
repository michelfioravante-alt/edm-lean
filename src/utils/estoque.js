export const UNIDADES_ESTOQUE = [
    { id: 'un', label: 'un' },
    { id: 'm', label: 'm' },
    { id: 'kg', label: 'kg' },
    { id: 'L', label: 'L' },
    { id: 'rolo', label: 'rolo' },
];

export function chaveSku(nome, setor) {
    return `${String(nome || '').trim().toLowerCase()}|${setor || 'TODOS'}`;
}

/** Setores cuja peça física tem vida útil / magazine (aba Ferramental). EDM fio fica só no Estoque. */
export const SETORES_FERRAMENTAL = ['CNC', 'TORNO'];

export function setorPermiteFerramental(setor) {
    return SETORES_FERRAMENTAL.includes(setor || '');
}

export function estoqueParaFerramental(itens) {
    return (itens || []).filter((i) => setorPermiteFerramental(i.setor));
}

export function qtdEstoque(item) {
    return Number(item?.quantidade ?? item?.qtd ?? 0);
}

export function alertaEstoque(item) {
    return Number(item?.alerta_minimo ?? item?.alertaMinimo ?? 0);
}

export function unidadeEstoque(item) {
    return item?.unidade || 'un';
}

export function precisaPedirEstoque(item) {
    const min = alertaEstoque(item);
    return min > 0 && qtdEstoque(item) <= min;
}

export function normalizarItemEstoque(raw) {
    if (!raw) return raw;
    const quantidade = qtdEstoque(raw);
    const alerta_minimo = alertaEstoque(raw);
    return {
        ...raw,
        quantidade,
        alerta_minimo,
        unidade: unidadeEstoque(raw),
        setor: raw.setor || 'TODOS',
        estoque_item_id: raw.estoque_item_id || raw.estoqueItemId || null,
    };
}
