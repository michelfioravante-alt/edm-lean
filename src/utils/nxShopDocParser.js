/**
 * Parser de folhas de processo CAM (NX Shop Documentation, Mastercam, PowerMill, WorkNC).
 *
 * Estratégia: localizar a linha de cabeçalho e ler as colunas pelo nome.
 * Um número solto só é interpretado como tempo quando a coluna foi identificada
 * como tempo — caso contrário RPM, avanço e diâmetro entram como duração.
 *
 * Quando não há cabeçalho reconhecível o parser não adivinha: devolve avisos e
 * o usuário mapeia as colunas na mão pelo ImportNxSheet.
 */

// Colunas numéricas que nunca são tempo. Testadas antes de qualquer outro papel.
const COLUNA_IGNORADA = /rpm|spindle|rota[çc]|feed|avan[çc]o|di[âa]metro|diameter|\bdia\b|raio|radius|profund|depth|stepover|stepdown|coolant|refriger|holder|material|\bz\s*(min|max)\b/i;

// A ordem importa: 'setup_time' precisa vir antes de 'op_time', que casa com "time" solto.
const PADROES_CABECALHO = [
    { papel: 'setup_time', re: /(setup|prepara[çc][ãa]o|fixa[çc][ãa]o).*(tempo|time|dura)|(tempo|time).*(setup|prepara)/i },
    { papel: 'op_time', re: /cycle\s*time|machin\w*\s*time|cut\w*\s*time|tempo|time|dura[çc][ãa]o|duration/i },
    { papel: 'tool_number', re: /^\s*t\s*n[uú]m\w*\.?\s*$|tool\s*(no|n[uú]m\w*|number)\b|n[ºo°]\s*(da\s*)?ferr/i },
    { papel: 'tool_code', re: /^\s*(tool|ferramenta|ferr\.?|t)\s*$|tool\s*(id|code)|c[óo]digo\s*(da\s*)?ferramenta/i },
    { papel: 'tool_name', re: /tool\s*(desc\w*|name)|descri[çc][ãa]o|nome\s*(da\s*)?ferramenta|cutter/i },
    { papel: 'op_name', re: /opera[çc][ãa]o|operation|^\s*op\.?\s*$|percurso|toolpath|^\s*prog\.?\s*$/i },
    { papel: 'part_code', re: /part\s*(name|no|n[uú]m\w*|number)|pe[çc]a|component/i },
];

/**
 * Rótulos de pares chave/valor. `prioridades` é testado em ordem: só se nenhum
 * rótulo preciso aparecer é que se aceita um genérico. Sem isso "Tipo da peça"
 * vence "Nome da peça" só por vir antes na folha.
 */
const META_CAMPOS = [
    {
        chave: 'codigoPeca',
        prioridades: [
            /^\s*(nome\s+d[ao]\s+(pe[çc]a|componente)|part\s*name)\s*:?\s*$/i,
            /^\s*(pe[çc]a|part|component)\s*(n[ºo°]|no|number|id)?\s*:?\s*$/i,
            // Último recurso: folhas que só identificam a peça pelo desenho/arquivo.
            /^\s*(desenho|drawing|arquivo|nome\s*do\s*arquivo|file\s*name)\s*:?\s*$/i,
        ],
        excluir: /tipo|material|diret[óo]rio|modelo|unidade/i,
        // Caminho de arquivo não é código de peça.
        rejeitarValor: /[\\/]|\.(sldprt|prt|stp|step|ig[se]s?|dxf|dwg|nc|pim|tap)\s*$/i,
    },
    { chave: 'cliente', prioridades: [/^\s*(cliente|customer|client)\s*:?\s*$/i] },
    { chave: 'programador', prioridades: [/^\s*(programador|programmer|programado\s*por|elaborado\s*por)\s*:?\s*$/i] },
    { chave: 'maquina', prioridades: [/^\s*(m[áa]quina|machine|equipamento)\s*:?\s*$/i] },
    {
        chave: 'numeroPrograma',
        prioridades: [
            /n[uú]mero\s+d[oa]\s+programa|program\s*(number|no|name)|^\s*program(a|me)?\s*:?\s*$|g-?code|nc\s*file/i,
        ],
        excluir: /sub-?rotina|subroutine/i,
    },
    {
        chave: 'tempoTotalMinutos',
        tempo: true,
        prioridades: [/tempo\s*(total|de\s*ciclo\s*total)|total\s*(time|cycle)|cycle\s*time\s*total/i],
    },
    {
        chave: 'setupMinutos',
        tempo: true,
        prioridades: [/setup|prepara[çc][ãa]o|fixa[çc][ãa]o/i],
    },
];

