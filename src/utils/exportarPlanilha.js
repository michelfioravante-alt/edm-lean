import { COLUMN_LABELS } from '../constants/cncProcess';
import {
    atrasadaOs,
    colKeyDoKanban,
    custoHoraKanban,
    horasKanban,
    prazoOs,
    rankingFornecedoresExternos,
    statusEhConcluido,
    todosKanbans,
} from '../constants/osWorkflow';
import { agregarKpis } from './dashboardMetrics';
import { precisaPedirEstoque, qtdEstoque, unidadeEstoque } from './estoque';

export const RELATORIOS_EXPORT = [
    { id: 'resumo', titulo: 'Resumo', dica: 'Indicadores do período' },
    { id: 'ordens', titulo: 'Ordens', dica: 'Todas as O.S. no intervalo' },
    { id: 'carteira', titulo: 'Carteira', dica: 'O que está aberto agora' },
    { id: 'concluidas', titulo: 'Concluídas', dica: 'Entregues no período' },
    { id: 'pausas', titulo: 'Pausas', dica: 'Motivo e tempo parado' },
    { id: 'qualidade', titulo: 'Qualidade', dica: 'Aprovada, retrabalho, refugo' },
    { id: 'cam', titulo: 'CAM × real', dica: 'Horas previstas e horas máquina' },
    { id: 'estoque', titulo: 'Estoque', dica: 'Saldo e ponto de pedido' },
    { id: 'movimentos', titulo: 'Movimentos', dica: 'Entrada e saída de material' },
    { id: 'clientes', titulo: 'Clientes', dica: 'Cadastro' },
    { id: 'ferramental', titulo: 'Ferramental', dica: 'Vida útil e status' },
    { id: 'terceiros', titulo: 'Serviço fora', dica: 'Fornecedores externos' },
];

const SETOR_TXT = { CNC: 'CNC', EDM_FIO: 'Eletrofio', EXTERNO: 'Externo' };

const CAB_ORDENS = [
    'Peça', 'Cliente', 'Setor', 'Status', 'Qtd', 'Prazo', 'Atrasada', 'Máquina',
    'Operador', 'Programador', 'Programa', 'Horas CAM', 'Horas reais', 'Eficiência CAM %',
    'Valor orçado (R$)', 'Custo máquina (R$)', 'Aferição', 'Aberta em', 'Concluída em',
];

