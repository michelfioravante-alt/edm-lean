import { supabase } from './supabase';
import { isLocalMode, localApi } from './localBridge';
import { useAuthStore } from '../store/useAuthStore';

function getEmpresaId() {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
}

export const movimentacoesEstoqueService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.movimentacoesEstoque.fetchAll();
        const { data, error } = await supabase
            .from('movimentacoes_estoque')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) throw error;
        return data || [];
    },

    async create(payload) {
        if (isLocalMode()) return localApi.movimentacoesEstoque.create(payload);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('movimentacoes_estoque')
            .insert({
                empresa_id: empresaId,
                estoque_item_id: payload.estoqueItemId,
                item_nome: payload.itemNome,
                tipo: payload.tipo,
                quantidade: parseInt(payload.quantidade) || 0,
                quantidade_resultante: payload.quantidadeResultante ?? null,
                motivo: payload.motivo || null,
                operador_nome: payload.operadorNome || null,
                observacao: payload.observacao || null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