// Duração explícita em formato de relógio: âncora confiável em folhas sem cabeçalho.
const RELOGIO_ESTRITO = /^\d{1,3}:[0-5]\d:[0-5]\d$/;

// Ferramenta numerada, ex.: "1-Cabecote-Spindle", "3 - Fresa".
const FERRAMENTA_NUMERADA = /^(\d{1,3})\s*[-–—]\s*(.+)$/;

// Textos que nunca são nome de operação ou de ferramenta.
const RUIDO_NOME = /refrigera|coolant|l[íi]quido|torre|^mac\b|posi[çc][ãa]o|^tempo|^total/i;

// Acima disso é quase certo erro de leitura (ex.: RPM lido como minutos).
const LIMITE_OPERACAO_MINUTOS = 24 * 60;

const TOOL_PATTERN = /\bT\s*\d{1,3}\b/i;

function textoCelula(celula) {
    return String(celula?.textContent ?? celula ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Converte uma duração em minutos. Devolve null quando não reconhece o formato.
 * `unidadeImplicita` habilita números sem unidade ('minutos' ou 'horas') e só
 * deve ser usado em colunas confirmadas como tempo.
 */
function parseDuracao(bruto, unidadeImplicita = null) {
    const s = String(bruto ?? '').trim();
    if (!s) return null;

    const relogio = s.match(/^(\d{1,4}):([0-5]?\d)(?::([0-5]?\d))?$/);
    if (relogio) {
        return Number(relogio[1]) * 60 + Number(relogio[2]) + Number(relogio[3] || 0) / 60;
    }

    const horasEMinutos = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:h|hr?s?|horas?|hours?)\.?\s*(?:(\d+(?:[.,]\d+)?)\s*(?:m|min|minutos?|minutes?)?\.?)?$/i);
    if (horasEMinutos) {
        const h = parseFloat(horasEMinutos[1].replace(',', '.'));
        const m = horasEMinutos[2] ? parseFloat(horasEMinutos[2].replace(',', '.')) : 0;
        return h * 60 + m;
    }

    const minutos = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:m|min|minutos?|minutes?)\.?$/i);
    if (minutos) return parseFloat(minutos[1].replace(',', '.'));

    const segundos = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:s|seg\w*|sec\w*)\.?$/i);
    if (segundos) return parseFloat(segundos[1].replace(',', '.')) / 60;

    if (unidadeImplicita) {
        // "14.26 / 842.76" — folhas UG/CAM trazem tempo da operação e acumulado na
        // mesma célula. O primeiro número é o da operação.
        const par = s.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*\d+(?:[.,]\d+)?$/);
        const simples = s.match(/^(\d+(?:[.,]\d+)?)$/);
        const achado = par || simples;
        if (achado) {
            const n = parseFloat(achado[1].replace(',', '.'));
            if (!Number.isFinite(n)) return null;
            return unidadeImplicita === 'horas' ? n * 60 : n;
        }
    }

    return null;
}

function unidadeDoCabecalho(texto) {
    if (/\(\s*h\s*\)|hora|hour/i.test(texto)) return 'horas';
    return 'minutos';
}

function papelDoCabecalho(texto) {
    if (!texto || COLUNA_IGNORADA.test(texto)) return null;
    return PADROES_CABECALHO.find(({ re }) => re.test(texto))?.papel || null;
}

/**
 * Procura nas primeiras linhas aquela que parece o cabeçalho da tabela de operações.
 * Exige ao menos dois papéis distintos para não confundir com tabelas de metadados.
 */
