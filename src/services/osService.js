import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { uploadOsPrint } from './osPrints';
import { novaOsRow, osPatchEditavel } from '../utils/osPayload';
import { camposLivres } from '../utils/relogioOs';

// Helper: Garante que toda query tenha o empresa_id atrelado (Embora o RLS segure no back, mandamos do front por segurança/organização)
const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error("Usuário não autenticado ou sem empresa vinculada");
    return state.empresaId;
};

async function resolveFolhaBlob(osData) {
    if (osData?.folhaBlob instanceof Blob) return osData.folhaBlob;
    const inline = osData?.folha_imagem || osData?.folhaImagem;
    if (typeof inline === 'string' && inline.startsWith('data:')) {
        const res = await fetch(inline);
        return res.blob();
    }
    return null;
}

const ehGestor = () => useAuthStore.getState().role === 'admin';

/** valor_orcado mora em os_valores (RLS só gestor); aqui volta para dentro do card. */
async function comValores(rows) {
    if (!ehGestor() || !rows?.length) return rows || [];
    const { data, error } = await supabase
        .from('os_valores')
        .select('os_id, valor_orcado')
        .eq('empresa_id', getEmpresaId());
    if (error) {
        console.warn('os_valores:', error.message);
        return rows;
    }
    const porOs = new Map(data.map((v) => [v.os_id, v.valor_orcado]));
    return rows.map((r) => ({ ...r, valor_orcado: porOs.get(r.id) ?? null }));
}

async function salvarValor(osId, valor) {
    if (!ehGestor()) return;
    const { error } = await supabase
        .from('os_valores')
        .upsert({ os_id: osId, empresa_id: getEmpresaId(), valor_orcado: valor }, { onConflict: 'os_id' });
    if (error) throw error;
}

async function updateRow(id, payload) {
    const { valor_orcado: valor, ...campos } = payload;
    if (valor !== undefined) await salvarValor(id, valor);
    const tabela = supabase.from('ordens_servico');
    const query = Object.keys(campos).length ? tabela.update(campos).select() : tabela.select();
    const { data, error } = await query
        .eq('id', id)
        .eq('empresa_id', getEmpresaId())
        .single();
    if (error) throw error;
    return valor !== undefined && ehGestor() ? { ...data, valor_orcado: valor } : data;
}

async function rpcOs(funcao, args) {
    const { data, error } = await supabase.rpc(funcao, args);
    if (error) throw error;
    return data;
}

