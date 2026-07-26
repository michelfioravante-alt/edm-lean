import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const autoKanbanService = {
    async fetchAll() {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('kanbans_automaticos')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('criado_em', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create({ tipo, descricao, diasIntervalo, maquinaNome }) {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('kanbans_automaticos')
            .insert({
                empresa_id: empresaId,
                tipo,
                descricao,
                maquina_nome: maquinaNome,
                dias_intervalo: diasIntervalo
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async remove(id) {
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('kanbans_automaticos')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);

        if (error) throw error;
    }
};
