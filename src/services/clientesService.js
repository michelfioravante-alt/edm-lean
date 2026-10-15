import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error("Usuário não autenticado");
    return state.empresaId;
};

export const clientesService = {
    async fetchAll() {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async create({ nome, email, telefone, contatos = [] }) {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('clientes')
            .insert({
                empresa_id: empresaId,
                nome,
                email: email || null,
                telefone: telefone || null,
                contatos: contatos || []
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, { nome, email, telefone, contatos }) {
        const empresaId = getEmpresaId();
        const payload = { nome, email: email || null, telefone: telefone || null };
        if (contatos !== undefined) payload.contatos = contatos;
        const { data, error } = await supabase
            .from('clientes')
            .update(payload)
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async remove(id) {
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    }
};
