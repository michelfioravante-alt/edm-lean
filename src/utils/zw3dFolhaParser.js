import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Área do desenho no template ZW3D (paisagem):
 * esquerda = título/dados; centro = viewport do desenho; direita = tabela tecnologia.
 */
const DRAWING_CROP = { x0: 0.30, y0: 0.10, x1: 0.72, y1: 0.88 };

/** Rótulos do bloco ZW3D — nunca usar como valor de peça/material. */
const ROTULOS_ZW3D = new Set([
    'TITULO', 'TÍTULO', 'QUANTIDADE', 'MATERIAL', 'MASSA', 'PROCESSO',
    'TRATAMENTO', 'TÉRMICO', 'TERMICO', 'PEÇA', 'PECA', 'NOTAS', 'OBS',
]);

function limparEspacos(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
}

function normLabel(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[:：]/g, '').trim();
}

function isRotulo(s) {
    const n = normLabel(s);
    return ROTULOS_ZW3D.has(n) || /^TITULO$/.test(n);
}

function pareceCodigoPeca(s) {
    const v = String(s || '').trim().toUpperCase();
    if (!v || isRotulo(v)) return false;
    return /^[A-Z]\d{2}-[A-Z]{2}$/.test(v) || /^[A-Z0-9]{2,}-[A-Z0-9]{2,}$/.test(v);
}

function textoPagina(items) {
    return items.map((it) => it.str || '').join(' ');
}

/**
 * Monta linhas do bloco de título (coluna esquerda) a partir das posições do PDF.
 */
function linhasBlocoTitulo(items, pageWidth) {
    const limiteX = pageWidth * 0.42;
    const pts = (items || [])
        .map((it) => ({
            str: (it.str || '').trim(),
            x: it.transform?.[4] ?? 0,
            y: it.transform?.[5] ?? 0,
        }))
        .filter((it) => it.str && it.x <= limiteX);

    pts.sort((a, b) => b.y - a.y || a.x - b.x);
    const linhas = [];
    const tolY = 4;
    for (const p of pts) {
        let row = linhas.find((l) => Math.abs(l.y - p.y) <= tolY);
        if (!row) {
            row = { y: p.y, parts: [] };
            linhas.push(row);
        }
        row.parts.push(p);
    }
    return linhas
        .map((l) => {
            l.parts.sort((a, b) => a.x - b.x);
            return limparEspacos(l.parts.map((p) => p.str).join(' '));
        })
        .filter(Boolean);
}

/**
 * Extrai campos do template ZW3D (rótulo + valor na mesma linha ou na linha seguinte).
 */
