import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const ferramentalService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.ferramental.fetchAll();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramental')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async create({ nome, tipo, codigo, vidaUtilHoras, alertaHoras, observacao }) {
        if (isLocalMode()) return localApi.ferramental.create({ nome, tipo, codigo, vidaUtilHoras, alertaHoras, observacao });
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramental')
            .insert({
                empresa_id: empresaId,
                nome,
                tipo: tipo || 'Fresa',
                codigo: codigo || null,
                vida_util_horas: parseFloat(vidaUtilHoras) || 0,
                alerta_horas: parseFloat(alertaHoras) || 0,
                horas_usadas: 0,
                status: 'disponivel',
                observacao: observacao || null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        if (isLocalMode()) return localApi.ferramental.update(id, updates);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramental')
            .update(updates)
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async registrarQuebra({ ferramentalId, maquinaNome, operadorNome, observacao }) {
        if (isLocalMode()) return localApi.ferramental.registrarQuebra({ ferramentalId, maquinaNome, operadorNome, observacao });
        const empresaId = getEmpresaId();
        const { data: ferramenta, error: fetchErr } = await supabase
            .from('ferramental')
            .select('*')
            .eq('id', ferramentalId)
            .eq('empresa_id', empresaId)
            .single();
        if (fetchErr) throw fetchErr;

        const { error: histErr } = await supabase.from('historico_ferramental').insert({
            empresa_id: empresaId,
            ferramental_id: ferramentalId,
            evento: 'quebra',
            maquina_nome: maquinaNome || null,
            operador_nome: operadorNome || null,
            horas_no_evento: ferramenta?.horas_usadas || 0,
            observacao: observacao || null,
        });
        if (histErr) throw histErr;

        return ferramentalService.update(ferramentalId, {
            status: 'quebrado',
            maquina_id: null,
        });
    },

    async remove(id) {
        if (isLocalMode()) return localApi.ferramental.remove(id);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('ferramental')
            .delete()
            .eq('id', id)
            .eq('empresa_id', empresaId);
        if (error) throw error;
    },

    async fetchHistorico() {
        if (isLocalMode()) return localApi.ferramental.fetchHistorico();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('historico_ferramental')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        return data || [];
    },
};
