import React, { useState, useMemo } from 'react';
import KpiCard from '../components/dashboard/KpiCard';
import LeadTimeChart from '../components/dashboard/LeadTimeChart';
import QualityPieChart from '../components/dashboard/QualityPieChart';
import MachineHoursChart from '../components/dashboard/MachineHoursChart';
import { useAppStore } from '../store/useAppStore';
import { Activity, Clock, Zap, Target, Filter, DollarSign, TrendingDown, AlertTriangle, Timer, LayoutDashboard, History, Package, Users, ChevronRight, Search, Download, Factory, Settings, PlayCircle, HelpCircle, PauseCircle } from 'lucide-react';
import { isSameMonth, isSameWeek, isToday, parseISO, differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import InsumosLifeChart from '../components/dashboard/InsumosLifeChart';
import MachineConsumptionChart from '../components/dashboard/MachineConsumptionChart';
import ClientPiecesChart from '../components/dashboard/ClientPiecesChart';
import PauseReasonsChart from '../components/dashboard/PauseReasonsChart';
import RefugoPorMaquinaChart from '../components/dashboard/RefugoPorMaquinaChart';
import ProducaoPorOperadorChart from '../components/dashboard/ProducaoPorOperadorChart';

// Últimos 12 meses para o seletor (valor: YYYY-MM)
function gerarMesesPassados() {
    const meses = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        meses.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: format(d, 'MMMM yyyy', { locale: ptBR })
        });
    }
    return meses;
}

