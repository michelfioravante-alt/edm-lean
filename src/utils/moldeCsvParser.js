import { montarRoteiroSugestao, sugerirSetor, renderPdfPreview } from './zw3dFolhaParser';

const SETORES_VALIDOS = new Set(['CNC', 'EDM_FIO', 'EXTERNO']);

/** Documentação das colunas — usada no guia visual e na validação. */
export const CSV_COLUNAS = [
    {
        id: 'codigo_peca',
        label: 'Código da peça',
        obrigatorio: true,
        desc: 'Nome/código da peça. Vira o título do kanban.',
        exemplos: 'E02-DB',
        aliases: ['codigo', 'peca', 'titulo'],
    },
    {
        id: 'material',
        label: 'Material',
        obrigatorio: false,
        desc: 'Material usinado (H13, Cobre, Aço…).',
        exemplos: 'H13',
        aliases: [],
    },
    {
        id: 'processo',
        label: 'Processo',
        obrigatorio: false,
        desc: 'Operação principal (CNC, Eletrofio, Torno…).',
        exemplos: 'CNC',
        aliases: [],
    },
    {
        id: 'setor',
        label: 'Setor destino',
        obrigatorio: false,
        desc: 'Para qual quadro vai quando liberar: CNC, EDM_FIO ou EXTERNO.',
        exemplos: 'CNC',
        aliases: ['destino'],
    },
    {
        id: 'quantidade',
        label: 'Quantidade',
        obrigatorio: false,
        desc: 'Quantas peças iguais. Padrão: 1.',
        exemplos: '1',
        aliases: ['qtd'],
    },
    {
        id: 'arquivo_pdf',
        label: 'Arquivo PDF',
        obrigatorio: false,
        desc: 'Nome do PDF do desenho (modo CSV+PDF). Ex.: E02-DB.pdf',
        exemplos: 'E02-DB.pdf',
        aliases: ['pdf', 'arquivo', 'folha'],
    },
    {
        id: 'tratamento',
        label: 'Tratamento',
        obrigatorio: false,
        desc: 'Serviço externo (têmpera, revenimento…).',
        exemplos: 'Têmpera / revenimento',
        aliases: [],
    },
];

export const CSV_COLUNAS_OPCIONAIS_MOLDE = [
    { id: 'codigo_molde', label: 'Código do molde', aliases: ['molde'], desc: 'Opcional na planilha — ou preencha no modal.' },
    { id: 'cliente', label: 'Cliente', aliases: [], desc: 'Opcional — ou preencha no modal.' },
    { id: 'prazo', label: 'Prazo', aliases: ['prazo_entrega'], desc: 'Opcional (AAAA-MM-DD).' },
];

export const CSV_TEMPLATE = `codigo_peca;material;processo;setor;quantidade;arquivo_pdf;tratamento
E02-DB;H13;CNC;CNC;1;E02-DB.pdf;
E03-DB;Cobre;Eletrofio;EDM_FIO;2;;
PLACA-01;Aço;Fresamento;CNC;1;PLACA-01.pdf;Têmpera / revenimento`;

/** Linhas de exemplo para tabela no modal (cabeçalho + 3 peças). */
export function getCsvExemploTabela() {
    const lines = CSV_TEMPLATE.split(/\r?\n/).filter(Boolean);
    const delimiter = ';';
    const [headerLine, ...dataLines] = lines;
    const headers = parseCsvLine(headerLine, delimiter);
    const rows = dataLines.map((line) => {
        const cells = parseCsvLine(line, delimiter);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cells[i] || '—'; });
        return obj;
    });
    return { headers, rows };
}

