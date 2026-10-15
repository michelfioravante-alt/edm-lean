import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const fornecedoresService = {
    async fetchAll() {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('fornecedores')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async create({ nome, tipo = 'tratamento', prazoDias }) {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('fornecedores')
            .insert({
                empresa_id: empresaId,
                nome,
                tipo: tipo || 'tratamento',
                prazo_dias: prazoDias ? parseInt(prazoDias, 10) : null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async remove(id) {
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('fornecedores')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    },
};