function detectarCabecalho(linhas) {
    let melhor = null;

    linhas.slice(0, 15).forEach((linha, indice) => {
        const mapa = {};
        const papeis = new Set();

        linha.forEach((celula, coluna) => {
            const texto = textoCelula(celula);
            const papel = papelDoCabecalho(texto);
            if (!papel || papeis.has(papel)) return;
            papeis.add(papel);
            mapa[coluna] = { papel, unidade: unidadeDoCabecalho(texto) };
        });

        if (papeis.size >= 2 && (!melhor || papeis.size > melhor.pontuacao)) {
            melhor = { indice, mapa, pontuacao: papeis.size };
        }
    });

    return melhor;
}

/**
 * Junta os pares rótulo/valor da folha, em dois arranjos:
 * vertical ("Nome da peça | CAV-8842") e horizontal (uma linha de rótulos sobre
 * uma linha de valores, como no bloco de identificação das folhas UG/CAM).
 */
function paresRotuloValor(tabelas) {
    const pares = [];

    tabelas.forEach((linhas) => {
        linhas.forEach((linha) => {
            const textos = linha.map(textoCelula).filter(Boolean);
            if (textos.length === 2) pares.push(textos);
        });

        if (linhas.length !== 2) return;
        const [rotulos, valores] = linhas.map((linha) => linha.map(textoCelula));
        if (rotulos.length < 3 || rotulos.length !== valores.length) return;
        rotulos.forEach((rotulo, coluna) => {
            if (rotulo && valores[coluna]) pares.push([rotulo, valores[coluna]]);
        });
    });

    return pares;
}

function extrairMetadados(tabelas) {
    const pares = paresRotuloValor(tabelas);
    const meta = {};

    META_CAMPOS.forEach(({ chave, prioridades, excluir, tempo, rejeitarValor }) => {
        for (const re of prioridades) {
            const achado = pares.find(([rotulo, valor]) => {
                if (!re.test(rotulo) || (excluir && excluir.test(rotulo)) || !valor) return false;
                if (rejeitarValor && rejeitarValor.test(valor)) return false;
                return !tempo || parseDuracao(valor, 'minutos') !== null;
            });
            if (!achado) continue;
            meta[chave] = tempo ? parseDuracao(achado[1], 'minutos') : achado[1];
            return;
        }
    });

    return meta;
}

function limparNome(texto) {
    return texto.replace(/\s*<\s*>\s*$/, '').trim();
}

/** Escolhe o texto mais descritivo de um conjunto de células. */
function melhorNome(candidatos) {
    return (
        candidatos
            .map(limparNome)
            .filter((t) => t.length >= 4 && !/^[\d.,:\-\s]+$/.test(t) && !RUIDO_NOME.test(t))
            .sort((a, b) => b.length - a.length)[0] || ''
    );
}

// Célula de dimensões da ferramenta, ex.: "TD: 3 mmA: 118SA: 60".
const CELULA_DIMENSOES = /[A-Za-zÀ-ú.]{1,5}\s*:\s*\S|n[úu]m\.?\s*de\s*facas/i;

/**
 * Nome da ferramenta. Descarta as células que repetem o bloco numerado e as de
 * dimensões — em folhas com tabelas aninhadas elas são as maiores da linha.
 */
function melhorNomeFerramenta(candidatos) {
    return (
        candidatos
            .map(limparNome)
            .filter(
                (t) =>
                    t.length >= 3 &&
                    !FERRAMENTA_NUMERADA.test(t) &&
                    !CELULA_DIMENSOES.test(t) &&
                    !RUIDO_NOME.test(t)
            )
            .sort((a, b) => b.length - a.length)[0] || ''
    );
}

/**
 * Leitura para folhas onde cada operação ocupa várias linhas (SolidCAM/Altova e
 * similares). Usa durações h:mm:ss como âncora e busca o nome nas linhas vizinhas.
 */