export const osService = {

    // Abertas + concluídas das últimas 48h (histórico antigo fica em Registros / searchHistorico)
    async fetchAllAtivas() {
        const empresaId = getEmpresaId();
        const corteConcluido = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*')
            .eq('empresa_id', empresaId)
            .neq('status', 'Excluído')
            .or(`status.neq.Concluído,timestamp_entrada_concluido.gte."${corteConcluido}"`)
            .order('posicao', { ascending: true })
            .order('is_prioridade', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(500);

        if (error) throw error;
        return comValores(data);
    },

    // Salva a nova posição de cada card da coluna 'A fazer' em lote
    async updatePositions(orderedIds) {
        const empresaId = getEmpresaId();
        const updates = orderedIds.map((id, index) => ({
            id,
            empresa_id: empresaId,
            posicao: index + 1,
        }));

        const { error } = await supabase
            .from('ordens_servico')
            .upsert(updates, { onConflict: 'id' });

        if (error) throw error;
    },

    // Busca apenas as O.S excluídas (para a aba Registros)
    async fetchExcluidos() {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('status', 'Excluído')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('fetchExcluidos error:', error.message);
            return [];
        }
        return comValores(data);
    },

    /** Busca histórico de peças/moldes no banco (inclui concluídas fora do kanban). */
    async searchHistorico({ codigoPeca, codigoMolde, cliente, term, limit = 50 } = {}) {
        if (!codigoPeca && !codigoMolde && !cliente && !term) return [];
        const empresaId = getEmpresaId();
        let q = supabase
            .from('ordens_servico')
            .select('*')
            .eq('empresa_id', empresaId)
            .neq('status', 'Excluído')
            .order('created_at', { ascending: false })
            .limit(Math.min(limit, 100));

        if (term) {
            const t = String(term).trim();
            q = q.or(`codigo_peca.ilike.%${t}%,cliente.ilike.%${t}%,codigo_molde.ilike.%${t}%`);
        } else {
            if (codigoPeca) {
                q = q.ilike('codigo_peca', `%${String(codigoPeca).trim()}%`);
            }
            if (codigoMolde) {
                q = q.ilike('codigo_molde', `%${String(codigoMolde).trim()}%`);
            }
            if (cliente) {
                q = q.ilike('cliente', `%${String(cliente).trim()}%`);
            }
        }

        const { data, error } = await q;
        if (error) throw error;
        return comValores(data);
    },

    /** Lista concluídas recentes além do recorte do kanban (48h). */
    async fetchConcluidasHistorico({ limit = 200, codigoPeca } = {}) {
        return osService.searchHistorico({
            codigoPeca,
            limit,
        }).then((rows) => rows.filter((o) => o.status === 'Concluído'));
    },

    async create(osData) {
        const blob = await resolveFolhaBlob(osData);
        const empresaId = getEmpresaId();
        const { valor_orcado: valor, ...row } = novaOsRow(osData);
        const { data, error } = await supabase
            .from('ordens_servico')
            .insert({ ...row, empresa_id: empresaId, folha_imagem: null })
            .select()
            .single();
        if (error) throw error;
        const pendente = {
            ...(valor != null && { valor_orcado: valor }),
            ...(blob && { folha_imagem: await uploadOsPrint(empresaId, data.id, blob) }),
        };
        return Object.keys(pendente).length ? updateRow(data.id, pendente) : data;
    },

    /** Transição de coluna: o banco fecha a fase com a hora do servidor (mover_os). */
    async moveOs(id, destCol, params = {}) {
        const { valor_orcado: valor, ...campos } = camposLivres(params);
        if (valor !== undefined) await salvarValor(id, valor);
        return rpcOs('mover_os', { p_os_id: id, p_destino: destCol, p_campos: campos });
    },

    async pausar(id, motivo, observacao = null) {
        return rpcOs('pausar_os', { p_os_id: id, p_motivo: motivo, p_observacao: observacao });
    },

    async retomar(id) {
        return rpcOs('retomar_os', { p_os_id: id });
    },

    /** Pausa informada depois do fato (falta de energia, quebra de ferramenta). */
    async registrarPausa(id, { inicio, fim, motivo, observacao = null }) {
        return rpcOs('registrar_pausa_os', {
            p_os_id: id, p_inicio: inicio, p_fim: fim, p_motivo: motivo, p_observacao: observacao,
        });
    },

    // Atualização de campos editáveis (nunca status/tempos/pausas — isso é RPC)
    async updateOs(id, updateData) {
        return updateRow(id, osPatchEditavel(updateData));
    },

    // Edição de campos pelo usuário (cliente, prazo, tempos estimados, etc)
    async editOs(id, fields) {
        const payload = osPatchEditavel(fields);
        if (fields.folhaBlob instanceof Blob) {
            payload.folha_imagem = await uploadOsPrint(getEmpresaId(), id, fields.folhaBlob);
        } else if (typeof payload.folha_imagem === 'string' && payload.folha_imagem.startsWith('data:')) {
            payload.folha_imagem = null;
        }
        return updateRow(id, payload);
    },

    async delete(id) {
        return rpcOs('excluir_os', { p_os_id: id });
    },

    async fetchStatsByCliente(clienteNome) {
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('id, created_at, status, codigo_peca, setor, maquina_nome, resultado_afericao, quantidade, quantidade_concluida, prazo_entrega, tempos_fases, tempo_estimado_corte_horas, tempo_estimado_setup_horas, is_pausado')
            .eq('empresa_id', empresaId)
            .eq('cliente', clienteNome)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
};
