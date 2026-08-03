import { colKeyToStatus } from '../constants/cncProcess';

const EMPRESA_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000099';

function id(n) {
    return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const now = new Date();
const ago = (hours) => new Date(now.getTime() - hours * 3600000).toISOString();
const future = (days) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];

export function createSeedDatabase() {
    const maquinas = [
        // Centro de Usinagem CNC
        { id: id(101), empresa_id: EMPRESA_ID, nome: 'DMG Mori DMU 50 (5 Eixos)', setor: 'CNC', status: 'Rodando', created_at: ago(720) },
        { id: id(102), empresa_id: EMPRESA_ID, nome: 'Romi D600 (3 Eixos)', setor: 'CNC', status: 'Rodando', created_at: ago(720) },
        { id: id(103), empresa_id: EMPRESA_ID, nome: 'Haas VF-2 (3 Eixos)', setor: 'CNC', status: 'Manutenção', created_at: ago(720) },
        // Eletroerosão a Fio (WEDM)
        { id: id(104), empresa_id: EMPRESA_ID, nome: 'Fanuc Robocut α-C400iB', setor: 'EDM_FIO', status: 'Rodando', created_at: ago(720) },
        { id: id(105), empresa_id: EMPRESA_ID, nome: 'Charmilles CUT 200 Sp', setor: 'EDM_FIO', status: 'Parada', created_at: ago(720) },
        { id: id(106), empresa_id: EMPRESA_ID, nome: 'Sodick ALN400G', setor: 'EDM_FIO', status: 'Rodando', created_at: ago(720) },
    ];

    return {
        empresa: {
            id: EMPRESA_ID,
            nome_fantasia: 'Ferramentaria Precision Tools Ltda (Demo)',
            codigo_convite: 'EDMTOOL1',
            plano: 'enterprise',
            created_at: ago(1),
        },
        configuracoes: {
            empresa_id: EMPRESA_ID,
            custo_hora_maquina: 85,
            custo_hora_cnc: 90,
            custo_hora_edm: 130,
            turnos: [
                { id: 't1', nome: '1º Turno', inicio: '07:30', fim: '15:30' },
                { id: 't2', nome: '2º Turno', inicio: '15:30', fim: '23:30' },
            ],
            pin_onboarding: '1234',
            limite_maquinas: 15,
            modo_magazine_default: 'individual',
            baixa_estoque_setup: true,
        },
        maquinas,
        operadores: [
            { id: id(201), empresa_id: EMPRESA_ID, nome: 'Carlos Mendes', setor: 'CNC', funcao: 'Operador Ferramenteiro CNC', created_at: ago(500) },
            { id: id(202), empresa_id: EMPRESA_ID, nome: 'Ana Paula Costa', setor: 'CNC', funcao: 'Operador Ferramenteiro CNC', created_at: ago(500) },
            { id: id(203), empresa_id: EMPRESA_ID, nome: 'Roberto Fonseca', setor: 'EDM_FIO', funcao: 'Operador Eletroerosão', created_at: ago(500) },
            { id: id(204), empresa_id: EMPRESA_ID, nome: 'Juliana Pereira', setor: 'EDM_FIO', funcao: 'Operador Eletroerosão', created_at: ago(500) },
            { id: id(205), empresa_id: EMPRESA_ID, nome: 'Fernando Ribeiro', setor: 'TODOS', funcao: 'Líder de Ferramentaria', created_at: ago(500) },
        ],
        programadores: [
            { id: id(301), empresa_id: EMPRESA_ID, nome: 'Marcos – CAM/UG NX (Usinagem)', setor: 'CNC', created_at: ago(500) },
            { id: id(302), empresa_id: EMPRESA_ID, nome: 'Felipe – WEDM (Eletroerosão Fio)', setor: 'EDM_FIO', created_at: ago(500) },
        ],
        clientes: [
            { id: id(401), empresa_id: EMPRESA_ID, nome: 'Marcopolo S.A. (Carrocerias)', email: 'suprimentos@marcopolo.com.br', telefone: '5432182000', created_at: ago(400) },
            { id: id(402), empresa_id: EMPRESA_ID, nome: 'Gerdau Açominas – Ferramentaria', email: 'ferramental@gerdau.com.br', telefone: '5133201000', created_at: ago(400) },
            { id: id(403), empresa_id: EMPRESA_ID, nome: 'Stihl do Brasil – Matriz e Moldes', email: 'moldes@stihl.com.br', telefone: '5135795000', created_at: ago(400) },
            { id: id(404), empresa_id: EMPRESA_ID, nome: 'Schulz Compressores – Estamparia', email: 'pcp.ferramental@schulz.com.br', telefone: '4734516000', created_at: ago(400) },
            { id: id(405), empresa_id: EMPRESA_ID, nome: 'Trombetta – Matrizes Progressivas', email: 'contato@trombetta.com.br', telefone: '5134709000', created_at: ago(400) },
        ],
        estoque_itens: [
            // Consumíveis EDM Fio
            { id: id(501), empresa_id: EMPRESA_ID, nome: 'Fio de Latão Ø0,25mm – Carretel 8kg (Bedra)', setor: 'EDM_FIO', quantidade: 14, alerta_minimo: 4, created_at: ago(200) },
            { id: id(502), empresa_id: EMPRESA_ID, nome: 'Resina Desionizadora Deionex 25L', setor: 'EDM_FIO', quantidade: 2, alerta_minimo: 3, created_at: ago(200) },
            { id: id(503), empresa_id: EMPRESA_ID, nome: 'Filtro de Água WEDM 3µm (Fanuc)', setor: 'EDM_FIO', quantidade: 8, alerta_minimo: 2, created_at: ago(200) },
            // Consumíveis CNC – Ferramentaria
            { id: id(504), empresa_id: EMPRESA_ID, nome: 'Fresa Metal Duro Ø10 4F – TiAlN (Sandvik)', setor: 'CNC', quantidade: 6, alerta_minimo: 3, created_at: ago(200) },
            { id: id(505), empresa_id: EMPRESA_ID, nome: 'Fresa Metal Duro Ø6 4F – TiSiN Acabamento', setor: 'CNC', quantidade: 4, alerta_minimo: 2, created_at: ago(200) },
            { id: id(506), empresa_id: EMPRESA_ID, nome: 'Insert APKT 1604 PDTR Metal Duro (Iscar)', setor: 'CNC', quantidade: 45, alerta_minimo: 10, created_at: ago(200) },
            { id: id(507), empresa_id: EMPRESA_ID, nome: 'Fluido Sintético de Usinagem Castrol 20L', setor: 'CNC', quantidade: 1, alerta_minimo: 2, created_at: ago(200) },
            { id: id(508), empresa_id: EMPRESA_ID, nome: 'Eletrodo de Cobre Eletrolítico Ø12mm', setor: 'EDM_FIO', quantidade: 18, alerta_minimo: 5, created_at: ago(200) },
        ],
        historico_quebras_estoque: [],
        ferramentas_maquina: [],
        ferramental: [
            // Ferramentas com vida útil rastreada
            { id: id(601), empresa_id: EMPRESA_ID, nome: 'Fresa MD Ø10 4F – Desbaste de Cavidade (Sandvik)', tipo: 'Fresa', codigo: 'FER-010-D', vida_util_horas: 50, alerta_horas: 8, horas_usadas: 44, status: 'alerta', maquina_id: id(101), observacao: 'Verificar desgaste no flanco – cavidade do molde Stihl', created_at: ago(100) },
            { id: id(602), empresa_id: EMPRESA_ID, nome: 'Fresa MD Ø6 4F – Acabamento Fino (Mitsubishi)', tipo: 'Fresa', codigo: 'FER-006-A', vida_util_horas: 30, alerta_horas: 5, horas_usadas: 11, status: 'disponivel', maquina_id: null, observacao: null, created_at: ago(100) },
            { id: id(603), empresa_id: EMPRESA_ID, nome: 'Fresa Topo Ø16 – Remoção de Volume H13', tipo: 'Fresa', codigo: 'FER-016-R', vida_util_horas: 20, alerta_horas: 3, horas_usadas: 20, status: 'quebrado', maquina_id: null, observacao: 'Quebrou no desbaste cavidade inferior (aço H13 58HRC)', created_at: ago(50) },
            { id: id(604), empresa_id: EMPRESA_ID, nome: 'Fio Latão Ø0,25 BrassWire (Bedra) – Carretel ativo', tipo: 'Frequência', codigo: 'FER-WEDM1', vida_util_horas: 80, alerta_horas: 10, horas_usadas: 65, status: 'em_uso', maquina_id: id(104), observacao: 'Tensão 12N – corte de matriz estampo progressivo', created_at: ago(80) },
            { id: id(605), empresa_id: EMPRESA_ID, nome: 'Cabeçote Desbaste Ø50 R0.8 – Face Mill (Seco)', tipo: 'Fresa', codigo: 'FER-050-F', vida_util_horas: 120, alerta_horas: 15, horas_usadas: 45, status: 'disponivel', maquina_id: null, observacao: null, created_at: ago(150) },
        ],
        historico_ferramental: [
            { id: id(701), empresa_id: EMPRESA_ID, ferramental_id: id(603), evento: 'quebra', maquina_nome: 'DMG Mori DMU 50 (5 Eixos)', operador_nome: 'Carlos Mendes', horas_no_evento: 20, observacao: 'Fresa estourou no desbaste – aço H13 endurecido. Substituída por lote reserva.', created_at: ago(12) },
        ],
        historico_consumiveis: [],
        kanbans_automaticos: [],
        perfis: [
            { id: USER_ID, empresa_id: EMPRESA_ID, nome: 'Gestão Demo', funcao: 'admin', created_at: ago(720) },
        ],
        ordens_servico: [
            // ─── CÉLULA CNC – Centro de Usinagem ───────────────────────────────────
            // A Fazer: Aguardando programação / material
            {
                id: id(801), empresa_id: EMPRESA_ID,
                codigo_peca: 'MLD-2045-CAV-A',
                cliente: 'Stihl do Brasil – Matriz e Moldes',
                setor: 'CNC', status: colKeyToStatus('aFazer'), is_prioridade: true, quantidade: 1, posicao: 1,
                prazo_entrega: future(5),
                tempo_estimado_setup_horas: 2, tempo_estimado_setup_minutos: 0,
                tempo_estimado_corte_horas: 14, tempo_estimado_corte_minutos: 30,
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                codigo_molde: 'MLD-STIHL-0220', componente_molde: 'Cavidade Sup. – Carcaça Motor',
                numero_programa: 'O2045A',
                total_setups: 3, setup_atual: 1,
                nomes_setups: ['OP10 – Desbaste Cavidade (H13)', 'OP20 – Semi-acabamento 5 Eixos', 'OP30 – Acabamento + Flancos'],
                nx_import: {
                    arquivo: 'MLD-2045-CAM-ProcessSheet.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Fresa Metal Duro Ø10 4F – Desbaste H13 (Sandvik)' },
                        { codigoT: 'T02', nome: 'Fresa Toroidal Ø8 R1 – Semi-acabamento (Iscar)' },
                        { codigoT: 'T03', nome: 'Fresa Esférica Ø6 R3 – Acabamento 3D (Mitsubishi)' },
                        { codigoT: 'T04', nome: 'Fresa Esférica Ø3 R1.5 – Detalhamento Raios' },
                    ],
                    operacoes: ['OP10 Desbaste Cavidade H13', 'OP20 Semi-acabamento 5 Eixos', 'OP30 Acabamento 3D']
                },
                created_at: ago(48), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(802), empresa_id: EMPRESA_ID,
                codigo_peca: 'EXT-P80-003',
                cliente: 'Marcopolo S.A. (Carrocerias)',
                setor: 'CNC', status: colKeyToStatus('aFazer'), is_prioridade: false, quantidade: 4, posicao: 2,
                prazo_entrega: future(8),
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 0,
                tempo_estimado_corte_horas: 3, tempo_estimado_corte_minutos: 0,
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                codigo_molde: 'MLG-MARCO-018', componente_molde: 'Extrator Ø80mm – Pino de Extração',
                numero_programa: 'O0803',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['OP10 – Torneamento + Furo Extrator'],
                nx_import: {
                    arquivo: 'EXT-P80-ProcessSheet.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Insert WNMG 080408 – Torneamento Desbaste' },
                        { codigoT: 'T02', nome: 'Broca Metal Duro Ø12 (Dormer HSS Co5)' },
                        { codigoT: 'T03', nome: 'Insert VNMG 160404 – Acabamento Fino' },
                    ],
                    operacoes: ['OP10 Torneamento Corpo', 'OP20 Furação Extrator']
                },
                created_at: ago(36), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            // Setup: Preparando máquina / magazine
            {
                id: id(803), empresa_id: EMPRESA_ID,
                codigo_peca: 'MLD-1892-POS-B',
                cliente: 'Schulz Compressores – Estamparia',
                setor: 'CNC', status: colKeyToStatus('setup'), maquina_nome: 'DMG Mori DMU 50 (5 Eixos)', operador_atual: 'Carlos Mendes',
                is_prioridade: false, quantidade: 1,
                prazo_entrega: future(3),
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 30,
                tempo_estimado_corte_horas: 7, tempo_estimado_corte_minutos: 0,
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                timestamp_entrada_setup: ago(1.5),
                codigo_molde: 'STMP-SCH-007', componente_molde: 'Postiço de Embutimento – Aço P20',
                numero_programa: 'O1892B',
                total_setups: 2, setup_atual: 1,
                nomes_setups: ['OP10 – Desbaste + Semi-acabamento P20', 'OP20 – Acabamento Geom. + Raios'],
                nx_import: {
                    arquivo: 'MLD-1892-ProcessSheet.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Cabeçote Desbaste Ø50 R0.8 – Face Mill (Seco)' },
                        { codigoT: 'T02', nome: 'Fresa Metal Duro Ø12 4F (Garrach)' },
                        { codigoT: 'T03', nome: 'Fresa Esférica Ø6 R3 – Acabamento Raios' },
                    ],
                    operacoes: ['OP10 Desbaste P20', 'OP20 Acabamento Geométrico']
                },
                created_at: ago(24), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            // Em Usinagem: Máquina rodando
            {
                id: id(804), empresa_id: EMPRESA_ID,
                codigo_peca: 'ELT-CU-EDM-042',
                cliente: 'Gerdau Açominas – Ferramentaria',
                setor: 'CNC', status: colKeyToStatus('emCorte'), maquina_nome: 'Romi D600 (3 Eixos)', operador_atual: 'Ana Paula Costa',
                is_prioridade: true, quantidade: 3,
                prazo_entrega: future(2),
                tempo_estimado_corte_horas: 2, tempo_estimado_corte_minutos: 45,
                timestamp_entrada_emcorte: ago(1.2),
                codigo_molde: 'ELT-GER-042', componente_molde: 'Eletrodo de Grafite – Nervura Molde Fundição',
                numero_programa: 'O0042E',
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['OP10 – Usinagem Perfil Eletrodo Grafite'],
                nx_import: {
                    arquivo: 'ELT-CU-EDM-042-CAM.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Fresa Topo Ø6 Grafite (Diamond Coating)' },
                        { codigoT: 'T02', nome: 'Fresa Toroidal Ø4 R0.5 – Nervura' },
                        { codigoT: 'T03', nome: 'Fresa Esférica Ø2 R1 – Detalhamento' },
                    ],
                    operacoes: ['OP10 Usinagem Grafite', 'OP20 Acabamento Nervura']
                },
                created_at: ago(18), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0.8, emCorte: 0, afericao: 0 },
            },
            // Inspeção: Aferição dimensional
            {
                id: id(805), empresa_id: EMPRESA_ID,
                codigo_peca: 'PNC-TROM-018',
                cliente: 'Trombetta – Matrizes Progressivas',
                setor: 'CNC', status: colKeyToStatus('afericao'), maquina_nome: 'Romi D600 (3 Eixos)', operador_atual: 'Ana Paula Costa',
                quantidade: 2,
                prazo_entrega: future(1),
                timestamp_entrada_afericao: ago(0.5),
                codigo_molde: 'MAT-TROM-PRG-018', componente_molde: 'Punção de Corte – Passo 6 da Progressiva',
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                total_setups: 2, setup_atual: 2,
                nomes_setups: ['OP10 – Desbaste Corpo Punção', 'OP20 – Acabamento + Perfil Corte'],
                nx_import: {
                    arquivo: 'PNC-TROM-018-ProcessSheet.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Fresa Desbaste Ø16 – Remoção Volume' },
                        { codigoT: 'T02', nome: 'Fresa Metal Duro Ø10 4F (TiSiN)' },
                        { codigoT: 'T03', nome: 'Broca Ø6.8 – Furo Rebaixo' },
                    ],
                    operacoes: ['OP10 Desbaste Punção', 'OP20 Acabamento Perfil']
                },
                created_at: ago(14), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0.5, emCorte: 5.2, afericao: 0 },
            },
            // Concluído: Aprovado e entregue
            {
                id: id(806), empresa_id: EMPRESA_ID,
                codigo_peca: 'MLD-0981-BLD-C',
                cliente: 'Marcopolo S.A. (Carrocerias)',
                setor: 'CNC', status: colKeyToStatus('concluido'), maquina_nome: 'DMG Mori DMU 50 (5 Eixos)', operador_atual: 'Carlos Mendes',
                quantidade: 1, quantidade_concluida: 1, resultado_afericao: 'Aprovada',
                timestamp_entrada_concluido: ago(3),
                codigo_molde: 'MLG-MARCO-009', componente_molde: 'Bloco Inferior Cavidade – Aço H13 cementado',
                programador: 'Marcos – CAM/UG NX (Usinagem)',
                total_setups: 3, setup_atual: 3,
                nomes_setups: ['OP10 – Desbaste', 'OP20 – Semi-acabamento', 'OP30 – Acabamento 5-Eixos'],
                nx_import: {
                    arquivo: 'MLD-0981-BLD-ProcessSheet.html',
                    ferramentas: [
                        { codigoT: 'T01', nome: 'Cabeçote Desbaste Ø50 R0.8' },
                        { codigoT: 'T02', nome: 'Fresa Metal Duro Ø10 4F' },
                        { codigoT: 'T03', nome: 'Fresa Esférica Ø8 R4' },
                        { codigoT: 'T04', nome: 'Macho M10x1.5 HSS' },
                    ],
                    operacoes: ['OP10 Desbaste', 'OP20 Semi-acabamento', 'OP30 Acabamento 5E']
                },
                created_at: ago(72), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 1.2, emCorte: 18.6, afericao: 0.5 },
            },

            // ─── CÉLULA EDM FIO – Eletroerosão a Fio (WEDM) ───────────────────────
            // A Fazer
            {
                id: id(807), empresa_id: EMPRESA_ID,
                codigo_peca: 'MTZ-TROM-PF-009',
                cliente: 'Trombetta – Matrizes Progressivas',
                setor: 'EDM_FIO', status: colKeyToStatus('aFazer'), is_prioridade: true, quantidade: 1, posicao: 1,
                prazo_entrega: future(4),
                tempo_estimado_setup_horas: 0, tempo_estimado_setup_minutos: 45,
                tempo_estimado_corte_horas: 8, tempo_estimado_corte_minutos: 20,
                programador: 'Felipe – WEDM (Eletroerosão Fio)',
                codigo_molde: 'MAT-TROM-PRG-009', componente_molde: 'Placa de Corte – Matriz Progressiva (D2, 62HRC)',
                numero_programa: 'W0091',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['WEDM – Perfil Corte Completo 4 Passadas (Ra 0,4µm)'],
                nx_import: {
                    arquivo: 'MTZ-TROM-WEDM.html',
                    ferramentas: [
                        { codigoT: 'W01', nome: 'Fio Latão Ø0.25mm (Bedra)' },
                        { codigoT: 'W02', nome: 'Resina Desionizadora Deionex' },
                        { codigoT: 'W03', nome: 'Filtro Água 3µm (Fanuc)' },
                    ],
                    operacoes: ['WEDM 4 Passadas Ra 0.4µm']
                },
                created_at: ago(30), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            {
                id: id(808), empresa_id: EMPRESA_ID,
                codigo_peca: 'PNC-GER-EDM-07',
                cliente: 'Gerdau Açominas – Ferramentaria',
                setor: 'EDM_FIO', status: colKeyToStatus('aFazer'), is_prioridade: false, quantidade: 6, posicao: 2,
                prazo_entrega: future(7),
                tempo_estimado_setup_horas: 0, tempo_estimado_setup_minutos: 30,
                tempo_estimado_corte_horas: 3, tempo_estimado_corte_minutos: 0,
                programador: 'Felipe – WEDM (Eletroerosão Fio)',
                codigo_molde: 'ELT-GER-042', componente_molde: 'Inserto Guia (6x) – Coluna e Bucha Ø25',
                numero_programa: 'W0073',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['WEDM – Furo + Perfil Guia (M2)'],
                nx_import: {
                    arquivo: 'PNC-GER-EDM-07-WEDM.html',
                    ferramentas: [
                        { codigoT: 'W01', nome: 'Fio Latão Ø0.25mm (Bedra)' },
                        { codigoT: 'W02', nome: 'Filtro Água 3µm (Fanuc)' },
                    ],
                    operacoes: ['WEDM Furo + Perfil M2']
                },
                created_at: ago(20), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            // Setup WEDM
            {
                id: id(809), empresa_id: EMPRESA_ID,
                codigo_peca: 'MTZ-SCH-PF-003',
                cliente: 'Schulz Compressores – Estamparia',
                setor: 'EDM_FIO', status: colKeyToStatus('setup'), maquina_nome: 'Fanuc Robocut α-C400iB', operador_atual: 'Roberto Fonseca',
                is_prioridade: false, quantidade: 2,
                prazo_entrega: future(3),
                tempo_estimado_setup_horas: 1, tempo_estimado_setup_minutos: 0,
                tempo_estimado_corte_horas: 5, tempo_estimado_corte_minutos: 30,
                programador: 'Felipe – WEDM (Eletroerosão Fio)',
                timestamp_entrada_setup: ago(0.8),
                codigo_molde: 'STMP-SCH-003', componente_molde: 'Macho de Dobramento Ø80 – Aço D6',
                numero_programa: 'W0032',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['WEDM – Desbaste + 2 Acabamentos (ângulo cônico 3°)'],
                nx_import: {
                    arquivo: 'MTZ-SCH-PF-003-WEDM.html',
                    ferramentas: [
                        { codigoT: 'W01', nome: 'Fio Latão Ø0.25mm (Bedra)' },
                        { codigoT: 'W02', nome: 'Resina Desionizadora Deionex' },
                    ],
                    operacoes: ['WEDM Desbaste + 2 Acabamentos']
                },
                created_at: ago(16), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
            },
            // Em Corte WEDM
            {
                id: id(810), empresa_id: EMPRESA_ID,
                codigo_peca: 'MLD-STHL-ELT-14',
                cliente: 'Stihl do Brasil – Matriz e Moldes',
                setor: 'EDM_FIO', status: colKeyToStatus('emCorte'), maquina_nome: 'Sodick ALN400G', operador_atual: 'Juliana Pereira',
                is_prioridade: false, quantidade: 4,
                prazo_entrega: future(2),
                tempo_estimado_corte_horas: 4, tempo_estimado_corte_minutos: 30,
                timestamp_entrada_emcorte: ago(2.5),
                codigo_molde: 'MLD-STIHL-0220', componente_molde: 'Eletrodo Usinagem EDM (4x) – Nervura Interna',
                numero_programa: 'W0142',
                programador: 'Felipe – WEDM (Eletroerosão Fio)',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['WEDM – Perfil Eletrodo (Ra 0,8µm)'],
                nx_import: {
                    arquivo: 'MLD-STHL-ELT-14-WEDM.html',
                    ferramentas: [
                        { codigoT: 'W01', nome: 'Fio Latão Ø0.25mm (Bedra)' },
                        { codigoT: 'W02', nome: 'Eletrodo Cobre Ø12mm' },
                    ],
                    operacoes: ['WEDM Perfil Eletrodo']
                },
                created_at: ago(12), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0.5, emCorte: 0, afericao: 0 },
            },
            // Concluído WEDM
            {
                id: id(811), empresa_id: EMPRESA_ID,
                codigo_peca: 'MTZ-MARCO-PF-12',
                cliente: 'Marcopolo S.A. (Carrocerias)',
                setor: 'EDM_FIO', status: colKeyToStatus('concluido'), maquina_nome: 'Fanuc Robocut α-C400iB', operador_atual: 'Roberto Fonseca',
                quantidade: 2, quantidade_concluida: 2, resultado_afericao: 'Aprovada',
                timestamp_entrada_concluido: ago(5),
                codigo_molde: 'MLG-MARCO-019', componente_molde: 'Placa Fêmea + Macho – Extrusão Al (2x)',
                programador: 'Felipe – WEDM (Eletroerosão Fio)',
                total_setups: 1, setup_atual: 1,
                nomes_setups: ['WEDM – 4 Passadas (Ra 0,4µm) – Perfil Extrusão'],
                nx_import: {
                    arquivo: 'MTZ-MARCO-PF-12-WEDM.html',
                    ferramentas: [
                        { codigoT: 'W01', nome: 'Fio Latão Ø0.25mm (Bedra)' },
                        { codigoT: 'W02', nome: 'Resina Desionizadora Deionex' },
                        { codigoT: 'W03', nome: 'Filtro Água 3µm (Fanuc)' },
                    ],
                    operacoes: ['WEDM 4 Passadas Perfil Extrusão']
                },
                created_at: ago(96), is_pausado: false,
                historico_pausas: [], tempos_fases: { setup: 0.7, emCorte: 9.2, afericao: 0.4 },
            },
        ],
    };
}

export const LOCAL_EMPRESA_ID = EMPRESA_ID;
export const LOCAL_USER_ID = USER_ID;