function pick(obj, ...keys) {
    for (const k of keys) {
        const v = obj?.[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

function parseData(v) {
    if (!v) return null;
    const raw = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

export function intervaloPeriodo(chave, de, ate) {
    const agora = new Date();
    if (chave === '7d') {
        const ateD = endOfDay(agora);
        const deD = startOfDay(agora);
        deD.setDate(deD.getDate() - 6);
        return { de: deD, ate: ateD };
    }
    if (chave === 'mes') {
        return { de: new Date(agora.getFullYear(), agora.getMonth(), 1), ate: endOfDay(agora) };
    }
    if (chave === 'mes_ant') {
        return {
            de: new Date(agora.getFullYear(), agora.getMonth() - 1, 1),
            ate: endOfDay(new Date(agora.getFullYear(), agora.getMonth(), 0)),
        };
    }
    if (chave === 'ano') {
        return { de: new Date(agora.getFullYear(), 0, 1), ate: endOfDay(agora) };
    }
    if (chave === 'intervalo' && de && ate) {
        return { de: startOfDay(new Date(`${de}T12:00:00`)), ate: endOfDay(new Date(`${ate}T12:00:00`)) };
    }
    return { de: null, ate: null };
}

export function rotuloPeriodo(chave, de, ate) {
    const r = intervaloPeriodo(chave, de, ate);
    if (!r.de || !r.ate) return 'Todo o histórico';
    return `${r.de.toLocaleDateString('pt-BR')} a ${r.ate.toLocaleDateString('pt-BR')}`;
}

function noIntervalo(data, de, ate) {
    if (!de || !ate) return true;
    if (!data) return false;
    return data.getTime() >= de.getTime() && data.getTime() <= ate.getTime();
}

function osNoPeriodo(os, de, ate) {
    if (!de || !ate) return true;
    const ds = [
        parseData(pick(os, 'created_at')),
        parseData(prazoOs(os)),
        parseData(pick(os, 'timestamp_entrada_concluido')),
    ].filter(Boolean);
    if (!ds.length) return true;
    return ds.some((d) => noIntervalo(d, de, ate));
}

function num(v, casas = 2) {
    const n = Number(v);
    return Number.isFinite(n) ? Number(n.toFixed(casas)) : null;
}

function setorTxt(os) {
    const s = pick(os, 'setor') || 'CNC';
    return SETOR_TXT[s] || s;
}

function statusTxt(kanban, os) {
    const key = colKeyDoKanban(kanban, os.id);
    return COLUMN_LABELS[key] || pick(os, 'statusLocal', 'status') || '—';
}

const COR = {
    fundo: 'FF181B22',
    fundoEscuro: 'FF111318',
    laranja: 'FFD97D3D',
    texto: 'FFE7E9ED',
    textoEscuro: 'FF1F232B',
    mudo: 'FF7B808F',
    linhaA: 'FFF7F4F0',
    linhaB: 'FFFFFFFF',
    borda: 'FFD9D4CC',
    alerta: 'FFC85558',
    alertaFundo: 'FFF6E4E4',
    ok: 'FF4A9D74',
    okFundo: 'FFE4F0EA',
};

const BORDA = {
    top: { style: 'thin', color: { argb: COR.borda } },
    left: { style: 'thin', color: { argb: COR.borda } },
    bottom: { style: 'thin', color: { argb: COR.borda } },
    right: { style: 'thin', color: { argb: COR.borda } },
};

function tipoCol(header) {
    const h = String(header).toLowerCase();
    if (h.includes('r$)') || h.includes('custo') || h.includes('orçado') || h.includes('orcado')) return 'money';
    if (h.includes('%') || h.includes('eficiência') || h.includes('eficiencia') || h.includes('fpy')) return 'pct';
    if (h.includes('em') && (h.includes('aberta') || h.includes('conclu') || h.includes('prazo') || h.includes('início') || h.includes('inicio') || h.includes('fim') || h === 'data')) return 'date';
    if (['prazo', 'início', 'inicio', 'fim', 'data', 'aberta em', 'concluída em', 'concluida em'].includes(h)) return 'date';
    if (h.includes('hora') || h.includes('saldo') || h.includes('mínimo') || h.includes('minimo') || h.includes('qtd') || h.includes('quantidade') || h.includes('ciclo') || h.includes('média') || h.includes('media') || h.includes('vida') || h.includes('alerta') || h.includes('valor') || h.includes('lead')) return 'num';
    if (h === 'atrasada' || h === 'pedir') return 'flag';
    return 'text';
}

function aplicarCelula(cell, value, tipo, zebra) {
    const fillArgb = zebra ? COR.linhaA : COR.linhaB;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
    cell.border = BORDA;
    cell.alignment = { vertical: 'middle', wrapText: tipo === 'text' };
    cell.font = { name: 'Calibri', size: 10, color: { argb: COR.textoEscuro } };

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        cell.value = value;
        cell.numFmt = 'dd/mm/yyyy';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        return;
    }
    if (tipo === 'money' && typeof value === 'number') {
        cell.value = value;
        cell.numFmt = '"R$" #,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
    }
    if (tipo === 'pct' && typeof value === 'number') {
        cell.value = value / 100;
        cell.numFmt = '0.0%';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
    }
    if (tipo === 'num' && typeof value === 'number') {
        cell.value = value;
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
    }
    if (tipo === 'flag') {
        const sim = String(value) === 'Sim';
        cell.value = value ?? '—';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sim ? COR.alerta : COR.ok } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sim ? COR.alertaFundo : COR.okFundo } };
        return;
    }
    cell.value = value == null || value === '' ? '—' : value;
}

