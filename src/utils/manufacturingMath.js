import { colKeyToStatus } from '../constants/cncProcess';

export function calcularTempo(perimetro, rendEsperado, rendReal) {
    if (!perimetro || !rendEsperado || !rendReal || perimetro < 0 || rendEsperado <= 0 || rendReal < 0) return 0;
    const tempoEsperadoMin = parseFloat(perimetro) / parseFloat(rendEsperado);
    const tempoRealMin = tempoEsperadoMin / (parseFloat(rendReal) / 100);
    return tempoRealMin / 60; // Retorna em horas
}

export function calcularDuracaoEmHoras(inicio, fim) {
    if (!inicio || !fim) return 0;
    return (new Date(fim) - new Date(inicio)) / (1000 * 60 * 60);
}

export function calcularTaktTime(tempoDisponivelMinutos, demandaCliente) {
    if (!tempoDisponivelMinutos || !demandaCliente || demandaCliente <= 0) return 0;
    return tempoDisponivelMinutos / demandaCliente;
}

export function calcularOEE(disponibilidade, performance, qualidade) {
    return (disponibilidade * performance * qualidade) / 10000; // Assumindo inputs de 0 a 100
}

export function calcularPerformance(tempoEstimado, tempoEfetivo) {
    if (!tempoEstimado || !tempoEfetivo || tempoEfetivo <= 0) return 0;
    return (tempoEstimado / tempoEfetivo) * 100;
}

export function calcularCustosTotais(tempoHoras, custoHoraMaquina, custoHoraOperador) {
    const custoMaquina = tempoHoras * (custoHoraMaquina || 0);
    const custoOperador = tempoHoras * (custoHoraOperador || 0);
    return {
        custoMaquina,
        custoOperador,
        custoTotal: custoMaquina + custoOperador
    };
}

export function calcularTempoFaseAtual(os, statusAtualText, nowMs = Date.now()) {
    if (!os || !statusAtualText) return 0;

    const keyMap = {
        [colKeyToStatus('aFazer')]: 'aFazer',
        [colKeyToStatus('setup')]: 'setup',
        [colKeyToStatus('emCorte')]: 'emCorte',
        [colKeyToStatus('afericao')]: 'afericao',
        [colKeyToStatus('concluido')]: 'concluido',
        // Legado EDM Lean
        'Set-up': 'setup',
        'Em Corte': 'emCorte',
        'Aferição': 'afericao',
    };

    const colKey = keyMap[statusAtualText];
    if (!colKey) return 0;

    // Tempo que ja foi consolidado nas movimentações antigas (se houver um bug ou loop)
    const temposFases = os.tempos_fases || os.temposFases || {};
    let tempoConsolidadoMs = (temposFases[colKey] || 0) * (1000 * 60 * 60);

    // Tempo corrente desde a última entrada nessa mesma coluna
    // Tenta snake case do Supabase 1o, senao vai em camelCase
    let colTimestampKey = '';
    if (colKey === 'setup') colTimestampKey = 'timestamp_entrada_setup';
    else if (colKey === 'emCorte') colTimestampKey = 'timestamp_entrada_emcorte';
    else if (colKey === 'afericao') colTimestampKey = 'timestamp_entrada_afericao';
    else if (colKey === 'concluido') colTimestampKey = 'timestamp_entrada_concluido';

    const timestampEntrada = os[colTimestampKey] || os[`timestampEntrada_${colKey}`] || os.created_at || os.createdAt;

    let tempoCorrenteMs = 0;
    if (timestampEntrada) {
        tempoCorrenteMs = nowMs - new Date(timestampEntrada).getTime();
        tempoCorrenteMs = Math.max(0, tempoCorrenteMs);
    }

    // Calcula tempo morto de pausas OCORRIDAS e ENCERRADAS enquanto estava nesta fase
    const historicoPausas = os.historico_pausas || os.historicoPausas || [];
    const pausasEncerradas = historicoPausas.filter(p => p.fase === colKey);
    let tempoMortoPausasMs = pausasEncerradas.reduce((acc, p) => acc + (p.duracaoHoras * 1000 * 60 * 60), 0);

    // Se estiver em uma pausa NESSE EXATO MOMENTO
    const isPausado = os.is_pausado !== undefined ? os.is_pausado : os.isPausado;
    const dataPausa = os.data_pausa || os.dataPausa;
    if (isPausado && dataPausa) {
        const tempoMortoAtivoMs = Math.max(0, nowMs - new Date(dataPausa).getTime());
        tempoMortoPausasMs += tempoMortoAtivoMs;
    }

    const tempoLiquidoCorrenteMs = Math.max(0, tempoCorrenteMs - tempoMortoPausasMs);

    // Se a OS já está Concluída, não soma tempo corrente com nowMs rolando solto.
    if (colKey === 'concluido' || colKey === 'aFazer') {
        return tempoConsolidadoMs / (1000 * 60 * 60);
    }

    return (tempoConsolidadoMs + tempoLiquidoCorrenteMs) / (1000 * 60 * 60);
}
