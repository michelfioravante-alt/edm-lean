import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const historicoConsumiveisService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.historicoConsumiveis.fetchAll();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('historico_consumiveis')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('data_instalacao', { ascending: false })
            .limit(100);
        if (error) throw error;
        return data;
    },

    async create({ maquinaId, itemNome, operadorNome }) {
        if (isLocalMode()) return localApi.historicoConsumiveis.create({ maquinaId, itemNome, operadorNome });
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('historico_consumiveis')
            .insert({
                empresa_id: empresaId,
                maquina_id: maquinaId,
                item_nome: itemNome,
                operador_nome: operadorNome,
                data_instalacao: new Date().toISOString(),
                data_fim: null,
                horas_produzidas: 0
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async encerrarAtivo({ maquinaId, itemNome }) {
        if (isLocalMode()) return localApi.historicoConsumiveis.encerrarAtivo({ maquinaId, itemNome });
        const empresaId = getEmpresaId();
        // Encerra todos os registros ativos (data_fim = null) para esta máquina+item
        const { error } = await supabase
            .from('historico_consumiveis')
            .update({ data_fim: new Date().toISOString() })
            .eq('empresa_id', empresaId)
            .eq('maquina_id', maquinaId)
            .eq('item_nome', itemNome)
            .is('data_fim', null);
        if (error) throw error;
    }
};
