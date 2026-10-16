/**
 * Única fronteira entre os dados vindos de formulários/modais (camelCase ou snake_case)
 * e a linha da tabela `ordens_servico` (snake_case). Tudo que está no store é linha do banco.
 */

const ALIASES = {
    codigo_peca: ['codigoPeca'],
    link_desenho: ['linkDesenho'],
    is_prioridade: ['isPrioridade'],
    is_retrabalho: ['isRetrabalho'],
    is_pausado: ['isPausado'],
    prazo_entrega: ['prazoEntrega'],
    programador: ['programador_nome'],
    quantidade_concluida: ['quantidadeConcluida'],
    valor_orcado: ['valorOrcado'],
    os_grupo_id: ['osGrupoId'],
    roteiro_ordem: ['roteiroOrdem'],
    tempo_estimado_corte_horas: ['tempoEstimadoCorteHoras'],
    tempo_estimado_corte_minutos: ['tempoEstimadoCorteMinutos'],
    tempo_estimado_setup_horas: ['tempoEstimadoSetupHoras'],
    tempo_estimado_setup_minutos: ['tempoEstimadoSetupMinutos'],
    total_setups: ['totalSetups'],
    setup_atual: ['setupAtual'],
    nomes_setups: ['nomesSetups'],
    detalhes_setups: ['detalhesSetups'],
    codigo_molde: ['codigoMolde'],
    componente_molde: ['componenteMolde'],
    numero_programa: ['numeroPrograma'],
    link_programa: ['linkPrograma'],
    checklist_ferramentas: ['checklistFerramentas'],
    nx_import: ['nxImport'],
    estrategia_ferramental: ['estrategiaFerramental'],
    em_fila: ['emFila'],
    observacoes: ['observacao'],
    folha_imagem: ['folhaImagem'],
    maquina_nome: ['maquina'],
    operador_atual: ['operadorAtual'],
    resultado_afericao: ['resultadoAfericao'],
    motivo_refugo: ['motivoRefugo'],
    tempos_fases: ['temposFases'],
    historico_pausas: ['historicoPausas'],
    data_pausa: ['dataPausa'],
    motivo_pausa: ['motivoPausa'],
    observacao_pausa: ['observacaoPausa'],
    timestamp_entrada_setup: ['timestampEntrada_setup', 'timestampEntradaSetup'],
    timestamp_entrada_emcorte: ['timestampEntrada_emCorte', 'timestampEntradaCorte'],
    timestamp_entrada_afericao: ['timestampEntrada_afericao', 'timestampEntradaAfericao'],
    timestamp_entrada_concluido: ['timestampEntrada_concluido', 'timestampEntradaConcluido'],
};

const COLUNAS_SEM_ALIAS = [
    'cliente', 'setor', 'status', 'quantidade', 'posicao', 'parent_id', 'programado', 'roteiro',
    'fornecedor_id', 'fornecedor_nome', 'tipo_servico_externo', 'enviado_em', 'voltou_em',
    'aguardando_tt', 'observacao_tt',
];

const COLUNAS = [...Object.keys(ALIASES), ...COLUNAS_SEM_ALIAS];

/** Colunas que uma O.S. nova herda do formulário (ou da O.S. de origem, no split/retrabalho). */
const COLUNAS_CRIACAO = [
    'codigo_peca', 'cliente', 'link_desenho', 'is_prioridade', 'is_retrabalho', 'setor', 'status',
    'tempo_estimado_corte_horas', 'tempo_estimado_corte_minutos',
    'tempo_estimado_setup_horas', 'tempo_estimado_setup_minutos',
    'prazo_entrega', 'programador', 'quantidade', 'quantidade_concluida', 'posicao', 'parent_id',
    'programado', 'valor_orcado', 'os_grupo_id', 'roteiro_ordem', 'roteiro',
    'fornecedor_id', 'fornecedor_nome', 'tipo_servico_externo', 'enviado_em', 'voltou_em',
    'total_setups', 'setup_atual', 'nomes_setups', 'detalhes_setups', 'codigo_molde', 'componente_molde',
    'numero_programa', 'link_programa', 'checklist_ferramentas', 'nx_import', 'estrategia_ferramental',
    'aguardando_tt', 'observacao_tt', 'em_fila', 'observacoes', 'folha_imagem',
];

const inteiro = (padrao) => (v) => parseInt(v, 10) || padrao;
const textoOuNulo = (v) => (v === '' || v == null ? null : v);

const CONVERSOES = {
    tempo_estimado_corte_horas: inteiro(0),
    tempo_estimado_corte_minutos: inteiro(0),
    tempo_estimado_setup_horas: inteiro(0),
    tempo_estimado_setup_minutos: inteiro(0),
    quantidade: inteiro(1),
    quantidade_concluida: inteiro(0),
    total_setups: inteiro(1),
    setup_atual: inteiro(1),
    roteiro_ordem: inteiro(1),
    valor_orcado: (v) => (v === '' || v == null ? null : parseFloat(v)),
    prazo_entrega: (v) => (!v ? null : (String(v).includes('T') ? v : `${v}T12:00:00Z`)),
    link_desenho: textoOuNulo,
    link_programa: textoOuNulo,
    codigo_molde: textoOuNulo,
    componente_molde: textoOuNulo,
    numero_programa: textoOuNulo,
    observacoes: textoOuNulo,
};

function lerCampo(src, col) {
    if (src[col] !== undefined) return src[col];
    for (const alias of ALIASES[col] || []) {
        if (src[alias] !== undefined) return src[alias];
    }
    return undefined;
}

function extrair(src, colunas) {
    const out = {};
    for (const col of colunas) {
        const v = lerCampo(src || {}, col);
        if (v === undefined) continue;
        out[col] = CONVERSOES[col] ? CONVERSOES[col](v) : v;
    }
    return out;
}

/** Colunas de estado — só mudam via RPC (mover/pausar/excluir) no banco. */
export const CAMPOS_ESTADO_OS = [
    'status',
    'tempos_fases',
    'historico_pausas',
    'is_pausado',
    'data_pausa',
    'motivo_pausa',
    'observacao_pausa',
    'timestamp_entrada_setup',
    'timestamp_entrada_emcorte',
    'timestamp_entrada_afericao',
    'timestamp_entrada_concluido',
    'empresa_id',
];

/** Atualização parcial: só as colunas presentes em `fields`. */
export function osPatch(fields) {
    return extrair(fields, COLUNAS);
}

/** Remove campos de estado para updates diretos (cadastro/edição). */
export function osPatchEditavel(fields) {
    const patch = osPatch(fields);
    for (const col of CAMPOS_ESTADO_OS) delete patch[col];
    return patch;
}

/** Linha completa de uma O.S. nova (sem id/empresa_id). */
export function novaOsRow(osData) {
    return {
        status: 'A fazer',
        setor: 'CNC',
        is_prioridade: false,
        is_retrabalho: false,
        programado: false,
        aguardando_tt: false,
        em_fila: false,
        quantidade: 1,
        quantidade_concluida: 0,
        total_setups: 1,
        setup_atual: 1,
        roteiro_ordem: 1,
        tempo_estimado_corte_horas: 0,
        tempo_estimado_corte_minutos: 0,
        tempo_estimado_setup_horas: 0,
        tempo_estimado_setup_minutos: 0,
        roteiro: [],
        nomes_setups: [],
        detalhes_setups: [],
        checklist_ferramentas: [],
        ...extrair(osData, COLUNAS_CRIACAO),
    };
}
