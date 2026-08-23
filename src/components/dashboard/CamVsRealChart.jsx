import React from 'react';
import { Line } from 'react-chartjs-2';
import { areaGradient, CHART, lineOpts } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function CamVsRealChart({ series = [] }) {
    const data = {
        labels: series.map((s) => s.label),
        datasets: [
            {
                label: 'CAM',
                data: series.map((s) => s.cam),
                borderColor: CHART.steel,
                backgroundColor: (c) => areaGradient(c, 'rgba(139,144,160,0.22)'),
                fill: true,
                pointHoverBackgroundColor: CHART.steel,
            },
            {
                label: 'Máquina',
                data: series.map((s) => s.real),
                borderColor: CHART.brand,
                backgroundColor: (c) => areaGradient(c, 'rgba(217,125,61,0.28)'),
                fill: true,
                pointHoverBackgroundColor: CHART.brand,
            },
        ],
    };
    const options = {
        ...lineOpts({ tickY: (v) => `${v}h` }),
        plugins: {
            ...lineOpts().plugins,
            tooltip: {
                callbacks: {
                    footer: (items) => {
                        const e = series[items[0]?.dataIndex]?.eficiencia;
                        return e != null ? `Eficiência CAM ${e.toFixed(0)}%` : '';
                    },
                },
            },
        },
    };

    return (
        <ChartCard title="Tendência CAM × real" subtitle="Setup + corte. Aferição e pausa ficam de fora." badge="ciclo">
            {series.length ? <Line data={data} options={options} /> : <ChartEmpty>Sem O.S. concluída no período.</ChartEmpty>}
        </ChartCard>
    );
}
