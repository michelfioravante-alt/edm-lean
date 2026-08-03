import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const programadoresService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.programadores.fetchAll();
        const state = useAuthStore.getState();
        const user = state?.user;
        const empresaId = state?.empresaId;

        if (!user) return [];

        let directData = [];
        let directError = null;

        // 1) Query direta se tiver empresaId disponível no state local
        if (empresaId) {
            const res = await supabase
                .from('programadores')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: true });
            directData = res.data;
            directError = res.error;
        }

        // Sucesso na query direta (com dados ou vazio legítimo)
        if (!directError) return Array.isArray(directData) ? directData : [];

        // 2) Fallback para RPC se a query direta deu erro (ex.: RLS)
        const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_programadores_empresa');
        if (!rpcError && Array.isArray(rpcData)) return rpcData;

        // 3) Em erro, retorna [] (a store não sobrescreve se já tiver itens)
        return [];
    },

    async create(nome, setor = 'CNC') {
        if (isLocalMode()) return localApi.programadores.create(nome, setor);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('programadores')
            .insert({ empresa_id: empresaId, nome, setor })
            .select()
            .single();
        if (error) throw error;
        return data;
    },


    async remove(id) {
        if (isLocalMode()) return localApi.programadores.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('programadores')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    }
};
