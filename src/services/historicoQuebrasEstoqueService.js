import { supabase } from './supabase';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

export const historicoQuebrasEstoqueService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.historicoQuebrasEstoque.fetchAll();
        const { data, error } = await supabase
            .from('historico_quebras_estoque')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(payload) {
        if (isLocalMode()) return localApi.historicoQuebrasEstoque.create(payload);
        const { data, error } = await supabase
            .from('historico_quebras_estoque')
            .insert({
                empresa_id: payload.empresaId,
                estoque_item_id: payload.estoqueItemId,
                item_nome: payload.itemNome,
                maquina_nome: payload.maquinaNome,
                operador_nome: payload.operadorNome,
                codigo_peca: payload.codigoPeca || null,
                os_id: payload.osId || null,
                observacao: payload.observacao || null,
                hora_inicio: payload.horaInicio || null,
                hora_fim: payload.horaFim || null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