function extrairPorBlocos(linhas) {
    const ferramentas = new Map();
    const operacoes = [];
    const vistas = new Set();
    let totalMinutos = 0;

    linhas.forEach((linha, i) => {
        const textos = linha.map(textoCelula);

        textos.forEach((texto) => {
            const achado = texto.match(FERRAMENTA_NUMERADA);
            if (!achado) return;
            const codigoT = `T${achado[1].padStart(2, '0')}`;
            if (ferramentas.has(codigoT)) return;
            const nome = melhorNomeFerramenta(textos.filter((t) => t !== texto)) || limparNome(achado[2]);
            ferramentas.set(codigoT, { codigoT, nome });
        });

        const indiceTempo = textos.findIndex((t) => RELOGIO_ESTRITO.test(t));
        if (indiceTempo === -1) return;
        if (textos.some((t) => /tempo\s*total|total\s*time/i.test(t))) return;

        const minutos = parseDuracao(textos[indiceTempo]);
        if (minutos === null || minutos <= 0 || minutos > LIMITE_OPERACAO_MINUTOS) return;

        const anterior = (linhas[i - 1] || []).map(textoCelula);
        const nome = melhorNome([...textos.filter((_, j) => j !== indiceTempo), ...anterior]);

        const chave = `${nome}|${textos[indiceTempo]}`;
        if (vistas.has(chave)) return;
        vistas.add(chave);

        operacoes.push({ nome: nome || `Operação ${operacoes.length + 1}`, tempoMinutos: Math.round(minutos) });
        totalMinutos += minutos;
    });

    return {
        codigoPeca: '',
        tempoUsinagemMinutos: Math.round(totalMinutos),
        tempoSetupMinutos: 0,
        ferramentas: [...ferramentas.values()],
        operacoes,
        avisos: [],
    };
}

function normalizarCodigoT(texto) {
    const achado = texto.match(TOOL_PATTERN);
    if (achado) return achado[0].replace(/\s+/g, '').toUpperCase();

    // Coluna dedicada ao número da ferramenta: "1" vira "T01".
    const soNumero = texto.trim().match(/^(\d{1,3})$/);
    return soNumero ? `T${soNumero[1].padStart(2, '0')}` : '';
}

function extrairComCabecalho(linhas, cabecalho) {
    const ferramentas = new Map();
    const operacoes = [];
    const avisos = [];
    let totalMinutos = 0;
    let setupMinutos = 0;
    let codigoPeca = '';
    let ignoradasPorLimite = 0;

    for (let i = cabecalho.indice + 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.some((c) => textoCelula(c))) continue;

        let numeroFerramenta = '';
        let codigoFerramenta = '';
        let nomeFerramenta = '';
        let nomeOperacao = '';
        let minutosOperacao = null;

        Object.entries(cabecalho.mapa).forEach(([coluna, { papel, unidade }]) => {
            const texto = textoCelula(linha[coluna]);
            if (!texto) return;

            if (papel === 'tool_number') numeroFerramenta = texto;
            else if (papel === 'tool_code') codigoFerramenta = texto;
            else if (papel === 'tool_name') nomeFerramenta = texto;
            else if (papel === 'op_name') nomeOperacao = texto;
            else if (papel === 'part_code' && !codigoPeca) codigoPeca = texto;
            else if (papel === 'op_time') minutosOperacao = parseDuracao(texto, unidade);
            else if (papel === 'setup_time') {
                const m = parseDuracao(texto, unidade);
                if (m !== null) setupMinutos += m;
            }
        });

        if (minutosOperacao !== null && minutosOperacao > LIMITE_OPERACAO_MINUTOS) {
            ignoradasPorLimite++;
            minutosOperacao = null;
        }

        // Quando existe coluna própria de número, a coluna "Ferramenta" traz o nome.
        const bruto = numeroFerramenta || codigoFerramenta;
        const codigoT = bruto ? normalizarCodigoT(bruto) || bruto : '';
        if (numeroFerramenta && codigoFerramenta && !nomeFerramenta) nomeFerramenta = codigoFerramenta;

        if (codigoT || nomeFerramenta) {
            const chave = codigoT || nomeFerramenta;
            const existente = ferramentas.get(chave);
            if (existente) {
                if (!existente.nome && nomeFerramenta) existente.nome = nomeFerramenta;
            } else {
                ferramentas.set(chave, { codigoT: codigoT || chave, nome: nomeFerramenta });
            }
        }

        if (minutosOperacao !== null && minutosOperacao > 0) {
            operacoes.push({
                nome: nomeOperacao || `Operação ${operacoes.length + 1}`,
                tempoMinutos: Math.round(minutosOperacao),
            });
            totalMinutos += minutosOperacao;
        }
    }

    if (ignoradasPorLimite > 0) {
        avisos.push(`${ignoradasPorLimite} tempo(s) acima de 24h foram descartados — confira a coluna de tempo no mapeador.`);
    }

    return {
        codigoPeca,
        tempoUsinagemMinutos: Math.round(totalMinutos),
        tempoSetupMinutos: Math.round(setupMinutos),
        ferramentas: [...ferramentas.values()],
        operacoes,
        avisos,
    };
}

