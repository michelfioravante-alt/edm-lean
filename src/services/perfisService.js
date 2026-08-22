import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const getEmpresaId = () => {
    const state = useAuthStore.getState();
    return state.empresaId;
};

export const perfisService = {
    // Busca todos os usuários da mesma empresa
    async fetchEquipe() {
        if (isLocalMode()) return localApi.perfis.fetchEquipe();
        const empresaId = getEmpresaId();
        if (!empresaId) return [];

        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('empresa_id', empresaId);

        if (error) throw error;
        return data;
    },

    // Atualiza cargo do usuário
    async updateRole(userId, newRole) {
        if (isLocalMode()) return localApi.perfis.updateRole(userId, newRole);
        const { error } = await supabase
            .from('perfis')
            .update({ funcao: newRole })
            .eq('id', userId);

        if (error) throw error;
    },

    // Remove o vínculo do usuário com a empresa (Detach)
    async detachUser(userId) {
        if (isLocalMode()) return localApi.perfis.detachUser(userId);
        const { error } = await supabase
            .from('perfis')
            .update({ empresa_id: null, funcao: 'programmer' })
            .eq('id', userId);

        if (error) throw error;
    },

    // Gera um código de convite baseado no ID da empresa (simplificado)
    // Em um sistema real, poderíamos ter uma tabela de tokens, mas para MVP o ID da empresa serve.
    getInviteCode() {
        const empresaId = getEmpresaId();
        if (!empresaId) return '';
        // Codifica o ID da empresa para não ficar óbvio
        return btoa(empresaId).slice(0, 8).toUpperCase();
    }
};