function adicionarAba(wb, nome, headers, rows) {
    const ws = wb.addWorksheet(nome, {
        views: [{ state: 'frozen', ySplit: 2, showGridLines: false }],
        properties: { tabColor: { argb: COR.laranja } },
    });
    const lastCol = headers.length;

    ws.mergeCells(1, 1, 1, lastCol);
    const titulo = ws.getCell(1, 1);
    titulo.value = `EDM Lean  ·  ${nome}`;
    titulo.font = { name: 'Calibri', size: 13, bold: true, color: { argb: COR.laranja } };
    titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.fundoEscuro } };
    titulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(1).height = 26;

    const head = ws.getRow(2);
    head.height = 22;
    headers.forEach((h, i) => {
        const cell = head.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COR.texto } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.fundo } };
        cell.border = {
            top: { style: 'thin', color: { argb: COR.laranja } },
            left: { style: 'thin', color: { argb: COR.fundo } },
            bottom: { style: 'medium', color: { argb: COR.laranja } },
            right: { style: 'thin', color: { argb: COR.fundo } },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const tipos = headers.map(tipoCol);
    rows.forEach((row, rIdx) => {
        const excelRow = ws.getRow(rIdx + 3);
        excelRow.height = 18;
        headers.forEach((_, cIdx) => {
            aplicarCelula(excelRow.getCell(cIdx + 1), row[cIdx], tipos[cIdx], rIdx % 2 === 0);
        });
    });

    if (!rows.length) {
        ws.mergeCells(3, 1, 3, lastCol);
        const empty = ws.getCell(3, 1);
        empty.value = 'Sem registros neste recorte.';
        empty.font = { name: 'Calibri', size: 10, italic: true, color: { argb: COR.mudo } };
        empty.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.linhaA } };
        empty.alignment = { vertical: 'middle', indent: 1 };
    }

    ws.autoFilter = {
        from: { row: 2, column: 1 },
        to: { row: Math.max(2, rows.length + 2), column: lastCol },
    };

    ws.columns = headers.map((h, i) => {
        let max = String(h).length;
        rows.forEach((row) => {
            const v = row[i];
            const s = v instanceof Date ? 10 : String(v ?? '').length;
            if (s > max) max = Math.min(s, 42);
        });
        return { width: Math.max(12, max + 3) };
    });

    ws.pageSetup = {
        orientation: lastCol > 8 ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };
}

function montarCapa(wb, { empresa, periodoLabel, setor, ids }) {
    const ws = wb.addWorksheet('Capa', {
        properties: { tabColor: { argb: COR.laranja } },
        views: [{ showGridLines: false }],
    });
    ws.columns = [{ width: 22 }, { width: 78 }];

    ws.mergeCells('A1:B1');
    const brand = ws.getCell('A1');
    brand.value = 'EDM Lean';
    brand.font = { name: 'Calibri', size: 22, bold: true, color: { argb: COR.laranja } };
    brand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.fundoEscuro } };
    brand.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(1).height = 36;

    ws.mergeCells('A2:B2');
    const sub = ws.getCell('A2');
    sub.value = 'Importação de dados  ·  ferramentaria';
    sub.font = { name: 'Calibri', size: 11, color: { argb: COR.texto } };
    sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.fundo } };
    sub.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(2).height = 22;

    const meta = [
        ['Ferramentaria', empresa || '—'],
        ['Período', periodoLabel],
        ['Gerado em', new Date().toLocaleString('pt-BR')],
        ['Setor', setor && setor !== 'TODOS' ? (SETOR_TXT[setor] || setor) : 'Toda a fábrica'],
        ['Relatórios', ids.map((id) => RELATORIOS_EXPORT.find((r) => r.id === id)?.titulo).filter(Boolean).join(', ')],
    ];
    meta.forEach((par, i) => {
        const r = 4 + i;
        const a = ws.getCell(r, 1);
        const b = ws.getCell(r, 2);
        a.value = par[0];
        b.value = par[1];
        a.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COR.texto } };
        b.font = { name: 'Calibri', size: 10, color: { argb: COR.textoEscuro } };
        a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR.fundo } };
        b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? COR.linhaA : COR.linhaB } };
        a.border = BORDA;
        b.border = BORDA;
        ws.getRow(r).height = 20;
    });

    ws.getCell('A10').value = 'Como usar';
    ws.getCell('A10').font = { name: 'Calibri', size: 11, bold: true, color: { argb: COR.laranja } };
    ws.mergeCells('A11:B11');
    ws.getCell('A11').value = 'Excel: abra e use os filtros da 2ª linha. Números e datas já vêm no padrão brasileiro.';
    ws.mergeCells('A12:B12');
    ws.getCell('A12').value = 'Power BI: Obter dados → Excel → abas de dados (não a Capa). Use a 2ª linha como cabeçalho.';
    ws.getCell('A11').font = { name: 'Calibri', size: 10, color: { argb: COR.textoEscuro } };
    ws.getCell('A12').font = { name: 'Calibri', size: 10, color: { argb: COR.textoEscuro } };
}

