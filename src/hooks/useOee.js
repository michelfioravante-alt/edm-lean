import { useState, useMemo } from 'react';
import { calcularOEE, calcularPerformance } from '../utils/manufacturingMath';

export function useOee(initialParams = { disponibilidade: 100, tempoEstimado: 0, tempoEfetivo: 0, qualidade: 100 }) {
    const [params, setParams] = useState(initialParams);

    const performance = useMemo(() => {
        return calcularPerformance(params.tempoEstimado, params.tempoEfetivo);
    }, [params.tempoEstimado, params.tempoEfetivo]);

    const oee = useMemo(() => {
        return calcularOEE(params.disponibilidade, performance, params.qualidade);
    }, [params.disponibilidade, performance, params.qualidade]);

    return {
        params,
        setParams,
        updateParam: (key, value) => setParams(prev => ({ ...prev, [key]: value })),
        performance,
        oee
    };
}
