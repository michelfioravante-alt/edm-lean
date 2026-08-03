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
        // Setor CNC
        { id: id(101), empresa_id: EMPRESA_ID, nome: 'DMU 50 (5 Eixos CNC)', setor: 'CNC', status: 'Rodando', created_at: ago(720) },
        { id: id(102), empresa_id: EMPRESA_ID, nome: 'Haas VF-2 (3 Eixos CNC)', setor: 'CNC', status: 'Rodando', created_at: ago(720) },
        { id: id(103), empresa_id: EMPRESA_ID, nome: 'Romi D800 (CNC)', setor: 'CNC', status: 'Manutenção', created_at: ago(720) },
        // Setor EDM_FIO
        { id: id(104), empresa_id: EMPRESA_ID, nome: 'Fanuc Robocut α-C400iB (WEDM)', setor: 'EDM_FIO', status: 'Rodando', created_at: ago(720) },
        { id: id(105), empresa_id: EMPRESA_ID, nome: 'Charmilles Cut 200 (WEDM)', setor: 'EDM_FIO', status: 'Parada', created_at: ago(720) },
        { id: id(106), empresa_id: EMPRESA_ID, nome: 'Sodick ALN400G (WEDM)', setor: 'EDM_FIO', status: 'Rodando', created_at: ago(720) },
    ];

    return {
        empresa: {
            id: EMPRESA_ID,
            nome_fantasia: 'EDM Lean — Ferramentaria & Usinagem (Demonstração)',
            codigo_convite: 'EDMDEAN1',
            plano: 'enterprise',
            created_at: ago(1),
        },
        configuracoes: {
            empresa_id: EMPRESA_ID,
            custo_hora_maquina: 85,
            custo_hora_cnc: 80,
            custo_hora_edm: 120,
            turnos: [
                { id: 't1', nome: '1º Turno Manhã', inicio: '07:30', fim: '15:30' },
                { id: 't2', nome: '2º Turno Tarde', inicio: '15:30', fim: '23:30' },
            ],
            pin_onboarding: '1234',
            limite_maquinas: 15,
            modo_magazine_default: 'individual',
            baixa_estoque_setup: true,
        },
        maquinas,
        operadores: [
            { id: id(201), empresa_id: EMPRESA_ID, nome: 'Carlos Silva', setor: 'CNC', funcao: 'Operador CNC', created_at: ago(500) },
            { id: id(202), empresa_id: EMPRESA_ID, nome: 'Ana Souza', setor: 'CNC', funcao: 'Operador CNC', created_at: ago(500) },
            { id: id(203), empresa_id: EMPRESA_ID, nome: 'Roberto Mendes', setor: 'EDM_FIO', funcao: 'Operador Eletroerosão', created_at: ago(500) },
            { id: id(204), empresa_id: EMPRESA_ID, nome: 'Juliana Ramos', setor: 'EDM_FIO', funcao: 'Operador Eletroerosão', created_at: ago(500) },
            { id: id(205), empresa_id: EMPRESA_ID, nome: 'Fernando Oliveira', setor: 'TODOS', funcao: 'Líder de Produção', created_at: ago(500) },
        ],
        programadores: [
            { id: id(301), empresa_id: EMPRESA_ID, nome: 'Marcos CAM (Usinagem)', setor: 'CNC', created_at: ago(500) },
            { id: id(302), empresa_id: EMPRESA_ID, nome: 'Felipe WEDM (Fio)', setor: 'EDM_FIO', created_at: ago(500) },
        ],
        clientes: [
            { id: id(401), empresa_id: EMPRESA_ID, nome: 'Marcopolo S.A. (Carrocerias)', email: 'suprimentos@marcopolo.com.br', telefone: '5432182000', created_at: ago(400) },
            { id: id(402), empresa_id: EMPRESA_ID, nome: 'Gerdau Açominas S.A.', email: 'compras.rs@gerdau.com.br', telefone: '5133201000', created_at: ago(400) },
            { id: id(403), empresa_id: EMPRESA_ID, nome: 'Stihl Ferramentaria Motorizada', email: 'ferramentaria@stihl.com.br', telefone: '5135795000', created_at: ago(400) },
            { id: id(404), empresa_id: EMPRESA_ID, nome: 'Schulz Compressores Indústria', email: 'pcp@schulz.com.br', telefone: '4734516000', created_at: ago(400) },
            { id: id(405), empresa_id: EMPRESA_ID, nome: 'Trombetta Matrizes & Moldes', email: 'contato@trombetta.com.br', telefone: '5134709000', created_at: ago(400) },
        ],
        estoque_itens: [
            { id: id(501), empresa_id: EMPRESA_ID, nome: 'Fio de Latão Ø 0.25mm (Carretel 8kg)', setor: 'EDM_FIO', quantidade: 14, alerta_minimo: 4, created_at: ago(200) },
            { id: id(502), empresa_id: EMPRESA_ID, nome: 'Resina Desionizadora Deionex 25L', setor: 'EDM_FIO', quantidade: 2, alerta_minimo: 3, created_at: ago(200) },
            { id: id(503), empresa_id: EMPRESA_ID, nome: 'Filtro de Água WEDM Fanuc 3µm', setor: 'EDM_FIO', quantidade: 8, alerta_minimo: 2, created_at: ago(200) },
            { id: id(504), empresa_id: EMPRESA_ID, nome: 'Insert APKT 1604 Metal Duro', setor: 'CNC', quantidade: 45, alerta_minimo: 10, created_at: ago(200) },
            { id: id(505), empresa_id: EMPRESA_ID, nome: 'Insert WNMG 080408 Acabamento', setor: 'CNC', quantidade: 30, alerta_minimo: 8, created_at: ago(200) },
            { id: id(506), empresa_id: EMPRESA_ID, nome: 'Fresa Macho D10 4F TiAlN', setor: 'CNC', quantidade: 14, alerta_minimo: 4, created_at: ago(200) },
            { id: id(507), empresa_id: EMPRESA_ID, nome: 'Fluido Sintético de Usinagem 20L', setor: 'CNC', quantidade: 1, alerta_minimo: 2, created_at: ago(200) },
            { id: id(508), empresa_id: EMPRESA_ID, nome: 'Eletrodo de Cobre Ø 12mm', setor: 'EDM_FIO', quantidade: 18, alerta_minimo: 5, created_at: ago(200) },
        ],
        historico_quebras_estoque: [],
        ferramentas_maquina: [],
        ferramental: [
            { id: id(601), empresa_id: EMPRESA_ID, nome: 'Fresa Metal Duro D10 4F (Garrach)', tipo: 'Fresa', codigo: 'FER-010', vida_util_horas: 50, alerta_horas: 8, horas_usadas: 42, status: 'alerta', maquina_id: id(101), observacao: 'Verificar desgaste das arestas', created_at: ago(100) },
            { id: id(602), empresa_id: EMPRESA_ID, nome: 'Broca Ø6.8 HSS Co5 (Dormer)', tipo: 'Broca', codigo: 'FER-012', vida_util_horas: 30, alerta_horas: 5, horas_usadas: 12, status: 'disponivel', maquina_id: null, observacao: null, created_at: ago(100) },
            { id: id(603), empresa_id: EMPRESA_ID, nome: 'Insert WNMG 080408 (Iscar)', tipo: 'Insert', codigo: 'FER-099', vida_util_horas: 12, alerta_horas: 2, horas_usadas: 12, status: 'quebrado', maquina_id: null, observacao: 'Substituído após trinca no acabamento OP20', created_at: ago(50) },
            { id: id(604), empresa_id: EMPRESA_ID, nome: 'Fio de Latão BrassWire 0.25mm (Bedra)', tipo: 'Frequência', codigo: 'FER-WEDM1', vida_util_horas: 80, alerta_horas: 10, horas_usadas: 62, status: 'em_uso', maquina_id: id(104), observacao: 'Tensão nominal 12N', created_at: ago(80) },
            { id: id(605), empresa_id: EMPRESA_ID, nome: 'Cabeçote de Desbaste D50 R0.8', tipo: 'Fresa', codigo: 'FER-050', vida_util_horas: 120, alerta_horas: 15, horas_usadas: 45, status: 'disponivel', maquina_id: null, observacao: null, created_at: ago(150) },
        ],
        historico_ferramental: [
            { id: id(701), empresa_id: EMPRESA_ID, ferramental_id: id(603), evento: 'quebra', maquina_nome: 'DMU 50 (5 Eixos CNC)', operador_nome: 'Carlos Silva', horas_no_evento: 12, observacao: 'Insert estourou no acabamento do molde', created_at: ago(12) },
        ],
        historico_consumiveis: [],
        kanbans_automaticos: [],
        perfis: [
            { id: USER_ID, empresa_id: EMPRESA_ID, nome: 'Gestão Demo', funcao: 'admin', created_at: ago(720) },
        ],
        ordens_servico: [
            // Célula CNC
            {
                id: id(801), empresa_id: EMPRESA_ID, codigo_peca: 'OP-2045', cliente: 'Stihl Ferramentaria Motorizada',
                setor: 'CNC', status: colKeyToStatus('aFazer'), is_prioridade: true, quantidade: 12, posicao: 1,
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 15,
                tempo_estimado_corte_horas: 3, tempo_estimado_corte_minutos: 45,
                programador: 'Marcos CAM (Usinagem)', created_at: ago(48), is_pausado: false,
                total_setups: 2, setup_atual: 1, nomes_setups: ['OP10 - Desbaste Lado A', 'OP20 - Virada 5 Eixos'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(802), empresa_id: EMPRESA_ID, codigo_peca: 'OP-2041', cliente: 'Marcopolo S.A. (Carrocerias)',
                setor: 'CNC', status: colKeyToStatus('setup'), maquina_nome: 'DMU 50 (5 Eixos CNC)', operador_atual: 'Carlos Silva',
                is_prioridade: false, quantidade: 4, posicao: null,
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 30,
                tempo_estimado_corte_horas: 4, tempo_estimado_corte_minutos: 0,
                programador: 'Marcos CAM (Usinagem)', timestamp_entrada_setup: ago(2.5), created_at: ago(36), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['OP10 - Cavidade Molde'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(803), empresa_id: EMPRESA_ID, codigo_peca: 'OP-2038', cliente: 'Schulz Compressores Indústria',
                setor: 'CNC', status: colKeyToStatus('emCorte'), maquina_nome: 'Haas VF-2 (3 Eixos CNC)', operador_atual: 'Ana Souza',
                is_prioridade: false, quantidade: 2, tempo_estimado_corte_horas: 2, tempo_estimado_corte_minutos: 15,
                timestamp_entrada_emcorte: ago(1.8), created_at: ago(24), is_pausado: false,
                total_setups: 2, setup_atual: 1, nomes_setups: ['OP10 - Faceamento', 'OP20 - Formas Usinadas'],
                historico_pausas: [], tempos_fases: { setup: 0.9, emCorte: 0, afericao: 0 },
            },
            {
                id: id(804), empresa_id: EMPRESA_ID, codigo_peca: 'OP-2035', cliente: 'Gerdau Açominas S.A.',
                setor: 'CNC', status: colKeyToStatus('afericao'), maquina_nome: 'DMU 50 (5 Eixos CNC)', operador_atual: 'Carlos Silva',
                quantidade: 1, timestamp_entrada_afericao: ago(0.4), created_at: ago(12), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['OP10 - Extrator CNC'],
                historico_pausas: [], tempos_fases: { setup: 0.6, emCorte: 2.4, afericao: 0 },
            },
            {
                id: id(805), empresa_id: EMPRESA_ID, codigo_peca: 'OP-2030', cliente: 'Trombetta Matrizes & Moldes',
                setor: 'CNC', status: colKeyToStatus('concluido'), maquina_nome: 'Haas VF-2 (3 Eixos CNC)', operador_atual: 'Ana Souza',
                quantidade: 8, quantidade_concluida: 8, resultado_afericao: 'Aprovada',
                timestamp_entrada_concluido: ago(3), created_at: ago(72), is_pausado: false,
                total_setups: 2, setup_atual: 2, nomes_setups: ['OP10', 'OP20 Virada'],
                historico_pausas: [], tempos_fases: { setup: 0.5, emCorte: 3.2, afericao: 0.3 },
            },

            // Célula EDM Fio (WEDM)
            {
                id: id(806), empresa_id: EMPRESA_ID, codigo_peca: 'OP-3012', cliente: 'Trombetta Matrizes & Moldes',
                setor: 'EDM_FIO', status: colKeyToStatus('aFazer'), is_prioridade: true, quantidade: 6, posicao: 1,
                tempo_estimado_setup_horas: 0, tempo_estimado_setup_minutos: 40,
                tempo_estimado_corte_horas: 5, tempo_estimado_corte_minutos: 20,
                programador: 'Felipe WEDM (Fio)', created_at: ago(30), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['WEDM - Perfil Estampo 60 HRC'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(807), empresa_id: EMPRESA_ID, codigo_peca: 'OP-3008', cliente: 'Marcopolo S.A. (Carrocerias)',
                setor: 'EDM_FIO', status: colKeyToStatus('setup'), maquina_nome: 'Fanuc Robocut α-C400iB (WEDM)', operador_atual: 'Roberto Mendes',
                is_prioridade: false, quantidade: 2, posicao: null,
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 0,
                tempo_estimado_corte_horas: 4, tempo_estimado_corte_minutos: 30,
                programador: 'Felipe WEDM (Fio)', timestamp_entrada_setup: ago(1.2), created_at: ago(20), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['WEDM - Passada Desbaste + Acabamento'],
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(808), empresa_id: EMPRESA_ID, codigo_peca: 'OP-3005', cliente: 'Stihl Ferramentaria Motorizada',
                setor: 'EDM_FIO', status: colKeyToStatus('emCorte'), maquina_nome: 'Sodick ALN400G (WEDM)', operador_atual: 'Juliana Ramos',
                is_prioridade: false, quantidade: 3, tempo_estimado_corte_horas: 3, tempo_estimado_corte_minutos: 45,
                timestamp_entrada_emcorte: ago(2.2), created_at: ago(18), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['WEDM 4 Passadas Ra 0.4µm'],
                historico_pausas: [], tempos_fases: { setup: 0.6, emCorte: 0, afericao: 0 },
            },
            {
                id: id(809), empresa_id: EMPRESA_ID, codigo_peca: 'OP-3001', cliente: 'Schulz Compressores Indústria',
                setor: 'EDM_FIO', status: colKeyToStatus('concluido'), maquina_nome: 'Fanuc Robocut α-C400iB (WEDM)', operador_atual: 'Roberto Mendes',
                quantidade: 5, quantidade_concluida: 5, resultado_afericao: 'Aprovada',
                timestamp_entrada_concluido: ago(4), created_at: ago(96), is_pausado: false,
                total_setups: 1, setup_atual: 1, nomes_setups: ['WEDM Corte de Matriz'],
                historico_pausas: [], tempos_fases: { setup: 0.5, emCorte: 4.8, afericao: 0.3 },
            },
        ],
    };
}

export const LOCAL_EMPRESA_ID = EMPRESA_ID;
export const LOCAL_USER_ID = USER_ID;
