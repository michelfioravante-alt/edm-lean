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

// Paleta de cores para os diferentes clientes
const COLORS = [
    '#D97D3D',
    '#4A9D74',
    '#C85558',
    '#C99A4A',
    '#7B808F',
    '#9DA2AE',
    '#8A5A38',
    '#565B68',
];

export default function ClientPiecesChart({ concluidas = [] }) {
    // Agrupa O.S por cliente e conta quantas peças cada um tem
    const ranking = {};

    concluidas.forEach(os => {
        const cliente = os.cliente?.trim() || 'Não informado';
        ranking[cliente] = (ranking[cliente] || 0) + 1;
    });

    // Ordenar do maior para o menor — top 25 para manter legível com scroll
    const sortedData = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25);

    const values = sortedData.map(([, c]) => c);
    const maxVal = Math.max(...values, 1);
    // Escala mínima 5 para que 1 peça não ocupe a barra inteira
    const xMax = Math.max(maxVal + 1, 5);

    const barHeight = 28;
    const chartHeight = Math.max(120, sortedData.length * barHeight);
    const maxVisibleHeight = 420;

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
                    label: (ctx) => ` ${ctx.parsed.x} ${ctx.parsed.x === 1 ? 'peça' : 'peças'} concluída${ctx.parsed.x === 1 ? '' : 's'}`,
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: xMax,
                ticks: {
                    stepSize: 1,
                    callback: (v) => (Number.isInteger(v) ? v : ''),
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
            },
            y: {
                grid: { display: false },
                ticks: {
                    color: '#94a3b8',
                    font: { weight: 'bold', size: 12 },
                    // Trunca nomes longos para caber no eixo
                    callback: function (val) {
                        const label = this.getLabelForValue(val);
                        return label.length > 18 ? label.slice(0, 17) + '…' : label;
                    }
                }
            }
        }
    };

    const chartData = {
        labels: sortedData.map(([name]) => name),
        datasets: [
            {
                label: 'Peças',
                data: sortedData.map(([, count]) => count),
                backgroundColor: sortedData.map((_, i) => COLORS[i % COLORS.length]),
                borderRadius: 5,
                borderSkipped: false,
            }
        ],
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Peças por Cliente</h3>
            <p className="text-sm text-muted mb-4">Ranking de volume de O.S concluídas por cliente no período selecionado</p>
            <div
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden kanban-scroll"
                style={{ minHeight: 180, maxHeight: maxVisibleHeight }}
            >
                {sortedData.length > 0 ? (
                    <div style={{ height: chartHeight, minWidth: 280 }}>
                        <Bar options={options} data={chartData} />
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-[#7B808F] gap-2 py-12">
                        <p className="font-bold text-sm">Nenhuma peça concluída no período.</p>
                        <p className="text-xs">Ajuste o filtro temporal para ver os dados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
