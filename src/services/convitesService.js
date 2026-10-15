import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

const empresaId = () => useAuthStore.getState().empresaId;

export const convitesService = {
    async fetchAll() {
        const eid = empresaId();
        if (!eid) return [];
        const { data, error } = await supabase
            .from('convites_acesso')
            .select('*')
            .eq('empresa_id', eid)
            .eq('ativo', true)
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('convites_acesso:', error.message);
            return [];
        }
        return data || [];
    },

    async create({ nome, funcao, setorPadrao, pin }) {
        const eid = empresaId();
        const { data, error } = await supabase
            .from('convites_acesso')
            .insert({
                empresa_id: eid,
                nome,
                funcao,
                setor_padrao: setorPadrao,
                pin,
                ativo: true,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async revoke(id) {
        const { error } = await supabase
            .from('convites_acesso')
            .update({ ativo: false })
            .eq('id', id);
        if (error) throw error;
    },

    async updatePin(id, pin) {
        const { data, error } = await supabase
            .from('convites_acesso')
            .update({ pin: String(pin) })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