function parseCamposZw3d(textoBruto, items, pageWidth) {
    const texto = limparEspacos(textoBruto);
    const linhas = linhasBlocoTitulo(items, pageWidth);
    const campos = {};

    const valorAposRotulo = (line, rotuloRe) => {
        const inline = line.replace(rotuloRe, '').trim().replace(/^[:：]\s*/, '').trim();
        if (inline && !isRotulo(inline.split(/\s+/)[0])) return inline;
        return '';
    };

    for (let i = 0; i < linhas.length; i++) {
        const line = linhas[i];
        const up = line.toUpperCase();

        if (/^T[IÍ]TULO\b/.test(up)) {
            let val = valorAposRotulo(line, /^T[IÍ]TULO\s*[:：]?\s*/i);
            if (!val && linhas[i + 1] && !isRotulo(linhas[i + 1])) val = linhas[i + 1];
            const token = val.split(/\s+/).find((t) => pareceCodigoPeca(t)) || val.split(/\s+/)[0];
            if (token && pareceCodigoPeca(token)) campos.titulo = token.toUpperCase();
        }

        if (/^QUANTIDADE\b/.test(up)) {
            const m = line.match(/QUANTIDADE\s*[:：]?\s*0*(\d+)\s*PE[ÇC]A/i)
                || line.match(/QUANTIDADE\s*[:：]?\s*0*(\d+)/i)
                || line.match(/0*(\d+)\s*PE[ÇC]A/i);
            if (m) campos.quantidade = Math.max(1, parseInt(m[1], 10) || 1);
            else if (linhas[i + 1]) {
                const nxt = linhas[i + 1];
                const m2 = nxt.match(/^0*(\d+)\s*PE[ÇC]A/i) || nxt.match(/^0*(\d+)$/);
                if (m2) campos.quantidade = Math.max(1, parseInt(m2[1], 10) || 1);
            }
        }

        if (/^MATERIAL\b/.test(up)) {
            let val = valorAposRotulo(line, /^MATERIAL\s*[:：]?\s*/i);
            if (!val && linhas[i + 1] && !/^MASSA\b/i.test(linhas[i + 1])) val = linhas[i + 1];
            const mat = val.split(/\s+MASSA\b/i)[0]?.trim().split(/\s+/)[0];
            if (mat && !isRotulo(mat)) campos.material = mat;
        }

        if (/^MASSA\b/.test(up)) {
            const m = line.match(/MASSA\s*[:：]?\s*([0-9]+(?:[.,][0-9]+)?)\s*kg/i);
            if (m) {
                const n = parseFloat(String(m[1]).replace(',', '.'));
                if (Number.isFinite(n)) campos.massaKg = n;
            }
        }

        if (/PROCESSO/.test(up) && (up.startsWith('-') || up.startsWith('PROCESSO'))) {
            let val = line.replace(/^-?\s*PROCESSO\s*[:：]?\s*/i, '').trim();
            if (!val && linhas[i + 1]) val = linhas[i + 1].trim();
            const proc = val.split(/\s+/)[0];
            if (proc && !isRotulo(proc)) campos.processo = proc;
        }
    }

    // Fallbacks no texto completo (PDFs com colagem estranha)
    if (!campos.titulo) {
        const mTit = texto.match(/T[IÍ]TULO\s*[:：]?\s*([A-Z]\d{2}-[A-Z]{2})/i);
        if (mTit) campos.titulo = mTit[1].toUpperCase();
    }
    if (!campos.titulo) {
        const mCod = texto.match(/\b([A-Z]\d{2}-[A-Z]{2})\b/);
        if (mCod) campos.titulo = mCod[1].toUpperCase();
    }
    if (campos.quantidade == null) {
        const mQ = texto.match(/QUANTIDADE\s*[:：]?\s*0*(\d+)\s*PE[ÇC]A/i)
            || texto.match(/QUANTIDADE\s*[:：]?\s*0*(\d+)/i)
            || texto.match(/QUANTIDADE\s*0*(\d+)PE[ÇC]A/i);
        if (mQ) campos.quantidade = Math.max(1, parseInt(mQ[1], 10) || 1);
    }
    if (campos.quantidade == null) {
        const mPeca = texto.match(/\b0*(\d{1,3})\s*PE[ÇC]A\b/i);
        if (mPeca) campos.quantidade = Math.max(1, parseInt(mPeca[1], 10) || 1);
    }
    if (!campos.material) {
        const mMat = texto.match(/MATERIAL\s*[:：]?\s*([A-Za-zÀ-ÿ0-9.\-]+?)(?=\s+MASSA|\s+QUANTIDADE|$)/i);
        if (mMat && !isRotulo(mMat[1])) campos.material = limparEspacos(mMat[1]);
    }
    if (!campos.processo) {
        const mProc = texto.match(/-?\s*PROCESSO\s*[:：]?\s*([A-Za-zÀ-ÿ]+)/i);
        if (mProc && !isRotulo(mProc[1])) campos.processo = mProc[1];
    }
    if (campos.massaKg == null) {
        const mMassa = texto.match(/MASSA\s*[:：]?\s*([0-9]+(?:[.,][0-9]+)?)\s*kg/i);
        if (mMassa) {
            const n = parseFloat(String(mMassa[1]).replace(',', '.'));
            if (Number.isFinite(n)) campos.massaKg = n;
        }
    }

    if (/temper/i.test(texto) || /revenir/i.test(texto) || /\bHRC\b/i.test(texto)) {
        const m = texto.match(/TEMPER[^0-9A-Z]*REVENIR[^0-9]*([0-9\-–]+\s*HRC)?/i);
        campos.tratamento = limparEspacos(m?.[0] || 'Têmpera / revenimento');
    }

    return campos;
}

function extrairCodigoPeca(fileName, campos, pageIndex) {
    if (campos.titulo && pareceCodigoPeca(campos.titulo)) return campos.titulo.toUpperCase();
    const base = String(fileName || '').replace(/\.pdf$/i, '');
    const mFile = base.match(/([A-Z]\d{2}-[A-Z]{2})/i) || base.match(/([A-Z0-9]+-[A-Z0-9]+)/i);
    if (mFile) return mFile[1].toUpperCase();
    return pageIndex != null ? `FOLHA-${pageIndex + 1}` : (base || 'PECA').toUpperCase();
}

