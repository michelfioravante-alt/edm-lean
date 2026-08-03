import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error("Usuário não autenticado");
    return state.empresaId;
};

export const clientesService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.clientes.fetchAll();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async create({ nome, email, telefone }) {
        if (isLocalMode()) return localApi.clientes.create({ nome, email, telefone });
        getEmpresaId(); // Valida que está autenticado
        const TIMEOUT_MS = 20000;
        const rpcPromise = supabase.rpc('criar_cliente_empresa', {
            p_nome: nome,
            p_email: email || null,
            p_telefone: telefone || null
        });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão.')), TIMEOUT_MS)
        );
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
        if (error) throw error;
        return data;
    },

    async update(id, { nome, email, telefone }) {
        if (isLocalMode()) return localApi.clientes.update(id, { nome, email, telefone });
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('clientes')
            .update({ nome, email: email || null, telefone: telefone || null })
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async remove(id) {
        if (isLocalMode()) return localApi.clientes.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    }
};