function resultadoVazio(avisos = []) {
    return {
        codigoPeca: '',
        numeroPrograma: '',
        cliente: '',
        programador: '',
        maquina: '',
        tempoUsinagemMinutos: 0,
        tempoSetupMinutos: 0,
        ferramentas: [],
        operacoes: [],
        avisos,
        confianca: 0,
    };
}

/**
 * @param {string[][][]} tabelas Cada tabela é uma lista de linhas de células.
 */
function analisarTabelas(tabelas) {
    const comConteudo = tabelas.filter((linhas) => linhas.length > 0);
    if (comConteudo.length === 0) return { ...resultadoVazio(['Nenhuma tabela encontrada no arquivo.']), rawRows: [] };

    const todasLinhas = comConteudo.flat();
    const meta = extrairMetadados(comConteudo);

    let escolhida = null;
    comConteudo.forEach((linhas) => {
        const cabecalho = detectarCabecalho(linhas);
        if (cabecalho && (!escolhida || cabecalho.pontuacao > escolhida.cabecalho.pontuacao)) {
            escolhida = { linhas, cabecalho };
        }
    });

    const extraido = escolhida
        ? extrairComCabecalho(escolhida.linhas, escolhida.cabecalho)
        : extrairPorBlocos(todasLinhas);

    const avisos = [...extraido.avisos];
    const rawRows = escolhida ? escolhida.linhas : comConteudo.reduce((a, b) => (b.length > a.length ? b : a));

    const codigoPeca = meta.codigoPeca || extraido.codigoPeca || '';
    const tempoSetupMinutos = extraido.tempoSetupMinutos || Math.round(meta.setupMinutos || 0);

    // O total declarado na folha é mais confiável que a soma das operações lidas.
    const tempoUsinagemMinutos =
        meta.tempoTotalMinutos != null ? Math.round(meta.tempoTotalMinutos) : extraido.tempoUsinagemMinutos;

    if (!codigoPeca) avisos.push('Código da peça não identificado — preencha manualmente.');
    if (tempoUsinagemMinutos === 0) avisos.push('Tempos de usinagem não identificados — preencha manualmente.');
    if (extraido.ferramentas.length === 0) avisos.push('Ferramentas não identificadas na folha.');
    if (tempoSetupMinutos === 0) avisos.push('Tempo de setup não identificado na folha.');
    if (!escolhida && extraido.operacoes.length === 0) {
        avisos.push('Cabeçalho não reconhecido — use "Mapear Colunas" para indicar onde estão ferramenta e tempo.');
    }

    const confianca =
        (codigoPeca ? 1 : 0) +
        (tempoUsinagemMinutos > 0 ? 2 : 0) +
        (extraido.ferramentas.length > 0 ? 1 : 0) +
        (tempoSetupMinutos > 0 ? 1 : 0);

    return {
        ...extraido,
        codigoPeca,
        tempoUsinagemMinutos,
        tempoSetupMinutos,
        numeroPrograma: meta.numeroPrograma || '',
        cliente: meta.cliente || '',
        programador: meta.programador || '',
        maquina: meta.maquina || '',
        avisos,
        confianca,
        rawRows,
    };
}