function extrairMoldeDoCaminho(relativePath, fileName) {
    const parts = String(relativePath || fileName || '').split(/[/\\]/).filter(Boolean);
    const moldePart = [...parts].reverse().find((p) => /molde/i.test(p) && !/\.pdf$/i.test(p));
    if (moldePart) {
        return limparEspacos(moldePart.replace(/\.Z3PRT.*$/i, '').replace(/_/g, ' '));
    }
    if (parts.length >= 2) {
        const pasta = parts[parts.length - 2];
        if (pasta && !/\.pdf$/i.test(pasta)) return limparEspacos(pasta.replace(/_/g, ' '));
    }
    const base = String(fileName || '').replace(/\.pdf$/i, '');
    // Nome do molde: pasta ou arquivo sem sufixo "Folha N"
    const moldeDoNome = base.replace(/\s*folha\s*\d+$/i, '').trim();
    return limparEspacos(moldeDoNome.replace(/_/g, ' ')) || 'Molde';
}

function materialFromCampos(campos, texto) {
    if (campos.material) return campos.material;
    const t = limparEspacos(texto);
    if (/cobre/i.test(t)) return 'Cobre';
    if (/grafite/i.test(t)) return 'Grafite';
    if (/\bH13\b/i.test(t)) return 'H13';
    if (/\bP20\b/i.test(t)) return 'P20';
    if (/\bD2\b/i.test(t)) return 'D2';
    if (/a[cç]o/i.test(t)) return 'Aço';
    return '';
}

function processoFromCampos(campos, texto) {
    if (campos.processo) return campos.processo;
    const t = limparEspacos(texto);
    if (/\bTORNO\b/i.test(t)) return 'Torno';
    if (/eletrofio|wedm|wire|fio\s*a\s*fio/i.test(t)) return 'Eletrofio';
    if (/\bcnc\b|fres/i.test(t)) return 'CNC';
    if (/eros[aã]o|edm/i.test(t)) return 'Erosão';
    return '';
}

/** Mapeamento configurável processo → setor (pode evoluir sem hardcode espalhado). */
export const PROCESSO_PARA_SETOR = {
    TORNO: 'CNC',
    CNC: 'CNC',
    FRESAMENTO: 'CNC',
    FRES: 'CNC',
    ELETROFIO: 'EDM_FIO',
    WEDM: 'EDM_FIO',
    FIO: 'EDM_FIO',
    EROSÃO: 'CNC',
    EROSAO: 'CNC',
    EDM: 'CNC',
};

function sugerirSetor({ processo, tratamento, material }) {
    const key = String(processo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (PROCESSO_PARA_SETOR[key]) return PROCESSO_PARA_SETOR[key];
    if (/eletrofio|wedm|fio/i.test(processo || '')) return 'EDM_FIO';
    if (tratamento && !processo) return 'EXTERNO';
    if (/cobre|grafite/i.test(material || '')) return 'CNC';
    if (/torno/i.test(processo || '')) return 'CNC';
    return 'CNC';
}

function montarRoteiroSugestao({ setor, processo, tratamento }) {
    const etapas = [];
    if (/torno/i.test(processo || '')) etapas.push('TORNO');
    if (setor === 'CNC') etapas.push('CNC');
    else if (setor === 'EDM_FIO') etapas.push('EDM_FIO');
    else if (setor === 'EXTERNO') etapas.push('EXTERNO');
    if (tratamento && !etapas.includes('EXTERNO')) etapas.push('EXTERNO');
    if (!etapas.length) etapas.push(setor || 'CNC');
    return etapas;
}

function segmentoDaPeca({ material, tratamento, setor }) {
    if (setor === 'EXTERNO' || tratamento) return 'terceiro';
    if (/cobre/i.test(material || '')) return 'cobre';
    if (/grafite/i.test(material || '')) return 'grafite';
    if (/a[cç]o|h13|p20|d2/i.test(material || '')) return 'aco';
    return 'outros';
}

/** Remove margens claras; só conta traço escuro ou cota vermelha. */
function trimConteudo(sourceCanvas) {
    const ctx = sourceCanvas.getContext('2d');
    const { width: w, height: h } = sourceCanvas;
    const { data } = ctx.getImageData(0, 0, w, h);
    const isInk = (i) => {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        if (max < 190) return true;
        if (r > 140 && g < 110 && b < 110) return true;
        return false;
    };
    const rowHasInk = (y) => {
        let n = 0;
        for (let x = 0; x < w; x++) {
            if (isInk((y * w + x) * 4) && ++n >= 3) return true;
        }
        return false;
    };
    const colHasInk = (x, y0, y1) => {
        let n = 0;
        for (let y = y0; y <= y1; y++) {
            if (isInk((y * w + x) * 4) && ++n >= 3) return true;
        }
        return false;
    };

    let top = 0;
    let bottom = h - 1;
    let left = 0;
    let right = w - 1;
    let found = false;
    for (; top < h; top++) {
        if (rowHasInk(top)) { found = true; break; }
    }
    if (!found) return sourceCanvas;
    for (; bottom > top; bottom--) {
        if (rowHasInk(bottom)) break;
    }
    for (; left < w; left++) {
        if (colHasInk(left, top, bottom)) break;
    }
    for (; right > left; right--) {
        if (colHasInk(right, top, bottom)) break;
    }

    const pad = Math.max(6, Math.round(Math.min(w, h) * 0.03));
    left = Math.max(0, left - pad);
    top = Math.max(0, top - pad);
    right = Math.min(w - 1, right + pad);
    bottom = Math.min(h - 1, bottom + pad);
    const tw = right - left + 1;
    const th = bottom - top + 1;
    if (tw < 24 || th < 24) return sourceCanvas;

    // Thumbnail quadrado centrado no desenho (evita “empurrar” pro canto)
    const side = Math.max(tw, th);
    const out = document.createElement('canvas');
    out.width = side;
    out.height = side;
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, side, side);
    const dx = Math.floor((side - tw) / 2);
    const dy = Math.floor((side - th) / 2);
    octx.drawImage(sourceCanvas, left, top, tw, th, dx, dy, tw, th);
    return out;
}

