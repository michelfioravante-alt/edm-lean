import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const ferramentasMaquinaService = {
    async fetchAtivas() {
        if (isLocalMode()) return localApi.ferramentasMaquina.fetchAtivas();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramentas_maquina')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .order('instalado_em', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async instalar(payload) {
        if (isLocalMode()) return localApi.ferramentasMaquina.instalar(payload);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramentas_maquina')
            .insert({
                empresa_id: empresaId,
                maquina_id: payload.maquinaId || null,
                maquina_nome: payload.maquinaNome,
                estoque_item_id: payload.estoqueItemId,
                item_nome: payload.itemNome,
                os_id: payload.osId || null,
                codigo_peca: payload.codigoPeca || null,
                slot: payload.slot || null,
                quantidade: parseInt(payload.quantidade) || 1,
                motivo: payload.motivo || 'troca',
                operador_nome: payload.operadorNome || null,
                instalado_em: new Date().toISOString(),
                ativo: true,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async retirarPorId(id, motivo = 'fim_ciclo') {
        if (isLocalMode()) return localApi.ferramentasMaquina.retirarPorId(id, motivo);
        const { data, error } = await supabase
            .from('ferramentas_maquina')
            .update({ ativo: false, removido_em: new Date().toISOString(), motivo_remocao: motivo })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async retirarPorItem(params) {
        if (isLocalMode()) return localApi.ferramentasMaquina.retirarPorItem(params);
        // Supabase: simplificado — desativa registros ativos correspondentes
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ferramentas_maquina')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .eq('maquina_nome', params.maquinaNome)
            .eq('estoque_item_id', params.estoqueItemId)
            .limit(1);
        if (error) throw error;
        const alvo = data?.[0];
        if (!alvo) return null;
        const { data: updated, error: updErr } = await supabase
            .from('ferramentas_maquina')
            .update({ ativo: false, removido_em: new Date().toISOString(), motivo_remocao: params.motivo || 'quebra' })
            .eq('id', alvo.id)
            .select()
            .single();
        if (updErr) throw updErr;
        return updated;
    },

    async limparPorOs(osId) {
        if (isLocalMode()) return localApi.ferramentasMaquina.limparPorOs(osId);
        const empresaId = getEmpresaId();
        const { error } = await supabase
            .from('ferramentas_maquina')
            .update({ ativo: false, removido_em: new Date().toISOString(), motivo_remocao: 'os_concluida' })
            .eq('empresa_id', empresaId)
            .eq('os_id', osId)
            .eq('ativo', true);
        if (error) throw error;
    },
};