export function downloadCsvTemplate() {
    const blob = new Blob(['\uFEFF', CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-importacao-molde.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function normHeader(h) {
    return String(h || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');
}

const HEADER_MAP = {
    codigo_peca: 'codigoPeca',
    codigo: 'codigoPeca',
    peca: 'codigoPeca',
    titulo: 'codigoPeca',
    material: 'material',
    processo: 'processo',
    setor: 'setor',
    destino: 'setor',
    quantidade: 'quantidade',
    qtd: 'quantidade',
    arquivo_pdf: 'arquivoPdf',
    pdf: 'arquivoPdf',
    arquivo: 'arquivoPdf',
    folha: 'arquivoPdf',
    tratamento: 'tratamento',
    codigo_molde: 'codigoMolde',
    molde: 'codigoMolde',
    cliente: 'cliente',
    prazo: 'prazo',
    prazo_entrega: 'prazo',
};

function detectDelimiter(line) {
    const semi = (line.match(/;/g) || []).length;
    const comma = (line.match(/,/g) || []).length;
    return semi >= comma ? ';' : ',';
}

function parseCsvLine(line, delimiter) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            out.push(cur.trim());
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur.trim());
    return out;
}

function normalizarSetor(raw) {
    const v = String(raw || '').trim().toUpperCase();
    if (!v) return 'CNC';
    if (v === 'EDM_FIO' || /ELETROFIO|FIO|WEDM/.test(v)) return 'EDM_FIO';
    if (v === 'EXTERNO' || /TERCEIR|FORA|TEMPER|TRATAMENTO/.test(v)) return 'EXTERNO';
    if (v === 'CNC' || /FRES|USINAG/.test(v)) return 'CNC';
    return SETORES_VALIDOS.has(v) ? v : 'CNC';
}

function pecaFromRow(row, idx) {
    const codigoPeca = String(row.codigoPeca || '').trim().toUpperCase() || `PECA-${idx + 1}`;
    const material = String(row.material || '').trim();
    const processo = String(row.processo || '').trim();
    const tratamento = String(row.tratamento || '').trim();
    const setor = normalizarSetor(row.setor || sugerirSetor({ processo, tratamento, material }));
    const quantidade = Math.max(1, parseInt(row.quantidade, 10) || 1);
    const arquivoPdf = String(row.arquivoPdf || '').trim();
    const etapas = montarRoteiroSugestao({ setor, processo, tratamento });

    return {
        fileName: arquivoPdf || `csv-linha-${idx + 1}`,
        codigoPeca,
        codigoMolde: row.codigoMolde || '',
        material,
        processo,
        tratamento,
        quantidade,
        setor,
        etapas,
        arquivoPdf,
        origemImport: 'csv',
        leituraAutomatica: true,
        precisaRevisao: false,
        avisoRevisao: null,
        aviso: null,
        erro: null,
        selected: true,
        folhaBlob: null,
        previewUrl: '',
    };
}

/**
 * Lê CSV/TSV de peças do molde.
 * Colunas: codigo_peca, material, processo, setor, quantidade, arquivo_pdf, tratamento
 * Metadados opcionais na 1ª linha de dados ou colunas codigo_molde / cliente / prazo.
 */
export async function parseMoldeCsv(file) {
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
        throw new Error('Planilha vazia.');
    }

    const delimiter = detectDelimiter(lines[0]);
    const headerCells = parseCsvLine(lines[0], delimiter).map(normHeader);
    const hasHeader = headerCells.some((h) => HEADER_MAP[h]);

    if (!hasHeader) {
        const preview = parseCsvLine(lines[0], delimiter).slice(0, 4).join(', ');
        throw new Error(
            `Cabeçalho não reconhecido na 1ª linha (${preview}…). `
            + 'A primeira linha deve ter nomes como codigo_peca, material, processo, setor… '
            + 'Baixe o modelo CSV no modal ou copie o exemplo abaixo.',
        );
    }

    const temCodigoPeca = headerCells.some((h) => {
        const mapped = HEADER_MAP[h];
        return mapped === 'codigoPeca' || h === 'codigo_peca';
    });
    if (!temCodigoPeca) {
        throw new Error(
            'Coluna obrigatória "codigo_peca" não encontrada. '
            + 'Use esse nome no cabeçalho (ou "codigo", "peca", "titulo").',
        );
    }

    const originalHeaders = parseCsvLine(lines[0], delimiter);
    const colunasIgnoradas = headerCells
        .map((h, i) => ({ h, orig: originalHeaders[i] }))
        .filter(({ h }) => h && !HEADER_MAP[h])
        .map(({ orig }) => orig);

    let codigoMolde = '';
    let cliente = '';
    let prazo = '';
    const pecas = [];

    const startIdx = hasHeader ? 1 : 0;
    const headers = hasHeader
        ? headerCells.map((h) => HEADER_MAP[h] || h)
        : ['codigoPeca', 'material', 'processo', 'setor', 'quantidade', 'arquivoPdf', 'tratamento'];

    for (let i = startIdx; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i], delimiter);
        if (!cells.some(Boolean)) continue;
        if (cells[0]?.startsWith('#')) continue;

        const row = {};
        headers.forEach((key, ci) => {
            if (cells[ci] != null && cells[ci] !== '') row[key] = cells[ci];
        });

        if (row.codigoMolde && !codigoMolde) codigoMolde = String(row.codigoMolde).trim();
        if (row.cliente && !cliente) cliente = String(row.cliente).trim();
        if (row.prazo && !prazo) prazo = String(row.prazo).trim();

        pecas.push(pecaFromRow(row, pecas.length));
    }

    if (!pecas.length) {
        throw new Error('Nenhuma peça encontrada na planilha. Use o modelo CSV.');
    }

    return {
        codigoMolde: codigoMolde || 'Molde',
        cliente,
        prazo,
        pecas,
        resumo: {
            total: pecas.length,
            automaticas: pecas.length,
            revisao: 0,
            colunasIgnoradas: colunasIgnoradas.length ? colunasIgnoradas : undefined,
            delimiter: delimiter === ';' ? 'ponto e vírgula (;)' : 'vírgula (,)',
        },
    };
}

