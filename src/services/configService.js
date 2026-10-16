import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const configService = {
    async fetch() {
        // A RPC omite pin_onboarding para quem não é gestor.
        const { data, error } = await supabase.rpc('buscar_configuracoes_empresa');
        if (error) throw error;
        return Array.isArray(data) ? (data[0] || null) : data;
    },

    async marcarOnboarding(concluido = true) {
        const { error } = await supabase.rpc('marcar_onboarding_concluido', { p_concluido: !!concluido });
        if (error) throw error;
    },

    async upsert({ custoHoraMaquina, custoHoraCnc, custoHoraEdm, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup, etapasPersonalizadas }) {
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
            ...(etapasPersonalizadas !== undefined && { etapas_personalizadas: etapasPersonalizadas }),
        };
        const { data, error } = await supabase
            .from('configuracoes_empresa')
            .upsert(payload, { onConflict: 'empresa_id' })
            .select()
            .single();
        if (error && String(error.message || '').includes('etapas_personalizadas')) {
            const { etapas_personalizadas: _omit, ...semEtapas } = payload;
            const retry = await supabase
                .from('configuracoes_empresa')
                .upsert(semEtapas, { onConflict: 'empresa_id' })
                .select()
                .single();
            if (retry.error) throw retry.error;
            return retry.data;
        }
        if (error) throw error;
        return data;
    }
};