function parseHtmlTables(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tabelas = [...doc.querySelectorAll('table')].map((tabela) =>
        [...tabela.querySelectorAll('tr')]
            .map((tr) => [...tr.querySelectorAll('th,td')].map(textoCelula))
            .filter((linha) => linha.some(Boolean))
    );

    if (tabelas.length > 0) return analisarTabelas(tabelas);

    // Sem <table>: tenta texto tabulado.
    const linhas = (doc.body?.textContent || '')
        .split('\n')
        .map((l) => l.split(/\t+| {2,}/).map((c) => c.trim()).filter(Boolean))
        .filter((l) => l.length > 0);

    return analisarTabelas([linhas]);
}

async function parseXlsx(file) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });

    const tabelas = workbook.SheetNames.map((nome) =>
        XLSX.utils
            .sheet_to_json(workbook.Sheets[nome], { header: 1, defval: '' })
            .map((linha) => (Array.isArray(linha) ? linha : [linha]).map((c) => String(c).trim()))
            .filter((linha) => linha.some(Boolean))
    );

    return analisarTabelas(tabelas);
}

export function minutosParaHorasMin(totalMin) {
    const m = Math.max(0, Math.round(totalMin));
    return { horas: Math.floor(m / 60), minutos: m % 60 };
}

/** Releitura das linhas quando o usuário aponta na mão o papel de cada coluna. */
export function applyCustomMapping(rawRows, colMapping) {
    if (!rawRows || rawRows.length === 0) return resultadoVazio();

    const ferramentas = new Map();
    const operacoes = [];
    let codigoPeca = '';
    let totalMinutos = 0;
    let setupMinutos = 0;

    rawRows.forEach((linha) => {
        let codigoT = '';
        let nomeFerramenta = '';
        let nomeOperacao = '';
        let minutosOperacao = null;

        linha.forEach((celula, coluna) => {
            const papel = colMapping[coluna];
            const texto = textoCelula(celula);
            if (!papel || papel === 'ignore' || !texto) return;

            if (papel === 'part_code' && !codigoPeca) codigoPeca = texto;
            else if (papel === 'tool_code') codigoT = normalizarCodigoT(texto) || texto;
            else if (papel === 'tool_name') nomeFerramenta = texto;
            else if (papel === 'op_name') nomeOperacao = texto;
            else if (papel === 'op_time') minutosOperacao = parseDuracao(texto, 'minutos');
            else if (papel === 'setup_time') {
                const m = parseDuracao(texto, 'minutos');
                if (m !== null) setupMinutos += m;
            }
        });

        if (codigoT || nomeFerramenta) {
            const chave = codigoT || nomeFerramenta;
            const existente = ferramentas.get(chave);
            if (existente) {
                if (!existente.nome && nomeFerramenta) existente.nome = nomeFerramenta;
            } else {
                ferramentas.set(chave, { codigoT: codigoT || chave, nome: nomeFerramenta || 'Ferramenta de usinagem' });
            }
        }

        if (minutosOperacao !== null && minutosOperacao > 0) {
            operacoes.push({
                nome: nomeOperacao || `Operação ${operacoes.length + 1}`,
                tempoMinutos: Math.round(minutosOperacao),
            });
            totalMinutos += minutosOperacao;
        }
    });

    const avisos = [];
    if (ferramentas.size === 0) avisos.push('Mapeamento aplicado — nenhuma ferramenta detectada.');
    if (totalMinutos === 0) avisos.push('Mapeamento aplicado — nenhum tempo detectado.');

    return {
        codigoPeca,
        tempoUsinagemMinutos: Math.round(totalMinutos),
        tempoSetupMinutos: Math.round(setupMinutos),
        ferramentas: [...ferramentas.values()],
        operacoes,
        avisos,
        confianca: 5,
    };
}

export async function parseNxShopDoc(file) {
    if (!file) throw new Error('Nenhum arquivo selecionado');

    const nome = file.name.toLowerCase();
    let dados;

    if (nome.endsWith('.html') || nome.endsWith('.htm')) {
        dados = parseHtmlTables(await file.text());
    } else if (nome.endsWith('.xlsx') || nome.endsWith('.xls')) {
        dados = await parseXlsx(file);
    } else {
        throw new Error('Formato não suportado. Use .html ou .xlsx exportados do CAM.');
    }

    return { ...dados, arquivo: file.name, importadoEm: new Date().toISOString() };
}