async function renderPaginaCompleta(page) {
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const out = trimConteudo(canvas);
    const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/jpeg', 0.82));
    const previewUrl = out.toDataURL('image/jpeg', 0.75);
    return { blob, previewUrl };
}

function montarPecaFromPage({
    page, texto, items, pageWidth, fileName, relativePath, pageIndex, pageCount, codigoMoldeHint,
}) {
    const campos = parseCamposZw3d(texto, items, pageWidth);
    const codigoPeca = extrairCodigoPeca(fileName, campos, pageIndex);
    const material = materialFromCampos(campos, texto);
    const massaKg = campos.massaKg ?? null;
    const processo = processoFromCampos(campos, texto);
    const tratamento = campos.tratamento || '';
    const quantidade = campos.quantidade ?? 1;
    const codigoValido = pareceCodigoPeca(codigoPeca);
    const parseOk = true;
    const qtyInferida = campos.quantidade == null;
    const leituraAutomatica = codigoValido;

    const setor = sugerirSetor({ processo, tratamento, material });
    const etapas = montarRoteiroSugestao({ setor, processo, tratamento });
    const codigoMolde = codigoMoldeHint || extrairMoldeDoCaminho(relativePath, fileName);

    const avisoRevisao = !codigoValido
        ? `Código "${codigoPeca}" não lido automaticamente — confira e edite abaixo.`
        : (qtyInferida ? 'Quantidade assumida: 1 peça' : null);

    return {
        fileName: pageCount > 1 ? `${fileName}#p${pageIndex + 1}` : fileName,
        relativePath,
        pageIndex,
        pageCount,
        codigoPeca,
        codigoMolde,
        material,
        massaKg,
        processo,
        tratamento,
        quantidade,
        setor,
        etapas,
        origemImport: 'pdf',
        leituraAutomatica,
        textoBruto: texto.slice(0, 400),
        qtyInferida,
        selected: true,
        precisaRevisao: !leituraAutomatica,
        avisoRevisao,
        aviso: avisoRevisao,
        erro: null,
        _page: page,
    };
}

/**
 * Lê um PDF ZW3D (1 página = 1 peça, ou multi-página = N peças).
 */
