import { horasKanban, custoHoraKanban, rankingFornecedoresExternos, atrasadaOs } from '../constants/osWorkflow';

export function setorDaOs(os) {
    return os?.setor || 'CNC';
}

export function dataConclusao(os) {
    const raw = os?.timestamp_entrada_concluido || os?.created_at;
    const d = raw ? new Date(raw) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
}

export function noPeriodo(data, periodo) {
    if (!data) return false;
    const now = new Date();
    if (periodo === 'hoje') return data.toDateString() === now.toDateString();
    if (periodo === 'semana') {
        const diff = Math.abs(now.getTime() - data.getTime());
        return diff / (1000 * 60 * 60 * 24) <= 7;
    }
    if (periodo === 'mes') return data.getFullYear() === now.getFullYear() && data.getMonth() === now.getMonth();
    if (/^\d{4}-\d{2}$/.test(periodo)) {
        const [y, m] = periodo.split('-').map(Number);
        return data.getFullYear() === y && data.getMonth() === m - 1;
    }
    return true;
}

export function noTurno(data, turnoId, turnos) {
    if (!turnoId || turnoId === 'todos' || !data || !turnos?.length) return true;
    const t = turnos.find((x) => x.id === turnoId);
    if (!t?.inicio || !t?.fim) return true;
    const val = data.getHours() * 60 + data.getMinutes();
    const [sh, sm] = String(t.inicio).split(':').map(Number);
    const [eh, em] = String(t.fim).split(':').map(Number);
    const start = sh * 60 + (sm || 0);
    const end = eh * 60 + (em || 0);
    return start < end ? val >= start && val < end : val >= start || val < end;
}

export function resultadoAfericao(os) {
    return os?.resultado_afericao || '';
}

export function ehAprovada(os) {
    const r = resultadoAfericao(os);
    return r === 'Aprovada' || r === 'Aprovada';
}

export function ehRefugo(os) {
    return resultadoAfericao(os) === 'Refugo';
}

export function horasPausaOs(os, agoraMs = Date.now()) {
    const hist = os?.historico_pausas || [];
    let h = hist.reduce((s, p) => s + Math.max(0, Number(p.duracaoHoras ?? p.duracaoHoras ?? p.duracao_horas) || 0), 0);
    if (os?.is_pausado) {
        const t = new Date(os.data_pausa).getTime();
        if (!Number.isNaN(t)) h += Math.max(0, (agoraMs - t) / (1000 * 60 * 60));
    }
    return h;
}

export function filtrarConcluidas(lista, { setor, periodo, turno, turnos }) {
    return (lista || []).filter((os) => {
        if (setor && setor !== 'TODOS' && setorDaOs(os) !== setor) return false;
        const d = dataConclusao(os) || new Date();
        return noPeriodo(d, periodo) && noTurno(d, turno, turnos);
    });
}

export function filtrarAtivas(kanban, setor) {
    const raw = [
        ...(kanban.aFazer || []),
        ...(kanban.setup || []),
        ...(kanban.emCorte || []),
        ...(kanban.afericao || []),
    ];
    if (!setor || setor === 'TODOS') return raw;
    return raw.filter((os) => setorDaOs(os) === setor);
}

export function pipelineWip(kanban, setor) {
    const cols = [
        { key: 'aFazer', label: 'Fila' },
        { key: 'setup', label: 'Set-up' },
        { key: 'emCorte', label: 'Máquina' },
        { key: 'afericao', label: 'Aferição' },
    ];
    return cols.map((c) => {
        const list = kanban[c.key] || [];
        const n = setor && setor !== 'TODOS' ? list.filter((os) => setorDaOs(os) === setor).length : list.length;
        return { ...c, n };
    });
}

export function agregarKpis(concluidas, ativas, config) {
    let planH = 0;
    let realCamH = 0;
    let valorCorte = 0;
    let valorTrabalho = 0;
    let valorRefugo = 0;
    let valorPausa = 0;
    let orcado = 0;
    let custoMaquina = 0;
    const camSeries = [];

    concluidas.forEach((os) => {
        const h = horasKanban(os);
        const $ = custoHoraKanban(os, config);
        const realCam = h.setupReal + h.corteReal;
        planH += h.estimadas;
        realCamH += realCam;
        custoMaquina += $.custo;
        const vo = Number(os.valor_orcado);
        if (Number.isFinite(vo) && vo > 0) orcado += vo;
        valorPausa += horasPausaOs(os) * $.rate;
        if (ehAprovada(os)) {
            valorCorte += h.corteReal * $.rate;
            valorTrabalho += realCam * $.rate;
        } else if (ehRefugo(os)) {
            valorRefugo += realCam * $.rate;
        } else {
            valorTrabalho += realCam * $.rate;
        }
        camSeries.push({
            label: os.codigo_peca || String(os.id).slice(-4),
            cam: Number(h.estimadas.toFixed(2)),
            real: Number(realCam.toFixed(2)),
            eficiencia: h.eficienciaCam,
        });
    });

    ativas.forEach((os) => {
        const $ = custoHoraKanban(os, config);
        valorPausa += horasPausaOs(os) * $.rate;
    });

    const aprovadas = concluidas.filter(ehAprovada).length;
    const aferidas = concluidas.filter((o) => resultadoAfericao(o)).length;
    const fpy = aferidas > 0 ? (aprovadas / aferidas) * 100 : 100;
    const oee = planH > 0 && realCamH > 0 ? Math.min((planH / realCamH) * 100, 999) : 100;

    const leads = concluidas.map((os) => {
        const ini = os.created_at;
        const fim = os.timestamp_entrada_concluido;
        if (!ini || !fim) return null;
        const hrs = (new Date(fim) - new Date(ini)) / (1000 * 60 * 60);
        return Number.isFinite(hrs) && hrs >= 0 ? hrs : null;
    }).filter((x) => x != null);
    const leadMedio = leads.length ? leads.reduce((a, b) => a + b, 0) / leads.length : 0;

    return {
        planH,
        realCamH,
        oee,
        fpy,
        valorCorte,
        valorTrabalho,
        valorRefugo,
        valorPausa,
        orcado,
        custoMaquina,
        leadMedio,
        camSeries: camSeries.slice(-12),
        atrasadas: ativas.filter(atrasadaOs).length,
        wip: ativas.length,
        concluidasN: concluidas.length,
        margem: orcado - custoMaquina,
    };
}

export function metricasPorSetor(concluidas, config) {
    return ['CNC', 'EDM_FIO', 'EXTERNO'].map((id) => {
        const lista = concluidas.filter((o) => setorDaOs(o) === id);
        return { id, ...agregarKpis(lista, [], config) };
    });
}

export function rankingFornecedoresDash(kanban) {
    return rankingFornecedoresExternos(kanban);
}

export function mesesPassados(n = 6) {
    const meses = [];
    const d = new Date();
    for (let i = 1; i <= n; i++) {
        const ref = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const y = ref.getFullYear();
        const m = String(ref.getMonth() + 1).padStart(2, '0');
        const nome = ref.toLocaleString('pt-BR', { month: 'short' });
        meses.push({ value: `${y}-${m}`, label: `${nome.toUpperCase()}/${y}` });
    }
    return meses;
}

export function brl(n) {
    return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtLead(h) {
    if (!h) return '—';
    return h >= 24 ? `${(h / 24).toFixed(1)}d` : `${h.toFixed(1)}h`;
}
