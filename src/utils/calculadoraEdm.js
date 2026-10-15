/**
 * Tempo de corte WEDM (eletroerosão a fio).
 * Duas entradas equivalentes usadas no produto e na calculadora pública.
 */

export function formatarTempoHm(totalMinutos) {
    const m = Math.max(0, Math.round(Number(totalMinutos) || 0));
    return {
        horas: Math.floor(m / 60),
        minutos: m % 60,
        totalMinutos: m,
    };
}

/** Perímetro (mm) + passes em mm/min + eficiência % + quantidade — fórmula do modal da Nova O.S. */
export function calcularTempoPorPasses({ perimetroMm, passesMmMin = [], eficienciaPct = 100, quantidade = 1 }) {
    const perimetro = Number(perimetroMm);
    const eff = Math.max(0.1, Number(eficienciaPct) || 100) / 100;
    const qtd = Math.max(1, parseInt(quantidade, 10) || 1);

    if (!(perimetro > 0)) return formatarTempoHm(0);

    let minutos100 = 0;
    let valido = false;
    for (const taxa of passesMmMin) {
        const v = Number(taxa);
        if (v > 0) {
            minutos100 += perimetro / v;
            valido = true;
        }
    }
    if (!valido) return formatarTempoHm(0);
    return formatarTempoHm((minutos100 / eff) * qtd);
}

/**
 * Perímetro × espessura → área (mm²), velocidade em mm²/min.
 * Linguagem comum de WEDM (mesma ideia da Doretto / catálogo de máquina).
 */
export function calcularTempoPorArea({
    perimetroMm,
    espessuraMm,
    velocidadeMm2Min,
    eficienciaPct = 100,
    quantidade = 1,
}) {
    const perimetro = Number(perimetroMm);
    const espessura = Number(espessuraMm);
    const velocidade = Number(velocidadeMm2Min);
    const eff = Math.max(0.1, Number(eficienciaPct) || 100) / 100;
    const qtd = Math.max(1, parseInt(quantidade, 10) || 1);

    if (!(perimetro > 0) || !(espessura > 0) || !(velocidade > 0)) {
        return { ...formatarTempoHm(0), areaMm2: 0 };
    }

    const areaMm2 = perimetro * espessura;
    const minutos = ((areaMm2 / velocidade) / eff) * qtd;
    return { ...formatarTempoHm(minutos), areaMm2 };
}

export function rotuloTempo({ horas, minutos }) {
    return `${horas}h ${String(minutos).padStart(2, '0')}m`;
}
