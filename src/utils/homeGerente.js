import {
    agruparCarteira,
    atrasadaOs,
    custoHoraKanban,
    diasEntre,
    kanbanPrecisaProgramar,
    labelSetor,
    rankingFornecedoresExternos,
    statusEhConcluido,
    todosKanbans,
    venceHojeOs,
} from '../constants/osWorkflow';
import { alertaEstoque, precisaPedirEstoque, qtdEstoque, unidadeEstoque } from './estoque';

const LONG_PAUSE_H = 2;
const VENDOR_SLACK_D = 1;

function sectorOf(os) {
    return os?.setor || 'CNC';
}

function isPaused(os) {
    return !!(os?.is_pausado);
}

function pauseHours(os, now = Date.now()) {
    const raw = os?.data_pausa;
    const t = raw ? new Date(raw).getTime() : NaN;
    if (!isPaused(os) || Number.isNaN(t)) return 0;
    return Math.max(0, (now - t) / (1000 * 60 * 60));
}

function isScrap(os) {
    const r = os?.resultado_afericao || '';
    return r === 'Refugo';
}

function sameDay(iso, ref = new Date()) {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    return d.toDateString() === ref.toDateString();
}

function endDate(os) {
    return os?.timestamp_entrada_concluido || os?.updated_at;
}

function rowTitle(row) {
    return row.titulo || row.head?.codigo_peca || 'O.S.';
}

function partCode(os) {
    return os?.codigo_peca || 'kanban';
}

function countSector(list, sector) {
    return (list || []).filter((os) => sectorOf(os) === sector && !statusEhConcluido(os)).length;
}

