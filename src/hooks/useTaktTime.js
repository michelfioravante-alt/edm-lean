import { useState, useMemo } from 'react';
import { calcularTaktTime } from '../utils/manufacturingMath';

export function useTaktTime(initialTempo = 480, initialDemanda = 0) {
    const [tempoDisponivel, setTempoDisponivel] = useState(initialTempo);
    const [demanda, setDemanda] = useState(initialDemanda);

    const taktTime = useMemo(() => {
        return calcularTaktTime(tempoDisponivel, demanda);
    }, [tempoDisponivel, demanda]);

    return { tempoDisponivel, setTempoDisponivel, demanda, setDemanda, taktTime };
}