export async function parseZw3dPdf(file, opts = {}) {
    const relativePath = opts.relativePath || file.webkitRelativePath || file.name;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data }).promise;
    const pageCount = pdf.numPages || 1;
    const codigoMoldeHint = extrairMoldeDoCaminho(relativePath, file.name);
    const pecas = [];

    for (let i = 1; i <= pageCount; i++) {
        try {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const vp = page.getViewport({ scale: 1 });
            const texto = limparEspacos(textoPagina(content.items || []));
            const row = montarPecaFromPage({
                page,
                texto,
                items: content.items || [],
                pageWidth: vp.width,
                fileName: file.name,
                relativePath,
                pageIndex: i - 1,
                pageCount,
                codigoMoldeHint,
            });
            try {
                const { blob, previewUrl } = await renderPaginaCompleta(page);
                row.folhaBlob = blob;
                row.previewUrl = previewUrl;
            } catch {
                row.folhaBlob = null;
                row.previewUrl = '';
                row.avisoRevisao = row.avisoRevisao || 'Não foi possível gerar preview desta folha.';
            }
            delete row._page;
            pecas.push(row);
        } catch (err) {
            pecas.push({
                fileName: `${file.name}#p${i}`,
                relativePath,
                pageIndex: i - 1,
                pageCount,
                codigoPeca: extrairCodigoPeca(file.name, {}, i - 1),
                codigoMolde: codigoMoldeHint,
                material: '',
                massaKg: null,
                processo: '',
                tratamento: '',
                quantidade: 1,
                setor: 'CNC',
                etapas: ['CNC'],
                origemImport: 'pdf',
                folhaBlob: null,
                previewUrl: '',
                leituraAutomatica: false,
                precisaRevisao: true,
                avisoRevisao: err?.message || `Falha na folha ${i} — preencha manualmente.`,
                aviso: err?.message || `Falha na folha ${i}`,
                erro: null,
                selected: true,
            });
        }
    }

    // Mesmo código em 2+ páginas → agrupa (mantém 1ª com desenho; marca extras)
    const byCode = new Map();
    const agrupadas = [];
    for (const p of pecas) {
        if (p.precisaRevisao) {
            agrupadas.push(p);
            continue;
        }
        const key = p.codigoPeca;
        if (!byCode.has(key)) {
            byCode.set(key, p);
            agrupadas.push(p);
        } else {
            const first = byCode.get(key);
            first.quantidade = Math.max(first.quantidade || 1, p.quantidade || 1);
            first.pageCountExtra = (first.pageCountExtra || 0) + 1;
        }
    }

    return { codigoMolde: codigoMoldeHint, pecas: agrupadas, pageCount };
}

/** @deprecated use parseZw3dPdf — mantido para 1ª página só */
export async function parseZw3dFolha(file, opts = {}) {
    const { pecas } = await parseZw3dPdf(file, opts);
    return pecas[0] || null;
}

export async function parseZw3dPasta(files) {
    const pdfs = [...files].filter((f) => /\.pdf$/i.test(f.name));
    const pecas = [];
    let totalFolhas = 0;
    for (const file of pdfs) {
        try {
            const { pecas: rows, pageCount } = await parseZw3dPdf(file);
            totalFolhas += pageCount || rows.length;
            pecas.push(...rows);
        } catch (err) {
            pecas.push({
                fileName: file.name,
                relativePath: file.webkitRelativePath || file.name,
                codigoPeca: file.name.replace(/\.pdf$/i, ''),
                codigoMolde: extrairMoldeDoCaminho(file.webkitRelativePath, file.name),
                material: '',
                massaKg: null,
                processo: '',
                tratamento: '',
                quantidade: 1,
                setor: 'CNC',
                etapas: ['CNC'],
                origemImport: 'pdf',
                folhaBlob: null,
                previewUrl: '',
                leituraAutomatica: false,
                precisaRevisao: true,
                avisoRevisao: err?.message || 'Falha ao ler PDF — preencha manualmente.',
                aviso: err?.message || 'Falha ao ler PDF',
                erro: null,
                selected: true,
            });
        }
    }
    const ok = pecas.filter((p) => p.leituraAutomatica);
    const revisao = pecas.filter((p) => !p.leituraAutomatica);
    const moldes = [...new Set(pecas.map((p) => p.codigoMolde).filter(Boolean))];
    const codigoMolde = moldes.length === 1
        ? moldes[0]
        : (moldes.sort((a, b) => b.length - a.length)[0] || 'Molde');
    return {
        codigoMolde,
        pecas,
        resumo: {
            totalFolhas: totalFolhas || pecas.length,
            processadas: ok.length,
            revisao: revisao.length,
        },
    };
}

/** Renderiza 1ª página do PDF como thumbnail (para vincular a linhas CSV). */
export async function renderPdfPreview(file) {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const { blob, previewUrl } = await renderPaginaCompleta(page);
    return { blob, previewUrl, fileName: file.name };
}

export { montarRoteiroSugestao, sugerirSetor };
