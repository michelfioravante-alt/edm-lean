/** Checklist de ferramentas da O.S. (programador escolhe no estoque; operador marca no set-up). */

export function lerChecklistFerramentas(os) {
    if (!os) return [];
    const raw = os.checklist_ferramentas || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((row, i) => ({
        id: row.id || `chk-${i}`,
        estoqueItemId: row.estoqueItemId || row.estoque_item_id || '',
        nome: row.nome || row.itemNome || '',
        slot: row.slot || row.codigoT || '',
        montada: !!(row.montada || row.feito),
        montadaEm: row.montadaEm || row.montada_em || null,
        operadorNome: row.operadorNome || row.operador_nome || null,
    }));
}

export function progressoChecklist(lista) {
    const items = lista || [];
    const feitas = items.filter((i) => i.montada).length;
    return { total: items.length, feitas, pendentes: items.length - feitas };
}

export function novaLinhaChecklist(estoqueItem = null, slot = '') {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        estoqueItemId: estoqueItem?.id || '',
        estoque_item_id: estoqueItem?.id || '',
        nome: estoqueItem?.nome || '',
        slot: slot || '',
        montada: false,
        montadaEm: null,
        montada_em: null,
        operadorNome: null,
        operador_nome: null,
    };
}

/** Serializa checklist no formato estável (snake + camel) para JSONB. */
export function serializarChecklistFerramentas(lista) {
    return (lista || []).map((row) => {
        const estoqueItemId = row.estoqueItemId || row.estoque_item_id || '';
        const montadaEm = row.montadaEm || row.montada_em || null;
        const operadorNome = row.operadorNome || row.operador_nome || null;
        return {
            id: row.id,
            estoqueItemId,
            estoque_item_id: estoqueItemId,
            nome: row.nome || '',
            slot: row.slot || '',
            montada: !!row.montada,
            montadaEm,
            montada_em: montadaEm,
            operadorNome,
            operador_nome: operadorNome,
        };
    });
}

export function marcarItensChecklist(lista, idsMarcados, operadorNome) {
    const set = new Set((idsMarcados || []).filter(Boolean));
    const agora = new Date().toISOString();
    return (lista || []).map((row) => {
        if (!set.has(row.id) || row.montada) return row;
        return { ...row, montada: true, montadaEm: agora, operadorNome: operadorNome || row.operadorNome };
    });
}

export function estoqueFerramentasDoSetor(estoque, setor = 'CNC') {
    return (estoque || []).filter((item) => {
        const s = item.setor || item.setor_padrao || 'TODOS';
        if (setor && setor !== 'TODOS' && s !== 'TODOS' && s !== setor) return false;
        return true;
    });
}

export function lerLinkPrograma(os) {
    return os?.link_programa || '';
}
