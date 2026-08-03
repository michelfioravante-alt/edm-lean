import { useState, useMemo } from 'react';
import { calcularCustosTotais, calcularDuracaoEmHoras } from '../utils/manufacturingMath';

export function useCosts(custoHoraMaquina = 0, custoHoraOperador = 0) {
    const [tempoHoras, setTempoHoras] = useState(0);

    const setDuracao = (inicio, fim) => {
        setTempoHoras(calcularDuracaoEmHoras(inicio, fim));
    };

    const custos = useMemo(() => {
        return calcularCustosTotais(tempoHoras, custoHoraMaquina, custoHoraOperador);
    }, [tempoHoras, custoHoraMaquina, custoHoraOperador]);

    return { tempoHoras, setTempoHoras, setDuracao, custos };
}
