import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { isSameMonth, isSameWeek, isToday, parseISO } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import { barOpts, vGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function InsumosLifeChart({ periodo }) {
    const historicoConsumiveis = useAppStore((s) => s.historicoConsumiveis);
    const kanban = useAppStore((s) => s.kanban);
    const maquinas = useAppStore((s) => s.maquinas);

    const logsConcluidos = useMemo(() => {
        const base = (historicoConsumiveis || []).filter((log) => log.dataFim);
        if (!periodo) return base;
        const now = new Date();
        return base.filter((log) => {
            const dt = parseISO(log.dataFim);
            if (Number.isNaN(dt.getTime())) return false;
            if (periodo === 'mes') return isSameMonth(dt, now);
            if (periodo === 'semana') return isSameWeek(dt, now);
            if (periodo === 'hoje') return isToday(dt);
            if (/^\d{4}-\d{2}$/.test(periodo)) {
                const [y, m] = periodo.split('-').map(Number);
                return isSameMonth(dt, new Date(y, m - 1, 1));
            }
            return true;
        });
    }, [historicoConsumiveis, periodo]);

    const lifeByItem = {};
    logsConcluidos.forEach((log) => {
        const nomeMaquina = maquinas.find((m) => m.id === log.maquinaId)?.nome;
        const osDaMaquina = (kanban.concluido || []).filter((os) => os.maquina_nome === nomeMaquina);
        let horas = 0;
        osDaMaquina.forEach((os) => {
            const fim = os.timestamp_entrada_afericao || os.timestamp_entrada_concluido;
            if (!fim) return;
            const fimMs = new Date(fim).getTime();
            const start = new Date(log.dataInstalacao).getTime();
            const end = new Date(log.dataFim).getTime();
            if (fimMs >= start && fimMs <= end) horas += os.tempos_fases?.emCorte || 0;
        });
        if (horas === 0) {
            horas = Math.max(0, (new Date(log.dataFim) - new Date(log.dataInstalacao)) / 3600000);
        }
        if (!lifeByItem[log.itemNome]) lifeByItem[log.itemNome] = { acumulado: 0, count: 0 };
        lifeByItem[log.itemNome].acumulado += horas;
        lifeByItem[log.itemNome].count += 1;
    });

    const sorted = Object.entries(lifeByItem)
        .map(([nome, obj]) => ({ nome, avg: obj.count ? obj.acumulado / obj.count : 0 }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 8);

    const data = {
        labels: sorted.map((i) => i.nome),
        datasets: [{
            data: sorted.map((i) => i.avg),
            backgroundColor: (c) => vGradient(c, 'rgba(217,125,61,0.95)', 'rgba(217,125,61,0.18)'),
            barPercentage: 0.5,
        }],
    };
    const options = {
        ...barOpts({ tickY: (v) => `${v}h` }),
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.parsed.y.toFixed(1)} h médias em corte` } },
        },
        scales: {
            ...barOpts().scales,
            x: { ...barOpts().scales.x, ticks: { ...barOpts().scales.x.ticks, maxRotation: 24 } },
        },
    };

    return (
        <ChartCard title="Vida de consumíveis" subtitle="Média de horas em corte até a troca" badge="WEDM">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Nenhum insumo fechou ciclo neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