export function montarHomeGerente(kanban, estoque, config = {}) {
    const carteira = agruparCarteira(kanban, config);
    const cards = todosKanbans(kanban);
    const open = cards.filter((os) => !statusEhConcluido(os));
    const ranking = rankingFornecedoresExternos(kanban);
    const avgByVendor = Object.fromEntries(ranking.map((r) => [r.nome, r.mediaDias]));

    const late = carteira.filter((r) => r.atrasada && !r.tudoPronto);
    const dueToday = carteira.filter((r) => !r.atrasada && !r.tudoPronto && (
        venceHojeOs(r.head) || (r.kanbans || []).some(venceHojeOs)
    ));
    const toProgram = carteira.filter((r) => r.aProgramar && !r.tudoPronto);
    const atVendor = carteira.filter((r) => r.emTerceiro);
    const ready = carteira.filter((r) => r.pecaPronta || r.tudoPronto);
    const wipRs = open.reduce((s, os) => s + (custoHoraKanban(os, config).custo || 0), 0);

    const faixa = {
        cnc: {
            fila: countSector(kanban.aFazer, 'CNC'),
            setup: countSector(kanban.setup, 'CNC'),
            maquina: countSector(kanban.emCorte, 'CNC'),
            afericao: countSector(kanban.afericao, 'CNC'),
        },
        edm: {
            fila: countSector(kanban.aFazer, 'EDM_FIO'),
            setup: countSector(kanban.setup, 'EDM_FIO'),
            maquina: countSector(kanban.emCorte, 'EDM_FIO'),
            afericao: countSector(kanban.afericao, 'EDM_FIO'),
        },
        ext: {
            fila: countSector(kanban.aFazer, 'EXTERNO'),
            la: countSector(kanban.emCorte, 'EXTERNO'),
            volta: countSector(kanban.afericao, 'EXTERNO')
                + (kanban.concluido || []).filter((os) => sectorOf(os) === 'EXTERNO' && sameDay(endDate(os))).length,
        },
    };

    const kpis = [
        {
            id: 'atraso',
            label: 'Atrasadas / vencem hoje',
            value: late.length + dueToday.length,
            hint: `${late.length} atrasada(s) · ${dueToday.length} hoje`,
            tone: late.length ? 'danger' : (dueToday.length ? 'warn' : 'ok'),
            filtroCarteira: 'atrasando',
        },
        {
            id: 'cam',
            label: 'A programar',
            value: toProgram.length,
            hint: 'CAM ainda nao informado',
            tone: toProgram.length ? 'warn' : 'ok',
            filtroCarteira: 'a_programar',
        },
        {
            id: 'maq',
            label: 'Na maquina agora',
            value: faixa.cnc.maquina + faixa.edm.maquina,
            hint: `CNC ${faixa.cnc.maquina} · eletrofio ${faixa.edm.maquina}`,
            tone: 'neutral',
            view: 'kanban',
        },
        {
            id: 'pronto',
            label: 'Prontas p/ retirada',
            value: ready.length,
            hint: `${ready.filter((r) => r.tudoPronto).length} conjunto(s) completo(s)`,
            tone: ready.length ? 'info' : 'ok',
            filtroCarteira: 'peca_pronta',
        },
        {
            id: 'ext',
            label: 'No terceiro',
            value: atVendor.length,
            hint: faixa.ext.la ? `${faixa.ext.la} peca(s) la agora` : 'Nenhum ciclo aberto',
            tone: atVendor.length ? 'warn' : 'ok',
            filtroCarteira: 'em_terceiro',
        },
        {
            id: 'wip',
            label: 'R$ em WIP',
            value: wipRs,
            money: true,
            hint: `${open.length} kanban(s) abertos`,
            legend: 'WIP = trabalho em processo: horas previstas (ou reais, se já rodou) × custo/hora da máquina. É o dinheiro parado no chão, não o faturado.',
            tone: 'neutral',
            filtroCarteira: 'todas',
        },
    ];

    const avisos = [];

    late.forEach((row) => {
        avisos.push({
            id: `atraso-${row.grupoId}`,
            sev: 'red',
            titulo: `Prazo estourado — ${rowTitle(row)}`,
            detalhe: `${row.cliente || 'Cliente'} · ${labelSetor(sectorOf(row.gargalo || row.head))}`,
            acao: 'Abrir no quadro',
            os: row.gargalo || row.head,
            view: 'kanban',
        });
    });

    dueToday.forEach((row) => {
        avisos.push({
            id: `hoje-${row.grupoId}`,
            sev: 'amber',
            titulo: `Entrega hoje — ${rowTitle(row)}`,
            detalhe: row.aProgramar ? 'Ainda esta a programar' : (row.cliente || ''),
            acao: row.aProgramar ? 'Programar' : 'Ver quadro',
            os: row.gargalo || row.head,
            view: 'kanban',
        });
    });

    open.filter(isPaused).forEach((os) => {
        const h = pauseHours(os);
        if (h < LONG_PAUSE_H) return;
        avisos.push({
            id: `pausa-${os.id}`,
            sev: 'red',
            titulo: `Parada ha ${h.toFixed(1)} h — ${partCode(os)}`,
            detalhe: os.motivo_pausa || labelSetor(sectorOf(os)),
            acao: 'Ver kanban',
            os,
            view: 'kanban',
        });
    });

    [...(kanban.concluido || []), ...(kanban.afericao || [])].filter(isScrap).forEach((os) => {
        if (!sameDay(endDate(os)) && !sameDay(os.updated_at)) return;
        avisos.push({
            id: `refugo-${os.id}`,
            sev: 'red',
            titulo: `Refugo hoje — ${partCode(os)}`,
            detalhe: os.motivo_refugo || os.cliente || '',
            acao: 'Ver ficha',
            os,
            view: 'kanban',
        });
    });

    toProgram.forEach((row) => {
        const due = atrasadaOs(row.head) || venceHojeOs(row.head)
            || (row.kanbans || []).some((k) => atrasadaOs(k) || venceHojeOs(k));
        if (!due) return;
        if (avisos.some((a) => a.id === `hoje-${row.grupoId}` || a.id === `atraso-${row.grupoId}`)) return;
        avisos.push({
            id: `cam-${row.grupoId}`,
            sev: 'amber',
            titulo: `CAM no caminho do prazo — ${rowTitle(row)}`,
            detalhe: 'Sem programacao e o relogio do cliente corre',
            acao: 'Programar',
            os: row.gargalo || row.head,
            view: 'kanban',
        });
    });

    open.filter((os) => sectorOf(os) === 'EXTERNO' && os.enviado_em).forEach((os) => {
        const dias = diasEntre(os.enviado_em, os.voltou_em);
        if (dias == null) return;
        const nome = os.fornecedor_nome || 'Sem fornecedor';
        const media = avgByVendor[nome];
        const limite = media != null ? media + VENDOR_SLACK_D : 7;
        if (dias <= limite) return;
        avisos.push({
            id: `ext-${os.id}`,
            sev: 'amber',
            titulo: `${Math.round(dias)} d no terceiro — ${partCode(os)}`,
            detalhe: `${nome}${media != null ? ` · media ${media.toFixed(1)} d` : ''}`,
            acao: 'Fila externo',
            os,
            view: 'carteira',
            filtroCarteira: 'em_terceiro',
        });
    });

    (estoque || []).filter((item) => precisaPedirEstoque(item)).forEach((item) => {
        avisos.push({
            id: `est-${item.id}`,
            sev: 'amber',
            titulo: `Precisa pedir — ${item.nome}`,
            detalhe: `${qtdEstoque(item)} ${unidadeEstoque(item)} (mín. ${alertaEstoque(item)})`,
            acao: 'Abrir estoque',
            view: 'estoque',
        });
    });

    ready.filter((r) => r.tudoPronto).slice(0, 6).forEach((row) => {
        avisos.push({
            id: `pronto-${row.grupoId}`,
            sev: 'blue',
            titulo: `Conjunto pronto — ${rowTitle(row)}`,
            detalhe: row.cliente ? `Avisar ${row.cliente} / liberar retirada` : 'Liberar retirada',
            acao: 'Ver carteira',
            os: row.head,
            view: 'carteira',
            filtroCarteira: 'peca_pronta',
        });
    });

    const sevRank = { red: 0, amber: 1, blue: 2 };
    avisos.sort((a, b) => (sevRank[a.sev] ?? 9) - (sevRank[b.sev] ?? 9));

    const stuck = carteira.filter((r) => !r.tudoPronto && (
        r.aProgramar || r.emTerceiro || (r.gargalo && isPaused(r.gargalo)) || kanbanPrecisaProgramar(r.gargalo)
    )).slice(0, 7);

    return {
        kpis,
        avisos: avisos.slice(0, 12),
        filas: {
            prazo: [...late, ...dueToday.filter((r) => !r.atrasada)].slice(0, 7),
            travadas: stuck,
            prontas: ready.slice(0, 7),
        },
        faixa,
        silencioso: avisos.filter((a) => a.sev !== 'blue').length === 0,
    };
}
