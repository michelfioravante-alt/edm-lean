import { colKeyToStatus } from '../constants/cncProcess';

const EMPRESA_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000099';

function id(n) {
    return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const now = new Date();
const ago = (hours) => new Date(now.getTime() - hours * 3600000).toISOString();

export function createSeedDatabase() {
    const maquinas = [
        { id: id(101), empresa_id: EMPRESA_ID, nome: 'DMU 50', status: 'Rodando', created_at: ago(720) },
        { id: id(102), empresa_id: EMPRESA_ID, nome: 'Haas VF-2', status: 'Parada', created_at: ago(720) },
    ];

    return {
        empresa: {
            id: EMPRESA_ID,
            nome_fantasia: 'Oficina CNC — Modo Estudo',
            codigo_convite: 'CNCDEMO1',
            plano: 'piloto',
            created_at: ago(1),
        },
        configuracoes: {
            empresa_id: EMPRESA_ID,
            custo_hora_maquina: 85,
            turnos: [
                { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' },
                { id: 't2', nome: 'Turno 2', inicio: '15:30', fim: '23:30' },
            ],
            pin_onboarding: '1234',
            limite_maquinas: 10,
            modo_magazine_default: 'individual',
            baixa_estoque_setup: false,
        },
        maquinas,
        operadores: [
            { id: id(201), empresa_id: EMPRESA_ID, nome: 'Carlos Silva', funcao: 'Operador', created_at: ago(500) },
            { id: id(202), empresa_id: EMPRESA_ID, nome: 'Ana Souza', funcao: 'Operador', created_at: ago(500) },
        ],
        programadores: [
            { id: id(301), empresa_id: EMPRESA_ID, nome: 'Marcos CAM', created_at: ago(500) },
        ],
        clientes: [
            { id: id(401), empresa_id: EMPRESA_ID, nome: 'Indústria Alpha', email: 'alpha@exemplo.com', telefone: null, created_at: ago(400) },
            { id: id(402), empresa_id: EMPRESA_ID, nome: 'Metalúrgica Beta', email: null, telefone: '51999990000', created_at: ago(400) },
        ],
        estoque_itens: [
            { id: id(501), empresa_id: EMPRESA_ID, nome: 'Insert APKT1604', quantidade: 24, alerta_minimo: 5, created_at: ago(200) },
            { id: id(502), empresa_id: EMPRESA_ID, nome: 'Fluido de corte', quantidade: 3, alerta_minimo: 2, created_at: ago(200) },
            { id: id(503), empresa_id: EMPRESA_ID, nome: 'Fresa D8 4F', quantidade: 10, alerta_minimo: 3, created_at: ago(200) },
        ],
        historico_quebras_estoque: [],
        ferramentas_maquina: [],
        ferramental: [
            { id: id(601), empresa_id: EMPRESA_ID, nome: 'Fresa D10 4F', tipo: 'Fresa', codigo: 'T-001', vida_util_horas: 40, alerta_horas: 5, horas_usadas: 28, status: 'em_uso', maquina_id: id(101), observacao: null, created_at: ago(100) },
            { id: id(602), empresa_id: EMPRESA_ID, nome: 'Broca Ø6 HSS', tipo: 'Broca', codigo: 'T-002', vida_util_horas: 20, alerta_horas: 3, horas_usadas: 4, status: 'disponivel', maquina_id: null, observacao: null, created_at: ago(100) },
            { id: id(603), empresa_id: EMPRESA_ID, nome: 'Insert TNMG1604', tipo: 'Insert', codigo: 'T-003', vida_util_horas: 8, alerta_horas: 1, horas_usadas: 8, status: 'quebrado', maquina_id: null, observacao: 'Quebrou no acabamento OP20', created_at: ago(50) },
        ],
        historico_ferramental: [
            { id: id(701), empresa_id: EMPRESA_ID, ferramental_id: id(603), evento: 'quebra', maquina_nome: 'DMU 50', operador_nome: 'Carlos Silva', horas_no_evento: 8, observacao: 'Insert estourou no acabamento', created_at: ago(12) },
        ],
        historico_consumiveis: [],
        kanbans_automaticos: [],
        perfis: [
            { id: USER_ID, empresa_id: EMPRESA_ID, nome: 'Admin Demo', funcao: 'admin', created_at: ago(720) },
        ],
        ordens_servico: [
            {
                id: id(801), empresa_id: EMPRESA_ID, codigo_peca: 'OP-1001', cliente: 'Indústria Alpha',
                status: colKeyToStatus('aFazer'), is_prioridade: true, quantidade: 10, posicao: 1,
                tempo_estimado_setup_horas: 0, tempo_estimado_setup_minutos: 45,
                tempo_estimado_corte_horas: 2, tempo_estimado_corte_minutos: 30,
                programador: 'Marcos CAM', created_at: ago(48), is_pausado: false,
                total_setups: 2, setup_atual: 1, nomes_setups: ['OP10 - Lado A', 'OP20 - Virada Lado B'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(802), empresa_id: EMPRESA_ID, codigo_peca: 'OP-1002', cliente: 'Metalúrgica Beta',
                status: colKeyToStatus('setup'), is_prioridade: false, quantidade: 4, posicao: null,
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 0,
                tempo_estimado_corte_horas: 3, tempo_estimado_corte_minutos: 15,
                programador: 'Marcos CAM', timestamp_entrada_setup: ago(3), created_at: ago(36), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['OP10'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(803), empresa_id: EMPRESA_ID, codigo_peca: 'OP-1003', cliente: 'Indústria Alpha',
                status: colKeyToStatus('emCorte'), maquina_nome: 'DMU 50', operador_atual: 'Carlos Silva',
                is_prioridade: false, quantidade: 2, tempo_estimado_corte_horas: 1, tempo_estimado_corte_minutos: 20,
                timestamp_entrada_emcorte: ago(1.5), created_at: ago(24), is_pausado: false,
                total_setups: 2, setup_atual: 1, nomes_setups: ['OP10 - Desbaste', 'OP20 - Acabamento'],
                historico_pausas: [], tempos_fases: { setup: 0.8, emCorte: 0, afericao: 0 },
            },
            {
                id: id(804), empresa_id: EMPRESA_ID, codigo_peca: 'OP-1004', cliente: 'Metalúrgica Beta',
                status: colKeyToStatus('afericao'), maquina_nome: 'Haas VF-2', operador_atual: 'Ana Souza',
                quantidade: 1, timestamp_entrada_afericao: ago(0.5), created_at: ago(12), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['OP10'],
                historico_pausas: [], tempos_fases: { setup: 0.5, emCorte: 2.1, afericao: 0 },
            },
            {
                id: id(805), empresa_id: EMPRESA_ID, codigo_peca: 'OP-1005', cliente: 'Indústria Alpha',
                status: colKeyToStatus('concluido'), maquina_nome: 'DMU 50', operador_atual: 'Carlos Silva',
                quantidade: 6, quantidade_concluida: 6, resultado_afericao: 'Aprovado',
                timestamp_entrada_concluido: ago(2), created_at: ago(72), is_pausado: false,
                total_setups: 2, setup_atual: 2, nomes_setups: ['OP10', 'OP20 Virada'],
                historico_pausas: [], tempos_fases: { setup: 0.4, emCorte: 1.8, afericao: 0.2 },
            },
        ],
    };
}

export const LOCAL_EMPRESA_ID = EMPRESA_ID;
export const LOCAL_USER_ID = USER_ID;