function linhaOrdem(kanban, os, config) {
    const h = horasKanban(os);
    const $ = custoHoraKanban(os, config);
    return [
        pick(os, 'codigo_peca') || '—',
        pick(os, 'cliente') || '—',
        setorTxt(os),
        statusTxt(kanban, os),
        Number(pick(os, 'quantidade')) || 1,
        parseData(prazoOs(os)),
        atrasadaOs(os) ? 'Sim' : 'Não',
        pick(os, 'maquina_nome') || '—',
        pick(os, 'operador_atual') || '—',
        pick(os, 'programador') || '—',
        pick(os, 'numero_programa') || '—',
        num(h.estimadas),
        num(h.reais),
        num(h.eficienciaCam, 1),
        num(pick(os, 'valor_orcado')),
        num($.custo),
        pick(os, 'resultado_afericao') || '—',
        parseData(pick(os, 'created_at')),
        parseData(pick(os, 'timestamp_entrada_concluido')),
    ];
}

function linhasPausas(lista) {
    const rows = [];
    lista.forEach((os) => {
        const hist = pick(os, 'historico_pausas') || [];
        hist.forEach((p) => {
            rows.push([
                pick(os, 'codigo_peca') || '—',
                setorTxt(os),
                pick(p, 'motivo') || '—',
                num(pick(p, 'duracaoHoras', 'duracao_horas')),
                parseData(pick(p, 'inicio')),
                parseData(pick(p, 'fim')),
                pick(p, 'observacao', 'obs') || '',
            ]);
        });
    });
    return rows;
}

