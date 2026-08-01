import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error('Usuário não autenticado');
    return state.empresaId;
};

export const configService = {
    async fetch() {
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

    async upsert({ custoHoraMaquina, turnos, pinOnboarding }) {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('configuracoes_empresa')
            .upsert({
                empresa_id: empresaId,
                custo_hora_maquina: custoHoraMaquina,
                turnos: turnos,
                pin_onboarding: pinOnboarding
            }, { onConflict: 'empresa_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
