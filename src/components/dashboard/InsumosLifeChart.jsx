import React, { useMemo } from 'react';
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
import { isSameMonth, isSameWeek, isToday, parseISO } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function InsumosLifeChart({ periodo }) {
    const { historicoConsumiveis, kanban } = useAppStore();

    // Filtra apenas insumos que já foram trocados (dataFim existe), ou seja, completaram seu ciclo de vida
    const logsConcluidos = useMemo(() => {
        const base = historicoConsumiveis.filter(log => log.dataFim);
        if (!periodo) return base;

        const now = new Date();
        return base.filter(log => {
            const dtStr = log.dataFim;
            if (!dtStr) return false;
            const dt = parseISO(dtStr);
            if (isNaN(dt)) return false;

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

    // Dicionário para acumular as Horas-Máquina (Em Corte) ou Horas Corridas que o item durou
    const lifeByItem = {};

    logsConcluidos.forEach(log => {
        // Encontra as O.S concluídas na mesma máquina deste insumo
        const osDaMaquina = (kanban.concluido || []).filter(os => os.maquina === log.maquinaId);
        let horasCorteReais = 0;

        // Verifica quais dessas O.S efetivamente realizaram "Corte" dentro da janela de vida deste insumo
        osDaMaquina.forEach(os => {
            const dataFimCorteStr = os.timestampEntrada_afericao || os.timestampEntrada_concluido;
            if (dataFimCorteStr) {
                const fimCorteMs = new Date(dataFimCorteStr).getTime();
                const startInsumoMs = new Date(log.dataInstalacao).getTime();
                const endInsumoMs = new Date(log.dataFim).getTime();

                // Se a OS terminou de cortar enquanto o insumo tava instalado, soma as "horas de faísca"
                if (fimCorteMs >= startInsumoMs && fimCorteMs <= endInsumoMs) {
                    horasCorteReais += (os.temposFases?.emCorte || 0);
                }
            }
        });

        // Caso a máquina não tenha OS concluídas (testes ou dados rasos), faz fallback para a vida cronológica líquida total
        if (horasCorteReais === 0) {
            const diffMs = new Date(log.dataFim) - new Date(log.dataInstalacao);
            horasCorteReais = Math.max(0, diffMs / (1000 * 60 * 60));
        }

        if (!lifeByItem[log.itemNome]) {
            lifeByItem[log.itemNome] = { acumulado: 0, count: 0 };
        }
        lifeByItem[log.itemNome].acumulado += horasCorteReais;
        lifeByItem[log.itemNome].count += 1;
    });

    // Calcula a média de vida útil para cada tipo de insumo (Nome)
    const sortedData = Object.entries(lifeByItem)
        .map(([nome, obj]) => ({
            nome,
            avgHoras: obj.count > 0 ? (obj.acumulado / obj.count) : 0
        }))
        .sort((a, b) => b.avgHoras - a.avgHoras)
        .slice(0, 10); // Exibe os 10 mais relevantes

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                bodyFont: { size: 12, family: "'Inter', sans-serif" },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                labels: {
                    label: function (context) {
                        return `Rendimento Real: ${context.parsed.y.toFixed(1)}h de corte`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: {
                    color: 'rgba(51, 65, 85, 0.3)',
                    drawTicks: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 'bold' },
                    callback: function (value) { return value + 'h'; }
                }
            },
            x: {
                border: { display: false },
                grid: { display: false },
                ticks: {
                    color: '#cbd5e1',
                    font: { size: 11, weight: 'bold' }
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    };

    const chartData = {
        labels: sortedData.map(item => item.nome),
        datasets: [
            {
                label: 'Horas Reais',
                data: sortedData.map(item => item.avgHoras),
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, '#06b6d4'); // Cyan
                    gradient.addColorStop(1, '#3b82f6'); // Blue
                    return gradient;
                },
                borderRadius: 6,
                hoverBackgroundColor: '#22d3ee',
            }
        ],
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge h-[350px] flex flex-col">
            <h3 className="text-lg font-bold text-core mb-1">Rendimento de Consumíveis (Horas de Faísca)</h3>
            <p className="text-sm text-muted mb-4">Média de horas que cada item suportou efetivamente **Em Corte** antes da troca.</p>
            <div className="flex-1 min-h-0">
                {sortedData.length > 0 ? (
                    <Bar options={options} data={chartData} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted text-sm text-center px-4">
                        <p>Nenhum insumo finalizou seu clico de vida ainda.</p>
                        <p className="mt-1">Troque/Finalize um insumo no painel ao lado para gerar o gráfico.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
