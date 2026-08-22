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

const COLORS = [
    '#14b8a6', '#f59e0b', '#3b82f6', '#a855f7', '#22c55e',
    '#f43f5e', '#fb923c', '#06b6d4'
];

export default function ProducaoPorOperadorChart({ concluidas = [] }) {
    const operadorHoras = {};
    const operadorQtd = {};

    concluidas.forEach(os => {
        const op = os.operador_atual || os.operadorAtual || os.operador || 'Não informado';
        const setup = os.tempos_fases?.setup || os.temposFases?.setup || 0;
        const corte = os.tempos_fases?.emCorte || os.temposFases?.emCorte || 0;
        const totalH = setup + corte;

        operadorHoras[op] = (operadorHoras[op] || 0) + totalH;
        operadorQtd[op] = (operadorQtd[op] || 0) + 1;
    });

    const sortedData = Object.entries(operadorHoras)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const barHeight = 26;
    const chartHeight = Math.max(100, sortedData.length * barHeight);
    const maxVisibleHeight = 380;

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
                        const op = sortedData[idx][0];
                        const qtd = operadorQtd[op] || 0;
                        return [` ${ctx.parsed.x.toFixed(1)}h`, `${qtd} peça(s) concluída(s)`];
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
        labels: sortedData.map(([o]) => o),
        datasets: [{
            label: 'Horas',
            data: sortedData.map(([, h]) => h),
            backgroundColor: sortedData.map((_, i) => COLORS[i % COLORS.length]),
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Produção por Operador</h3>
            <p className="text-sm text-muted mb-4">Horas (Setup+Corte) e peças concluídas por operador no período</p>
            <div
                className="flex-1 min-h-0 overflow-y-auto kanban-scroll"
                style={{ minHeight: 120, maxHeight: maxVisibleHeight }}
            >
                {sortedData.length > 0 ? (
                    <div style={{ height: chartHeight, minWidth: 200 }}>
                        <Bar options={options} data={chartData} />
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-[#7B808F] gap-2 py-8">
                        <p className="font-bold text-sm">Nenhuma produção com operador registrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
