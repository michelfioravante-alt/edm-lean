import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const configService = {
    async fetch() {
        if (isLocalMode()) return localApi.config.fetch();
        try {
            const empresaId = getEmpresaId();
            const { data, error } = await supabase
                .from('configuracoes_empresa')
                .select('*')
                .eq('empresa_id', empresaId)
                .single();
            // Se não existe ainda, retorna null sem erro
            if (error && error.code === 'PGRST116') return null;
            if (error) throw error;
            return data;
        } catch (err) {
            // Em caso de erro RLS (comum no refresh mobile anônimo), tenta RPC segura
            const { data, error } = await supabase.rpc('buscar_configuracoes_empresa');
            if (error && error.code === 'PGRST116') return null;
            if (error) throw error;
            return Array.isArray(data) ? (data[0] || null) : data;
        }
    },

    async upsert({ custoHoraMaquina, custoHoraCnc, custoHoraEdm, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup }) {
        if (isLocalMode()) return localApi.config.upsert({ custoHoraMaquina, custoHoraCnc, custoHoraEdm, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup });
        const empresaId = getEmpresaId();
        const payload = {
            empresa_id: empresaId,
            custo_hora_maquina: custoHoraMaquina,
            turnos: turnos,
            pin_onboarding: pinOnboarding,
            ...(custoHoraCnc !== undefined && { custo_hora_cnc: custoHoraCnc }),
            ...(custoHoraEdm !== undefined && { custo_hora_edm: custoHoraEdm }),
            ...(modoMagazineDefault !== undefined && { modo_magazine_default: modoMagazineDefault }),
            ...(baixaEstoqueNoSetup !== undefined && { baixa_estoque_setup: baixaEstoqueNoSetup }),
        };
        const { data, error } = await supabase
            .from('configuracoes_empresa')
            .upsert(payload, { onConflict: 'empresa_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
