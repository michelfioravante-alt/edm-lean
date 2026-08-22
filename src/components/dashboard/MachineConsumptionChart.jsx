import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAppStore } from '../../store/useAppStore';
import { isSameMonth, isSameWeek, isToday, parseISO } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend);

// Resolve o nome da máquina a partir do ID (evita mostrar UUID na legenda)
function getNomeMaquina(maquinas, maquinaId) {
    if (!maquinaId) return 'Máquina não informada';
    const maq = maquinas.find(m => m.id === maquinaId);
    return maq ? maq.nome : 'Máquina removida';
}

export default function MachineConsumptionChart({ periodo }) {
    const { historicoConsumiveis, maquinas } = useAppStore();

    const logsFiltrados = useMemo(() => {
        if (!periodo) return historicoConsumiveis;

        const now = new Date();

        return historicoConsumiveis.filter(log => {
            const dt = log.dataInstalacao || log.data_instalacao;
            if (!dt) return false;
            const parsed = parseISO(dt);
            if (isNaN(parsed)) return false;

            if (periodo === 'mes') return isSameMonth(parsed, now);
            if (periodo === 'semana') return isSameWeek(parsed, now);
            if (periodo === 'hoje') return isToday(parsed);
            if (/^\d{4}-\d{2}$/.test(periodo)) {
                const [y, m] = periodo.split('-').map(Number);
                return isSameMonth(parsed, new Date(y, m - 1, 1));
            }

            return true;
        });
    }, [historicoConsumiveis, periodo]);

    // Contabiliza quantas TROCAS de insumo (ex.: troca de fio) foram feitas por máquina
    const trocasPorMaquinaId = {};
    let totalTrocas = 0;

    logsFiltrados.forEach(log => {
        const id = log.maquinaId || log.maquina_id;
        if (!id) return;
        trocasPorMaquinaId[id] = (trocasPorMaquinaId[id] || 0) + 1;
        totalTrocas += 1;
    });

    // Ordena do maior para o menor e monta labels com NOME da máquina
    const sortedData = Object.entries(trocasPorMaquinaId)
        .sort((a, b) => b[1] - a[1])
        .map(([maquinaId, qtd]) => [getNomeMaquina(maquinas || [], maquinaId), qtd]);

    const data = {
        labels: sortedData.map(([nome]) => nome),
        datasets: [
            {
                data: sortedData.map(([, qtd]) => qtd),
                backgroundColor: [
                    '#D97D3D', '#4A9D74', '#C85558', '#C99A4A', '#7B808F', '#8A5A38'
                ],
                borderWidth: 0,
                hoverOffset: 15,
                borderRadius: 4,
                spacing: 5
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,
                    color: '#94a3b8',
                    font: { size: 12, weight: '600' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleFont: { size: 13, weight: 'bold' },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    title: (items) => items[0]?.label || 'Máquina',
                    label: (context) => {
                        const value = context.parsed;
                        const pct = totalTrocas > 0 ? ((value / totalTrocas) * 100).toFixed(1) : 0;
                        return ` ${value} troca${value !== 1 ? 's' : ''} de insumo (${pct}% do total)`;
                    }
                }
            }
        },
        animation: { animateRotate: true, animateScale: true, duration: 800 }
    };

    const maiorConsumo = sortedData[0];

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge h-[350px] flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                    <h3 className="text-lg font-bold text-core">Troca de Insumos por Máquina</h3>
                    <p className="text-sm text-muted mt-0.5">
                        Quantidade de trocas registradas em cada equipamento.
                    </p>
                </div>
            </div>

            <div className="flex-1 relative min-h-0 flex items-center justify-center">
                {totalTrocas > 0 ? (
                    <>
                        <Doughnut data={data} options={options} />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none pr-[90px]">
                            <span className="text-3xl font-semibold text-white">{totalTrocas}</span>
                            <span className="text-[10px] font-bold text-[#565B68] uppercase tracking-widest text-center max-w-[90px] leading-tight">
                                Total de trocas
                            </span>
                            {maiorConsumo && (
                                <span className="text-[9px] text-[#565B68] mt-1 text-center max-w-[90px]">
                                    Mais trocas: {maiorConsumo[0]}
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-muted text-sm text-center px-4">
                        <p className="font-medium">
                            {periodo ? 'Nenhuma troca no período selecionado.' : 'Nenhuma troca de insumo registrada.'}
                        </p>
                        <p className="text-xs mt-1">Registre trocas no painel de Estoque para ver o gráfico.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
