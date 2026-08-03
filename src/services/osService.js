import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { localApi } from '../local/localApi';

// Helper: Garante que toda query tenha o empresa_id atrelado (Embora o RLS segure no back, mandamos do front por segurança/organização)
const getEmpresaId = () => {
    const state = useAuthStore.getState();
    if (!state.user || !state.empresaId) throw new Error("Usuário não autenticado ou sem empresa vinculada");
    return state.empresaId;
};

export const osService = {

    // Busca todas as Ordens de Serviço da Empresa (Exceto Excluídas)
    // limit(1000) evita puxar volume gigante e estourar egress no Supabase
    async fetchAllAtivas() {
        if (isLocalMode()) return localApi.os.fetchAllAtivas();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*')
            .eq('empresa_id', empresaId)
            .neq('status', 'Excluído')
            .order('posicao', { ascending: true })
            .order('is_prioridade', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1000);

        if (error) throw error;
        return data || [];
    },

    // Salva a nova posição de cada card da coluna 'A fazer' em lote
    async updatePositions(orderedIds) {
        if (isLocalMode()) return localApi.os.updatePositions(orderedIds);
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
        if (isLocalMode()) return localApi.os.fetchExcluidos();
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*')
            .eq('empresa_id', empresaId)
            // Filtro robusto para aceitar com ou sem acento
            .or('status.eq.Excluído,status.eq.Excluido')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('fetchExcluidos error:', error.message);
            return [];
        }
        return data || [];
    },

    // Cria nova O.S
    async create(osData) {
        if (isLocalMode()) return localApi.os.create(osData);
        const empresaId = getEmpresaId();

        // Mapeia o objeto do state pro formato do banco (Snake Case)
        // Aceita tanto CamelCase (vindo do form) quanto SnakeCase (vindo do banco/split)
        const payload = {
            empresa_id: empresaId,
            codigo_peca: osData.codigo_peca || osData.codigoPeca,
            cliente: osData.cliente,
            link_desenho: osData.link_desenho || osData.linkDesenho || null,
            is_prioridade: osData.is_prioridade !== undefined ? osData.is_prioridade : (osData.isPrioridade || false),
            status: osData.status || 'A fazer',
            tempo_estimado_corte_horas: parseInt(osData.tempo_estimado_corte_horas || osData.tempoEstimadoCorteHoras) || 0,
            tempo_estimado_corte_minutos: parseInt(osData.tempo_estimado_corte_minutos || osData.tempoEstimadoCorteMinutos) || 0,
            tempo_estimado_setup_horas: parseInt(osData.tempo_estimado_setup_horas || osData.tempoEstimadoSetupHoras) || 0,
            tempo_estimado_setup_minutos: parseInt(osData.tempo_estimado_setup_minutos || osData.tempoEstimadoSetupMinutos) || 0,
            prazo_entrega: osData.prazo_entrega || (osData.prazoEntrega ? (osData.prazoEntrega.includes('T') ? osData.prazoEntrega : `${osData.prazoEntrega}T12:00:00Z`) : null),
            programador: osData.programador || osData.programador_nome || null,
            quantidade: parseInt(osData.quantidade) || 1,
            quantidade_concluida: parseInt(osData.quantidade_concluida || osData.quantidadeConcluida) || 0,
            posicao: osData.posicao || null, // Otimização: recebe a posição já calculada do front
            parent_id: osData.parent_id || null,

            // Campos do módulo CNC (requer supabase_cnc_campos.sql aplicado)
            total_setups: parseInt(osData.total_setups || osData.totalSetups) || 1,
            setup_atual: parseInt(osData.setup_atual || osData.setupAtual) || 1,
            nomes_setups: osData.nomes_setups || osData.nomesSetups || [],
            detalhes_setups: osData.detalhes_setups || osData.detalhesSetups || [],
            codigo_molde: osData.codigo_molde || osData.codigoMolde || null,
            componente_molde: osData.componente_molde || osData.componenteMolde || null,
            numero_programa: osData.numero_programa || osData.numeroPrograma || null,
            nx_import: osData.nx_import || osData.nxImport || null,
            estrategia_ferramental: osData.estrategia_ferramental || osData.estrategiaFerramental || null,
            aguardando_tt: osData.aguardando_tt ?? false,
            observacao_tt: osData.observacao_tt || null
        };

        try {
            const { data, error } = await supabase
                .from('ordens_servico')
                .insert(payload)
                .select() // Pede pra devolver o objeto criado com o ID oficial do banco
                .single();

            if (error) {
                console.error('ERRO RETORNADO PELO SUPABASE:', error);
                throw error;
            }
            return data;
        } catch (err) {
            console.error('FALHA CRÍTICA NO OSSERVICE.CREATE:', err);
            throw err;
        }
    },

    // Transição de coluna (Arrastar e Soltar)
    async moveOs(id, newStatus, novosParametros = {}) {
        if (isLocalMode()) return localApi.os.moveOs(id, newStatus, novosParametros);
        const empresaId = getEmpresaId();

        // 1. MAPEAMENTO EXPLÍCITO DE COLUNAS DO SUPABASE
        // IMPORTANTE: Nunca envie campos que não existam no banco, ou o Supabase rejeita com erro 400
        let payload = {
            status: newStatus,
            is_pausado: false,
            data_pausa: null,
            motivo_pausa: null,
            observacao_pausa: null
        };

        // Mapeamento de Timestamps de entrada em cada fase
        if (novosParametros.timestampEntrada_setup || novosParametros.timestampEntradaSetup)
            payload.timestamp_entrada_setup = novosParametros.timestampEntrada_setup || novosParametros.timestampEntradaSetup;

        if (novosParametros.timestampEntrada_emCorte || novosParametros.timestampEntradaCorte)
            payload.timestamp_entrada_emcorte = novosParametros.timestampEntrada_emCorte || novosParametros.timestampEntradaCorte;

        if (novosParametros.timestampEntrada_afericao || novosParametros.timestampEntradaAfericao)
            payload.timestamp_entrada_afericao = novosParametros.timestampEntrada_afericao || novosParametros.timestampEntradaAfericao;

        if (novosParametros.timestampEntrada_concluido || novosParametros.timestampEntradaConcluido)
            payload.timestamp_entrada_concluido = novosParametros.timestampEntrada_concluido || novosParametros.timestampEntradaConcluido;

        // Mapeamento de outros campos de negócio (null explícito para limpar ao devolver para A fazer)
        if (novosParametros.maquina_nome !== undefined || novosParametros.maquina !== undefined)
            payload.maquina_nome = novosParametros.maquina_nome ?? novosParametros.maquina ?? null;

        if (novosParametros.operador_atual !== undefined || novosParametros.operadorAtual !== undefined)
            payload.operador_atual = novosParametros.operador_atual ?? novosParametros.operadorAtual ?? null;

        if (novosParametros.resultadoAfericao || novosParametros.resultado_afericao)
            payload.resultado_afericao = novosParametros.resultadoAfericao || novosParametros.resultado_afericao;

        if (novosParametros.motivoRefugo || novosParametros.motivo_refugo)
            payload.motivo_refugo = novosParametros.motivoRefugo || novosParametros.motivo_refugo;

        if (novosParametros.quantidade !== undefined) payload.quantidade = novosParametros.quantidade;
        if (novosParametros.quantidade_concluida !== undefined) payload.quantidade_concluida = novosParametros.quantidade_concluida;
        if (novosParametros.posicao !== undefined) payload.posicao = novosParametros.posicao;
        if (novosParametros.tempos_fases || novosParametros.temposFases)
            payload.tempos_fases = novosParametros.tempos_fases || novosParametros.temposFases;
        if (novosParametros.tempo_estimado_setup_horas !== undefined) payload.tempo_estimado_setup_horas = novosParametros.tempo_estimado_setup_horas;
        if (novosParametros.tempo_estimado_setup_minutos !== undefined) payload.tempo_estimado_setup_minutos = novosParametros.tempo_estimado_setup_minutos;
        if (novosParametros.tempo_estimado_corte_horas !== undefined) payload.tempo_estimado_corte_horas = novosParametros.tempo_estimado_corte_horas;
        if (novosParametros.tempo_estimado_corte_minutos !== undefined) payload.tempo_estimado_corte_minutos = novosParametros.tempo_estimado_corte_minutos;

        // Campos do módulo CNC
        if (novosParametros.setup_atual !== undefined || novosParametros.setupAtual !== undefined)
            payload.setup_atual = novosParametros.setup_atual ?? novosParametros.setupAtual;
        if (novosParametros.estrategia_ferramental !== undefined || novosParametros.estrategiaFerramental !== undefined)
            payload.estrategia_ferramental = novosParametros.estrategia_ferramental ?? novosParametros.estrategiaFerramental ?? null;
        if (novosParametros.aguardando_tt !== undefined) payload.aguardando_tt = novosParametros.aguardando_tt;
        if (novosParametros.observacao_tt !== undefined) payload.observacao_tt = novosParametros.observacao_tt;

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(payload)
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();

        if (error) {
            console.error("Erro no Supabase moveOs:", error);
            throw error;
        }
        return data;
    },

    // Pausar / Retomar / Atualizar Tempos Históricos
    async updateOs(id, updateData) {
        if (isLocalMode()) return localApi.os.updateOs(id, updateData);
        const empresaId = getEmpresaId();

        // Mapeia do CamelCase do front pro SnakeCase do Banco
        // IMPORTANTE: Mapeamento explícito para evitar erros de coluna inválida no Supabase
        const payload = {};
        if (updateData.isPausado !== undefined) payload.is_pausado = updateData.isPausado;
        if (updateData.is_pausado !== undefined) payload.is_pausado = updateData.is_pausado;

        if (updateData.historicoPausas !== undefined) payload.historico_pausas = updateData.historicoPausas;
        if (updateData.historico_pausas !== undefined) payload.historico_pausas = updateData.historico_pausas;

        if (updateData.temposFases !== undefined) payload.tempos_fases = updateData.temposFases;
        if (updateData.tempos_fases !== undefined) payload.tempos_fases = updateData.tempos_fases;

        if (updateData.resultadoAfericao !== undefined) payload.resultado_afericao = updateData.resultadoAfericao;
        if (updateData.resultado_afericao !== undefined) payload.resultado_afericao = updateData.resultado_afericao;

        if (updateData.motivoRefugo !== undefined) payload.motivo_refugo = updateData.motivoRefugo;
        if (updateData.motivo_refugo !== undefined) payload.motivo_refugo = updateData.motivo_refugo;

        if (updateData.dataPausa !== undefined) payload.data_pausa = updateData.dataPausa;
        if (updateData.data_pausa !== undefined) payload.data_pausa = updateData.data_pausa;

        if (updateData.motivoPausa !== undefined) payload.motivo_pausa = updateData.motivoPausa;
        if (updateData.motivo_pausa !== undefined) payload.motivo_pausa = updateData.motivo_pausa;

        if (updateData.observacaoPausa !== undefined) payload.observacao_pausa = updateData.observacaoPausa;
        if (updateData.observacao_pausa !== undefined) payload.observacao_pausa = updateData.observacao_pausa;

        if (updateData.quantidade !== undefined) payload.quantidade = updateData.quantidade;
        if (updateData.quantidade_concluida !== undefined) payload.quantidade_concluida = updateData.quantidade_concluida;
        if (updateData.quantidadeConcluida !== undefined) payload.quantidade_concluida = updateData.quantidadeConcluida;

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(payload)
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();

        if (error) {
            console.error("Erro no Supabase updateOs:", error);
            throw error;
        }
        return data;
    },

    // Edição de campos pelo usuário (cliente, prazo, tempos estimados, etc)
    async editOs(id, fields) {
        if (isLocalMode()) return localApi.os.editOs(id, fields);
        const empresaId = getEmpresaId();

        const payload = {};
        if (fields.cliente !== undefined) payload.cliente = fields.cliente;
        if (fields.codigoPeca !== undefined) payload.codigo_peca = fields.codigoPeca;
        if (fields.prazoEntrega !== undefined) payload.prazo_entrega = fields.prazoEntrega ? (fields.prazoEntrega.includes('T') ? fields.prazoEntrega : `${fields.prazoEntrega}T12:00:00Z`) : null;
        if (fields.tempoEstimadoCorteHoras !== undefined) payload.tempo_estimado_corte_horas = parseInt(fields.tempoEstimadoCorteHoras) || 0;
        if (fields.tempoEstimadoCorteMinutos !== undefined) payload.tempo_estimado_corte_minutos = parseInt(fields.tempoEstimadoCorteMinutos) || 0;
        if (fields.tempoEstimadoSetupHoras !== undefined) payload.tempo_estimado_setup_horas = parseInt(fields.tempoEstimadoSetupHoras) || 0;
        if (fields.tempoEstimadoSetupMinutos !== undefined) payload.tempo_estimado_setup_minutos = parseInt(fields.tempoEstimadoSetupMinutos) || 0;
        if (fields.programador !== undefined || fields.programador_nome !== undefined) {
            payload.programador = fields.programador ?? fields.programador_nome ?? null;
        }
        if (fields.linkDesenho !== undefined) payload.link_desenho = fields.linkDesenho || null;
        if (fields.isPrioridade !== undefined) payload.is_prioridade = fields.isPrioridade;
        if (fields.quantidade !== undefined) payload.quantidade = parseInt(fields.quantidade) || 1;

        // Campos do módulo CNC (requer supabase_cnc_campos.sql aplicado)
        if (fields.codigoMolde !== undefined) payload.codigo_molde = fields.codigoMolde || null;
        if (fields.componenteMolde !== undefined) payload.componente_molde = fields.componenteMolde || null;
        if (fields.numeroPrograma !== undefined) payload.numero_programa = fields.numeroPrograma || null;
        if (fields.totalSetups !== undefined) payload.total_setups = parseInt(fields.totalSetups) || 1;
        if (fields.setupAtual !== undefined) payload.setup_atual = parseInt(fields.setupAtual) || 1;
        if (fields.nomesSetups !== undefined) payload.nomes_setups = fields.nomesSetups;
        if (fields.detalhesSetups !== undefined) payload.detalhes_setups = fields.detalhesSetups;

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(payload)
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        if (isLocalMode()) return localApi.os.delete(id);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .update({ status: 'Excluído' })
            .eq('id', id)
            .eq('empresa_id', empresaId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async fetchStatsByCliente(clienteNome) {
        if (isLocalMode()) return localApi.os.fetchStatsByCliente(clienteNome);
        const empresaId = getEmpresaId();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('id, created_at, status')
            .eq('empresa_id', empresaId)
            .eq('cliente', clienteNome);
        if (error) throw error;
        return data || [];
    }
};
