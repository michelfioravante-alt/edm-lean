import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const fornecedoresService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.fornecedores.fetchAll();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('fornecedores')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async create({ nome, tipo = 'tempera', prazoDias }) {
        if (isLocalMode()) return localApi.fornecedores.create({ nome, tipo, prazoDias });
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('fornecedores')
            .insert({
                empresa_id: empresaId,
                nome,
                tipo: tipo || 'tempera',
                prazo_dias: prazoDias ? parseInt(prazoDias, 10) : null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async remove(id) {
        if (isLocalMode()) return localApi.fornecedores.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('fornecedores')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    },
};
