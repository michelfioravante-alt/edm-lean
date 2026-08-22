import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RefugoPorMaquinaChart({ concluidas = [] }) {
    const refugos = concluidas.filter(os => (os.resultado_afericao || os.resultadoAfericao) === 'Refugo');
    const maquinaHoras = {};
    const maquinaQtd = {};

    refugos.forEach(os => {
        const maq = os.maquina_nome || os.maquina || 'Não informada';
        const setup = os.tempos_fases?.setup || os.temposFases?.setup || 0;
        const corte = os.tempos_fases?.emCorte || os.temposFases?.emCorte || 0;
        const totalH = setup + corte;

        maquinaHoras[maq] = (maquinaHoras[maq] || 0) + totalH;
        maquinaQtd[maq] = (maquinaQtd[maq] || 0) + 1;
    });

    const sortedData = Object.entries(maquinaHoras)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const barHeight = 28;
    const chartHeight = Math.max(80, sortedData.length * barHeight);
    const maxVisibleHeight = 300;

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        barThickness: barHeight,
        maxBarThickness: barHeight,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const idx = ctx.dataIndex;
                        const maq = sortedData[idx][0];
                        const qtd = maquinaQtd[maq] || 0;
                        return [` ${ctx.parsed.x.toFixed(1)}h desperdiçadas`, `${qtd} peça(s) refugada(s)`];
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.12)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (v) => v + 'h'
                }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11 } }
            }
        }
    };

    const chartData = {
        labels: sortedData.map(([m]) => m),
        datasets: [{
            label: 'Horas em Refugo',
            data: sortedData.map(([, h]) => h),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Refugo por Máquina</h3>
            <p className="text-sm text-muted mb-4">Horas desperdiçadas (Setup+Corte) por equipamento — priorize manutenção</p>
            <div
                className="flex-1 min-h-0 overflow-y-auto kanban-scroll"
                style={{ minHeight: 100, maxHeight: maxVisibleHeight }}
            >
                {sortedData.length > 0 ? (
                    <div style={{ height: chartHeight, minWidth: 200 }}>
                        <Bar options={options} data={chartData} />
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-[#7B808F] gap-2 py-8">
                        <p className="font-bold text-sm">Nenhum refugo no período.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
