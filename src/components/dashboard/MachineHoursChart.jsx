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
import { useAppStore } from '../../store/useAppStore';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function MachineHoursChart({ concluidas = [] }) {
    // Agregador de Horas por Máquina
    const rankingMaquinas = {};

    concluidas.forEach(os => {
        const maquinaName = os.maquina_nome || os.maquina;
        if (!maquinaName) return;

        const realSetup = (os.tempos_fases?.setup || os.temposFases?.setup || 0);
        const realCorte = (os.tempos_fases?.emCorte || os.temposFases?.emCorte || 0);
        const totalH = realSetup + realCorte;

        if (!rankingMaquinas[maquinaName]) {
            rankingMaquinas[maquinaName] = 0;
        }
        rankingMaquinas[maquinaName] += totalH;
    });

    // Converter para array e ordenar (maiores primeiro)
    const sortedData = Object.entries(rankingMaquinas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7); // Top 7 máquinas

    const options = {
        indexAxis: 'y', // Grafico de Barras Horizontais
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Não precisa de legenda, cor única
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.x.toFixed(1)}h (Setup + Corte)`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: '#e2e8f0',
                },
                ticks: {
                    callback: function (value) {
                        return value + 'h';
                    }
                }
            },
            y: {
                grid: {
                    display: false,
                }
            }
        }
    };

    const chartData = {
        labels: sortedData.map(item => item[0]),
        datasets: [
            {
                label: 'Horas reais',
                data: sortedData.map(item => item[1]),
                backgroundColor: '#f59e0b', // amber-500
                borderRadius: 4,
            }
        ],
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Ranking: Horas por Máquina</h3>
            <p className="text-sm text-muted mb-4">Total de horas reais (Setup + Corte) acumuladas em cada equipamento no período.</p>
            <div className="flex-1 min-h-0">
                {sortedData.length > 0 ? (
                    <Bar options={options} data={chartData} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7B808F]">
                        <p>Aguardando aferição de novas peças.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