export default function Dashboard() {
    const { kanban, configuracoesGlobais } = useAppStore();
    const custoHora = Number(configuracoesGlobais?.custoHoraMaquina) || 50;

    // Estados dos Filtros
    const [periodo, setPeriodo] = useState('mes'); // 'mes', 'semana', 'hoje'
    const [turno, setTurno] = useState('todos'); // 'todos', 't1', 't2', 't3'

    // Filtragem Master das OS Concluídas
    const filteredConcluidas = useMemo(() => {
        const rawConcluidas = kanban.concluido || [];
        const now = new Date();

        return rawConcluidas.filter(os => {
            // Use Supabase snake_case fields with graceful fallbacks
            const tsRaw = os.timestamp_entrada_concluido || os.timestampEntrada_concluido || os.created_at || os.createdAt;
            const dataBase = (tsRaw && !isNaN(new Date(tsRaw).getTime())) ? parseISO(tsRaw) : new Date();

            // Filtro Temporal
            let matchPeriodo = true;
            if (periodo === 'mes') matchPeriodo = isSameMonth(dataBase, now);
            else if (periodo === 'semana') matchPeriodo = isSameWeek(dataBase, now);
            else if (periodo === 'hoje') matchPeriodo = isToday(dataBase);
            else if (/^\d{4}-\d{2}$/.test(periodo)) {
                const [y, m] = periodo.split('-').map(Number);
                matchPeriodo = isSameMonth(dataBase, new Date(y, m - 1, 1));
            }

            // Filtro de Turno (Dynamic)
            let matchTurno = true;
            if (turno !== 'todos' && configuracoesGlobais?.turnos) {
                const selectedTurnoObj = configuracoesGlobais.turnos.find(t => t.id === turno);
                if (selectedTurnoObj?.inicio && selectedTurnoObj?.fim) {
                    const osHour = dataBase.getHours();
                    const osMinute = dataBase.getMinutes();
                    const osTimeVal = osHour * 60 + osMinute;

                    const [startH, startM] = (selectedTurnoObj.inicio || '00:00').split(':').map(Number);
                    const [endH, endM] = (selectedTurnoObj.fim || '23:59').split(':').map(Number);

                    const startVal = startH * 60 + startM;
                    const endVal = endH * 60 + endM;

                    if (startVal < endVal) {
                        // Turno no mesmo dia (ex: 07:30 as 15:30)
                        matchTurno = osTimeVal >= startVal && osTimeVal < endVal;
                    } else {
                        // Turno vira a noite (ex: 23:30 as 07:30)
                        matchTurno = osTimeVal >= startVal || osTimeVal < endVal;
                    }
                }
            }

            return matchPeriodo && matchTurno;
        });
    }, [kanban.concluido, periodo, turno, configuracoesGlobais?.turnos]);

    // -- Calculators for KPI Top Cards --
    const concluidas = filteredConcluidas;
    const ativas = (kanban.emCorte?.length || 0) + (kanban.setup?.length || 0) + (kanban.afericao?.length || 0);

    // Quality FPY calculation
    const aprovadas = concluidas.filter(o => (o.resultadoAfericao || o.resultado_afericao) === 'Aprovada').length;
    const totalAferidas = concluidas.filter(o => (o.resultadoAfericao || o.resultado_afericao)).length;
    const fpy = totalAferidas > 0 ? ((aprovadas / totalAferidas) * 100).toFixed(1) : '100';

    // Global Efficiency calc & Financial
    let totalRealH = 0;
    let totalPlanH = 0;
    let horasAprovadasCorte = 0;   // Só corte (faturamento por usinagem)
    let horasAprovadasTotais = 0;  // Setup + Corte (custo total do trabalho)
    let horasRefugo = 0;
    let horasPausas = 0;

        concluidas.forEach(os => {
        const setupH = parseInt(os.tempo_estimado_setup_horas || os.tempoEstimadoSetupHoras || 0, 10) || 0;
        const setupM = (parseInt(os.tempo_estimado_setup_minutos || os.tempoEstimadoSetupMinutos || 0, 10) || 0) / 60;
        const corteH = parseInt(os.tempo_estimado_corte_horas || os.tempoEstimadoCorteHoras || 0, 10) || 0;
        const corteM = (parseInt(os.tempo_estimado_corte_minutos || os.tempoEstimadoCorteMinutos || 0, 10) || 0) / 60;
        totalPlanH += (setupH + setupM + corteH + corteM);

        const realSetup = Number(os.tempos_fases?.setup ?? os.temposFases?.setup ?? 0) || 0;
        const realCorte = Number(os.tempos_fases?.emCorte ?? os.temposFases?.emCorte ?? 0) || 0;
        totalRealH += (realSetup + realCorte);

        // Separação de Horas Reais para Financeiro
        const resultAfericao = os.resultado_afericao || os.resultadoAfericao;
        const horasTotais = realSetup + realCorte;
        if (resultAfericao === 'Aprovada') {
            horasAprovadasCorte += realCorte;
            horasAprovadasTotais += horasTotais;
        } else if (resultAfericao === 'Refugo') {
            horasRefugo += horasTotais;
        }

        // Tempo morto (pausas) das O.S concluídas no período
        const pausas = os.historico_pausas || os.historicoPausas || [];
        pausas.forEach(p => { horasPausas += Math.max(0, Number(p.duracaoHoras) || 0); });
    });

    // Pausas ativas (O.S em pausa neste momento)
    const todasAtivasParaPausa = [
        ...(kanban.setup || []),
        ...(kanban.emCorte || []),
        ...(kanban.afericao || [])
    ];
    const agoraMs = Date.now();
    todasAtivasParaPausa.forEach(os => {
        if (os.is_pausado || os.isPausado) {
            const dataPausa = os.data_pausa || os.dataPausa;
            if (dataPausa) {
                const t = new Date(dataPausa).getTime();
                if (!isNaN(t)) horasPausas += Math.max(0, (agoraMs - t) / (1000 * 60 * 60));
            }
        }
    });

    const oeeEfficiency = totalPlanH > 0 ?
        ((totalPlanH / (totalRealH || totalPlanH)) * 100).toFixed(1) : '100';

    const valorGeradoCorte = (horasAprovadasCorte * custoHora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorGeradoTotais = (horasAprovadasTotais * custoHora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorPerdido = (horasRefugo * custoHora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorTempoMorto = (horasPausas * custoHora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- Lead Time Médio ---
    const leadTimesHoras = concluidas
        .map(os => {
            const inicio = os.created_at || os.createdAt;
            const fim = os.timestamp_entrada_concluido || os.timestampEntrada_concluido;
            if (!inicio || !fim) return null;
            return differenceInHours(new Date(fim), new Date(inicio));
        })
        .filter(h => h !== null && h >= 0);
    const leadTimeMedio = leadTimesHoras.length > 0
        ? (leadTimesHoras.reduce((a, b) => a + b, 0) / leadTimesHoras.length)
        : 0;
    const leadTimeMedioStr = leadTimeMedio >= 24
        ? `${(leadTimeMedio / 24).toFixed(1)}d`
        : `${leadTimeMedio.toFixed(1)}h`;

    // --- Peças em Atraso (prazo vencido e não concluída) ---
    const agora = new Date();
    const todasAtivas = [
        ...(kanban.aFazer || []),
        ...(kanban.setup || []),
        ...(kanban.emCorte || []),
        ...(kanban.afericao || [])
    ];
    const emAtraso = todasAtivas.filter(os => {
        const prazo = os.prazo_entrega || os.prazoEntrega;
        return prazo && new Date(prazo) < agora;
    }).length;

    return (
        <ErrorBoundary>
            <div className="min-h-full flex flex-col gap-6 w-full pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-surface2 p-6 rounded-xl border border-edge">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-kanban-amber/10 rounded-xl border border-kanban-amber/20">
                            <LayoutDashboard className="w-8 h-8 text-kanban-amber" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-white">Visão Geral da Produção</h2>
                            <p className="text-slate-400 mt-1 text-base font-medium">Monitore a eficiência de execução baseada no fluxo Kanban.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-bg px-3 py-2 rounded-lg border border-edge">
                            <Filter className="w-4 h-4 text-muted" />
                            <select
                                className="bg-bg text-sm text-core outline-none border-none focus:ring-0 cursor-pointer min-w-[160px] appearance-none pr-4"
                                style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                value={periodo}
                                onChange={(e) => setPeriodo(e.target.value)}
                            >
                                <optgroup label="Período atual">
                                    <option value="hoje" className="bg-bg text-core">Hoje</option>
                                    <option value="semana" className="bg-bg text-core">Esta Semana</option>
                                    <option value="mes" className="bg-bg text-core">Este Mês</option>
                                </optgroup>
                                <optgroup label="Meses passados">
                                    {gerarMesesPassados().map(({ value, label }) => (
                                        <option key={value} value={value} className="bg-bg text-core">{label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-bg px-3 py-2 rounded-lg border border-edge">
                            <Clock className="w-4 h-4 text-muted" />
                            <select
                                className="bg-bg text-sm text-core outline-none border-none focus:ring-0 cursor-pointer w-full appearance-none pr-4"
                                style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                value={turno}
                                onChange={(e) => setTurno(e.target.value)}
                            >
                                <option value="todos" className="bg-bg text-core">Todos os Turnos</option>
                                {configuracoesGlobais?.turnos?.map(t => (
                                    <option key={t.id} value={t.id} className="bg-bg text-core">
                                        {t.nome} ({t.inicio} - {t.fim})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Linha 1: Métricas de Lean Tracking Tradicional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <KpiCard
                        title="Eficiência de Execução"
                        value={`${oeeEfficiency}%`}
                        icon={Zap}
                        trend={parseFloat(oeeEfficiency) > 85 ? "up" : "down"}
                        colorClass={parseFloat(oeeEfficiency) > 85 ? "bg-status-success" : "bg-status-warning"}
                        tooltipContent="Compara o Tempo Planejado (cadastro) vs Tempo Real (cronometrado p/ o Kanban)."
                    />
                    <KpiCard
                        title="Peças FPY (Qualidade)"
                        value={`${fpy}%`}
                        icon={Target}
                        colorClass="bg-cyan-600"
                        trend="up"
                        tooltipContent="First Pass Yield: Porcentagem de peças totalmente aprovadas na CMM contra desvios de refugo."
                    />
                    <KpiCard
                        title="Lead Time Médio"
                        value={leadTimesHoras.length > 0 ? leadTimeMedioStr : '--'}
                        icon={Timer}
                        colorClass="bg-violet-600"
                        tooltipContent="Tempo médio desde a abertura da O.S até a conclusão (Data Criação → Concluído)."
                    />
                    <KpiCard
                        title="Fila WIP (Ativas)"
                        value={ativas.toString()}
                        icon={Activity}
                        colorClass="bg-blue-600"
                        tooltipContent="Carga de Work in Progress: O.Ss que ainda estão rodando nas máquinas e SETUP."
                    />
                    <KpiCard
                        title="Produzidas (Período)"
                        value={concluidas.length.toString()}
                        icon={Clock}
                        colorClass="bg-emerald-600"
                        tooltipContent="Volume total de Peças dadas como Concluídas para o bloco temporal selecionado no filtro."
                    />
                    <KpiCard
                        title="Em Atraso"
                        value={emAtraso.toString()}
                        icon={AlertTriangle}
                        colorClass={emAtraso > 0 ? "bg-red-600" : "bg-slate-600"}
                        trend={emAtraso > 0 ? "down" : null}
                        tooltipContent="Peças ativas que já passaram do prazo de entrega sem serem concluídas."
                    />
                </div>

                {/* Linha 2: Métricas de Faturamento Financeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <KpiCard
                        title="Valor Gerado (Só Corte)"
                        value={valorGeradoCorte}
                        icon={DollarSign}
                        colorClass="bg-emerald-500"
                        tooltipContent={`Horas de CORTE (usinagem) das peças aprovadas × R$ ${custoHora}/h. Foco em faturamento por usinagem — setup não entra.`}
                    />
                    <KpiCard
                        title="Valor Gerado (Setup+Corte)"
                        value={valorGeradoTotais}
                        icon={DollarSign}
                        colorClass="bg-emerald-600"
                        tooltipContent={`Horas de Setup + Corte das peças aprovadas × R$ ${custoHora}/h. Custo total do trabalho aprovado.`}
                    />
                    <KpiCard
                        title="Perda por Refugo"
                        value={valorPerdido}
                        icon={TrendingDown}
                        colorClass="bg-red-500"
                        tooltipContent={`Setup + Corte desperdiçados em peças refugadas na CMM. Custo base: R$ ${custoHora}/h.`}
                    />
                    <KpiCard
                        title="Custo de Tempo Morto (Pausas)"
                        value={valorTempoMorto}
                        icon={PauseCircle}
                        colorClass="bg-amber-500"
                        tooltipContent={`Horas em pausas (histórico das O.S concluídas + pausas ativas) × R$ ${custoHora}/h. Dinheiro perdido para paradas.`}
                    />
                </div>

                {/* Linha 3: Gráficos principais — grid 2 colunas, fluxo contínuo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LeadTimeChart concluidas={concluidas} />
                    <QualityPieChart concluidas={concluidas} />
                    <InsumosLifeChart periodo={periodo} />
                    <MachineHoursChart concluidas={concluidas} />
                    <ClientPiecesChart concluidas={concluidas} />
                    <MachineConsumptionChart periodo={periodo} />
                </div>

                {/* Linha 4: Análises de Causa Raiz e Desempenho */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <PauseReasonsChart concluidas={concluidas} kanban={kanban} />
                    <RefugoPorMaquinaChart concluidas={concluidas} />
                    <ProducaoPorOperadorChart concluidas={concluidas} />
                </div>
            </div>
        </ErrorBoundary>
    );
}
