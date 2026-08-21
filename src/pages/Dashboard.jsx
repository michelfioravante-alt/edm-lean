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
            <div className="min-h-full flex flex-col gap-8 w-full pb-12">
                {/* Header com Filtros */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-kanban-amber/10 rounded-xl border border-kanban-amber/20 text-kanban-amber">
                            <LayoutDashboard className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Dashboard Executivo</h2>
                                <span className="hidden sm:inline-block text-[10px] font-black bg-kanban-amber/20 text-kanban-amber border border-kanban-amber/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Gerência
                                </span>
                            </div>
                            <p className="text-slate-400 mt-0.5 text-xs sm:text-sm font-medium">
                                Acompanhamento de indicadores Lean OEE, rentabilidade e lead time.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 md:flex-initial">
                            <Filter className="w-3.5 h-3.5 text-kanban-amber shrink-0" />
                            <select
                                className="bg-transparent text-xs sm:text-sm font-bold text-slate-200 outline-none border-none cursor-pointer w-full"
                                value={periodo}
                                onChange={(e) => setPeriodo(e.target.value)}
                            >
                                <optgroup label="Período atual">
                                    <option value="hoje" className="bg-slate-900 text-white">Hoje</option>
                                    <option value="semana" className="bg-slate-900 text-white">Esta Semana</option>
                                    <option value="mes" className="bg-slate-900 text-white">Este Mês</option>
                                </optgroup>
                                <optgroup label="Meses passados">
                                    {gerarMesesPassados().map(({ value, label }) => (
                                        <option key={value} value={value} className="bg-slate-900 text-white">{label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 md:flex-initial">
                            <Clock className="w-3.5 h-3.5 text-kanban-steel shrink-0" />
                            <select
                                className="bg-transparent text-xs sm:text-sm font-bold text-slate-200 outline-none border-none cursor-pointer w-full"
                                value={turno}
                                onChange={(e) => setTurno(e.target.value)}
                            >
                                <option value="todos" className="bg-slate-900 text-white">Todos os Turnos</option>
                                {configuracoesGlobais?.turnos?.map(t => (
                                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                                        {t.nome} ({t.inicio} - {t.fim})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 1: Métricas de Lean Tracking Tradicional */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-kanban-amber"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Desempenho Operacional & Fluxo Lean
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KpiCard
                            title="Eficiência de Execução"
                            value={`${oeeEfficiency}%`}
                            icon={Zap}
                            trend={parseFloat(oeeEfficiency) > 85 ? "up" : "down"}
                            colorClass={parseFloat(oeeEfficiency) > 85 ? "bg-status-success" : "bg-status-warning"}
                            tooltipContent="Compara o Tempo Planejado (cadastro) vs Tempo Real (cronometrado p/ o Kanban)."
                        />
                        <KpiCard
                            title="Qualidade (FPY)"
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
                            title="Produzidas"
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
                </div>

                {/* SEÇÃO 2: Métricas de Faturamento Financeiro */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Impacto Financeiro & Custos Operacionais
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Faturamento (Só Corte)"
                            value={valorGeradoCorte}
                            icon={DollarSign}
                            colorClass="bg-emerald-500"
                            tooltipContent={`Horas de CORTE (usinagem) das peças aprovadas × R$ ${custoHora}/h. Foco em faturamento por usinagem.`}
                        />
                        <KpiCard
                            title="Valor Total Produzido"
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
                            title="Custo de Tempo Morto"
                            value={valorTempoMorto}
                            icon={PauseCircle}
                            colorClass="bg-amber-500"
                            tooltipContent={`Horas em pausas (histórico das O.S concluídas + pausas ativas) × R$ ${custoHora}/h.`}
                        />
                    </div>
                </div>

                {/* SEÇÃO 3: Gráficos de Produção */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-kanban-steel"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Análise Gráfica & Consumo
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LeadTimeChart concluidas={concluidas} />
                        <QualityPieChart concluidas={concluidas} />
                        <InsumosLifeChart periodo={periodo} />
                        <MachineHoursChart concluidas={concluidas} />
                        <ClientPiecesChart concluidas={concluidas} />
                        <MachineConsumptionChart periodo={periodo} />
                    </div>
                </div>

                {/* SEÇÃO 4: Causa Raiz & Desempenho por Recurso */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-kanban-teal"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Causa Raiz & Desempenho Individual
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <PauseReasonsChart concluidas={concluidas} kanban={kanban} />
                        <RefugoPorMaquinaChart concluidas={concluidas} />
                        <ProducaoPorOperadorChart concluidas={concluidas} />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
