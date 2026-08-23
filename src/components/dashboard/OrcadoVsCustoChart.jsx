import React from 'react';
import { Bar } from 'react-chartjs-2';
import { brl } from '../../utils/dashboardMetrics';
import { barOpts, CHART, vGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function OrcadoVsCustoChart({ orcado, custo, margem }) {
    const colors = [CHART.ok, CHART.brand, margem >= 0 ? '#7B9EC9' : CHART.alert];
    const data = {
        labels: ['Orçado', 'Máquina', 'Margem'],
        datasets: [{
            data: [orcado, custo, margem],
            backgroundColor: (ctx) => {
                const base = colors[ctx.dataIndex] || CHART.brand;
                return vGradient(ctx, base, `${base}33`);
            },
            barPercentage: 0.42,
        }],
    };
    const options = {
        ...barOpts({ tickY: (v) => brl(v) }),
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${brl(c.parsed.y)}` } },
        },
    };

    return (
        <ChartCard title="Orçado × máquina" subtitle="Valor da O.S. contra horas × tarifa do setor" badge="R$">
            {orcado > 0 || custo > 0 ? (
                <Bar data={data} options={options} />
            ) : (
                <ChartEmpty>Preencha o orçado na carteira para ver margem neste recorte.</ChartEmpty>
            )}
        </ChartCard>
    );
}
