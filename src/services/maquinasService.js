import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const maquinasService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.maquinas.fetchAll();
        const state = useAuthStore.getState();
        const user = state?.user;
        const empresaId = state?.empresaId;

        if (!user) return [];

        let directData = [];
        let directError = null;

        // 1) Query direta se tiver empresaId disponível no state local
        if (empresaId) {
            const res = await supabase
                .from('maquinas')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: true });
            directData = res.data;
            directError = res.error;
        }

        // Se funcionou e trouxe dados, ótimo.
        if (!directError && directData && directData.length > 0) return directData;

        // 2) Fallback para RPC (Crítico para Mobile e inicialização do Admin)
        const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_maquinas_empresa');

        if (!rpcError && rpcData && rpcData.length > 0) {
            return Array.isArray(rpcData) ? rpcData : [];
        }

        // 3) Retorno de segurança
        return Array.isArray(directData) ? directData : [];
    },

    async create(nome, setor = 'CNC') {
        if (isLocalMode()) return localApi.maquinas.create(nome, setor);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('maquinas')
            .insert({ empresa_id: empresaId, nome, setor, status: 'Parada' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },


    async remove(id) {
        if (isLocalMode()) return localApi.maquinas.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('maquinas')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    }
};