export async function gerarWorkbook({
    empresa,
    periodoLabel,
    ids,
    kanban,
    estoque,
    movimentacoes,
    clientes,
    ferramental,
    configHora,
    de,
    ate,
    setor,
    comValores = false,
}) {
    const ehValor = (rotulo) => rotulo.includes('R$');
    const cabOrdens = comValores ? CAB_ORDENS : CAB_ORDENS.filter((c) => !ehValor(c));
    const linhaOrdemVisivel = (os) => {
        const linha = linhaOrdem(kanban, os, configHora);
        return comValores ? linha : linha.filter((_, i) => !ehValor(CAB_ORDENS[i]));
    };

    const mod = await import('exceljs');
    const ExcelJS = mod.default || mod;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'EDM Lean';
    wb.created = new Date();
    wb.company = empresa || 'EDM Lean';

    let lista = todosKanbans(kanban);
    if (setor && setor !== 'TODOS') {
        lista = lista.filter((os) => (pick(os, 'setor') || 'CNC') === setor);
    }

    const noPer = lista.filter((os) => osNoPeriodo(os, de, ate));
    const concluidasPeriodo = lista.filter((os) => {
        if (!statusEhConcluido(os)) return false;
        const d = parseData(pick(os, 'timestamp_entrada_concluido'))
            || parseData(pick(os, 'created_at'));
        return noIntervalo(d, de, ate);
    });
    const abertas = lista.filter((os) => !statusEhConcluido(os));
    const kpis = agregarKpis(concluidasPeriodo, abertas, configHora);
    const set = new Set(ids);

    montarCapa(wb, { empresa, periodoLabel, setor, ids });

    if (set.has('resumo')) {
        adicionarAba(wb, 'Resumo', ['Indicador', 'Valor', 'Unidade', 'Nota'], [
            ['O.S. concluídas', concluidasPeriodo.length, 'un', 'No período'],
            ['O.S. abertas (WIP)', abertas.length, 'un', 'Foto agora'],
            ['Eficiência CAM', num(kpis.oee, 1), '%', 'Previsto ÷ setup + corte reais'],
            ['FPY', num(kpis.fpy, 1), '%', 'Aprovadas na 1ª aferição'],
            ['Horas CAM', num(kpis.planH), 'h', ''],
            ['Horas máquina', num(kpis.realCamH), 'h', ''],
            ['Lead time médio', num(kpis.leadMedio), 'h', ''],
            ['Custo máquina', num(kpis.custoMaquina), 'R$', 'Horas × R$/h do setor'],
            ['Valor orçado', num(kpis.orcado), 'R$', ''],
            ['Custo de pausa', num(kpis.valorPausa), 'R$', ''],
            ['Custo de refugo', num(kpis.valorRefugo), 'R$', ''],
        ].filter((linha) => comValores || linha[2] !== 'R$'));
    }
    if (set.has('ordens')) {
        adicionarAba(wb, 'Ordens', cabOrdens, noPer.map(linhaOrdemVisivel));
    }
    if (set.has('carteira')) {
        adicionarAba(wb, 'Carteira', cabOrdens, abertas.map(linhaOrdemVisivel));
    }
    if (set.has('concluidas')) {
        adicionarAba(wb, 'Concluidas', cabOrdens, concluidasPeriodo.map(linhaOrdemVisivel));
    }
    if (set.has('pausas')) {
        adicionarAba(wb, 'Pausas', ['Peça', 'Setor', 'Motivo', 'Horas', 'Início', 'Fim', 'Observação'], linhasPausas(noPer));
    }
    if (set.has('qualidade')) {
        adicionarAba(wb, 'Qualidade', ['Peça', 'Cliente', 'Setor', 'Máquina', 'Resultado', 'Qtd', 'Qtd concluída', 'Concluída em'],
            concluidasPeriodo.map((os) => [
                pick(os, 'codigo_peca') || '—',
                pick(os, 'cliente') || '—',
                setorTxt(os),
                pick(os, 'maquina_nome') || '—',
                pick(os, 'resultado_afericao') || '—',
                Number(pick(os, 'quantidade')) || 1,
                Number(pick(os, 'quantidade_concluida')) || null,
                parseData(pick(os, 'timestamp_entrada_concluido')),
            ]));
    }
    if (set.has('cam')) {
        adicionarAba(wb, 'CAM x real', ['Peça', 'Setor', 'Setup CAM (h)', 'Corte CAM (h)', 'Setup real (h)', 'Corte real (h)', 'Aferição (h)', 'Eficiência %'],
            noPer.map((os) => {
                const h = horasKanban(os);
                return [
                    pick(os, 'codigo_peca') || '—',
                    setorTxt(os),
                    num(h.setupEst), num(h.corteEst), num(h.setupReal), num(h.corteReal), num(h.afericaoReal), num(h.eficienciaCam, 1),
                ];
            }));
    }
    if (set.has('estoque')) {
        adicionarAba(wb, 'Estoque', ['Item', 'Setor', 'Saldo', 'Mínimo', 'Unidade', 'Pedir'],
            (estoque || []).map((item) => [
                pick(item, 'nome') || '—',
                SETOR_TXT[pick(item, 'setor')] || pick(item, 'setor') || 'Todos',
                qtdEstoque(item),
                Number(pick(item, 'alerta_minimo')) || 0,
                unidadeEstoque(item),
                precisaPedirEstoque(item) ? 'Sim' : 'Não',
            ]));
    }
    if (set.has('movimentos')) {
        const movs = (movimentacoes || []).filter((m) => noIntervalo(parseData(pick(m, 'created_at', 'data')), de, ate));
        adicionarAba(wb, 'Movimentos', ['Data', 'Item', 'Tipo', 'Quantidade', 'Origem'],
            movs.map((m) => [
                parseData(pick(m, 'created_at', 'data')),
                pick(m, 'item_nome', 'nome') || '—',
                pick(m, 'tipo', 'tipo_movimento') || '—',
                num(pick(m, 'quantidade')),
                pick(m, 'origem', 'observacao') || '',
            ]));
    }
    if (set.has('clientes')) {
        adicionarAba(wb, 'Clientes', ['Cliente', 'E-mail', 'Telefone'],
            (clientes || []).map((c) => [c.nome || '—', c.email || '', c.telefone || '']));
    }
    if (set.has('ferramental')) {
        adicionarAba(wb, 'Ferramental', ['Nome', 'Tipo', 'Código', 'Vida útil (h)', 'Alerta (h)', 'Status'],
            (ferramental || []).map((f) => [
                pick(f, 'nome') || '—',
                pick(f, 'tipo') || '—',
                pick(f, 'codigo') || '',
                num(pick(f, 'vida_util_horas'), 1),
                num(pick(f, 'alerta_horas'), 1),
                pick(f, 'status') || '—',
            ]));
    }
    if (set.has('terceiros')) {
        const rank = rankingFornecedoresExternos(kanban);
        adicionarAba(wb, 'Servico fora', ['Fornecedor', 'Peças lá agora', 'Ciclos', 'Média de dias'],
            rank.map((r) => [r.nome, r.laAgora, r.ciclos, r.mediaDias != null ? num(r.mediaDias, 1) : null]));
    }

    return wb;
}

export async function baixarWorkbook(wb, nomeArquivo) {
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}

export function nomeArquivoExport(empresa) {
    const stamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const slug = String(empresa || 'EDM-Lean').replace(/[^\wÀ-ÿ]+/g, '-').slice(0, 24);
    return `${slug}_exportacao_${stamp}.xlsx`;
}
