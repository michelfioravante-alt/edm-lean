import { colKeyToStatus } from '../constants/cncProcess';
import { horasPassagemAtual } from './relogioOs';

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
    };

    const colKey = keyMap[statusAtualText];
    if (!colKey) return 0;

    const consolidado = Number(os.tempos_fases?.[colKey]) || 0;
    return consolidado + horasPassagemAtual(os, colKey, nowMs);
}
