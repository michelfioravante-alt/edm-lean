import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const estoqueService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.estoque.fetchAll();
        const state = useAuthStore.getState();
        const user = state?.user;
        const empresaId = state?.empresaId;

        if (!user) return [];

        let directData = [];
        let directError = null;

        // 1) Query direta se tiver empresaId disponível no state local
        if (empresaId) {
            const res = await supabase
                .from('estoque_itens')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('nome', { ascending: true });
            directData = res.data;
            directError = res.error;
        }

        // Se funcionou e trouxe dados, ótimo.
        if (!directError && directData && directData.length > 0) return directData;

        // 2) Fallback para RPC (Crítico para Mobile e inicialização do Admin)
        const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_estoque_empresa');

        if (!rpcError && rpcData && rpcData.length > 0) {
            return Array.isArray(rpcData) ? rpcData : [];
        }

        // 3) Retorno de segurança
        return Array.isArray(directData) ? directData : [];
    },

    async create(nome, quantidade, alertaMinimo, setor = 'TODOS') {
        if (isLocalMode()) return localApi.estoque.create(nome, quantidade, alertaMinimo, setor);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('estoque_itens')
            .insert({ empresa_id: empresaId, nome, quantidade: parseInt(quantidade) || 0, alerta_minimo: parseInt(alertaMinimo) || 0, setor })
            .select()
            .single();
        if (error) throw error;
        return data;
    },


    // Entrada (delta positivo) ou saída (delta negativo) em uma só operação atômica.
    // Requer a função 'movimentar_estoque' (ver supabase_estoque_movimentacoes.sql).
    async movimentar(id, delta) {
        if (isLocalMode()) return localApi.estoque.movimentar(id, delta);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .rpc('movimentar_estoque', { item_id: id, delta: parseInt(delta), emp_id: empresaId });
        if (error) throw error;
        return data?.[0] ?? null;
    },

    async updateQuantidade(id, novaQuantidade) {
        if (isLocalMode()) return localApi.estoque.updateQuantidade(id, novaQuantidade);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('estoque_itens')
            .update({ quantidade: novaQuantidade })
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Decremento atômico via RPC: garante que dois usuários simultâneos não corrompam o estoque.
    // A função SQL faz: quantidade = GREATEST(quantidade - delta, 0) direto no banco.
    // Requer função 'decrementar_estoque' criada no Supabase (ver SQL abaixo no comentário).
    //
    // SQL para criar a função no Supabase (Database > SQL Editor):
    // CREATE OR REPLACE FUNCTION decrementar_estoque(item_id uuid, delta int, emp_id uuid)
    // RETURNS SETOF estoque_itens LANGUAGE sql VOLATILE SECURITY DEFINER AS $$
    //   UPDATE estoque_itens
    //   SET quantidade = GREATEST(quantidade - delta, 0)
    //   WHERE id = item_id AND empresa_id = emp_id
    //   RETURNING *;
    // $$;
    async decrementar(id, delta = 1) {
        if (isLocalMode()) return localApi.estoque.decrementar(id, delta);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .rpc('decrementar_estoque', { item_id: id, delta: parseInt(delta), emp_id: empresaId });
        if (error) throw error;
        return data?.[0] ?? null;
    },

    async remove(id) {
        if (isLocalMode()) return localApi.estoque.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('estoque_itens')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    }
};