function indexPdfFiles(files) {
    const map = new Map();
    for (const f of files) {
        if (!/\.pdf$/i.test(f.name)) continue;
        const base = f.name.replace(/\.pdf$/i, '').toLowerCase();
        map.set(f.name.toLowerCase(), f);
        map.set(base, f);
    }
    return map;
}

/** Vincula PDFs às linhas CSV pelo campo arquivo_pdf ou código da peça. */
export async function vincularPdfsCsv(pecas, files) {
    const index = indexPdfFiles(files);
    const out = [];

    for (const p of pecas) {
        const next = { ...p };
        const alvo = (p.arquivoPdf || p.fileName || '').trim();
        const codigo = String(p.codigoPeca || '').toLowerCase();
        const pdf = (alvo && index.get(alvo.toLowerCase()))
            || index.get(alvo.replace(/\.pdf$/i, '').toLowerCase())
            || index.get(`${codigo}.pdf`)
            || index.get(codigo);

        if (pdf) {
            try {
                const { blob, previewUrl, fileName } = await renderPdfPreview(pdf);
                next.folhaBlob = blob;
                next.previewUrl = previewUrl;
                next.fileName = fileName;
                next.aviso = next.aviso || null;
            } catch (e) {
                next.avisoRevisao = `PDF "${pdf.name}" não pôde ser lido — dados da planilha mantidos.`;
                next.precisaRevisao = true;
                next.leituraAutomatica = false;
            }
        } else if (p.arquivoPdf) {
            next.avisoRevisao = `PDF "${p.arquivoPdf}" não encontrado — confira o nome ou anexe depois.`;
            next.precisaRevisao = true;
            next.leituraAutomatica = false;
        }

        out.push(next);
    }

    const comPdf = out.filter((p) => p.previewUrl).length;
    return {
        pecas: out,
        resumo: {
            total: out.length,
            comPdf,
            semPdf: out.length - comPdf,
        },
    };
}
