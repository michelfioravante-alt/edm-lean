import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

const empresaId = () => useAuthStore.getState().empresaId;

export const convitesService = {
    async fetchAll() {
        if (isLocalMode()) return localApi.convites.fetchAll();
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
        if (isLocalMode()) return localApi.convites.create({ nome, funcao, setorPadrao, pin });
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
        if (isLocalMode()) return localApi.convites.revoke(id);
        const { error } = await supabase
            .from('convites_acesso')
            .update({ ativo: false })
            .eq('id', id);
        if (error) throw error;
    },

    async updatePin(id, pin) {
        if (isLocalMode()) return localApi.convites.updatePin(id, pin);
        const { data, error } = await supabase
            .from('convites_acesso')
            .update({ pin: String(pin) })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async findByPin(inviteCode, pin) {
        if (isLocalMode()) return localApi.convites.findByPin(inviteCode, pin);
        const { data, error } = await supabase.rpc('buscar_convite_por_pin', {
            p_codigo: (inviteCode || '').trim().toUpperCase(),
            p_pin: String(pin),
        });
        if (error) {
            console.warn('buscar_convite_por_pin:', error.message);
            return null;
        }
        const row = Array.isArray(data) ? data[0] : data;
        return row || null;
    },
};
