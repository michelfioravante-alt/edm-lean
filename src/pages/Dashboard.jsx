import React, { useState, useMemo } from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import KpiCard from '../components/dashboard/KpiCard';
import LeadTimeChart from '../components/dashboard/LeadTimeChart';
import QualityPieChart from '../components/dashboard/QualityPieChart';
import MachineHoursChart from '../components/dashboard/MachineHoursChart';
import InsumosLifeChart from '../components/dashboard/InsumosLifeChart';
import ClientPiecesChart from '../components/dashboard/ClientPiecesChart';
import MachineConsumptionChart from '../components/dashboard/MachineConsumptionChart';
import PauseReasonsChart from '../components/dashboard/PauseReasonsChart';
import RefugoPorMaquinaChart from '../components/dashboard/RefugoPorMaquinaChart';
import ProducaoPorOperadorChart from '../components/dashboard/ProducaoPorOperadorChart';



import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
    Activity, Clock, Zap, Target, Filter, DollarSign, TrendingDown, TrendingUp,
    AlertTriangle, Timer, LayoutDashboard, PauseCircle, Cpu, Cog, Factory, Lock, RotateCw 
} from 'lucide-react';

export default function Dashboard() {
    const { kanban, configuracoesGlobais, activeSector } = useAppStore();
    const { role, setorPadrao } = useAuthStore();
    const custoHoraPadrao = Number(configuracoesGlobais?.custoHoraMaquina) || 50;
    const custoHoraCnc = Number(configuracoesGlobais?.custoHoraCnc) || 80;
    const custoHoraEdm = Number(configuracoesGlobais?.custoHoraEdm) || 120;

    const getCustoHoraOS = (osSetor) => {
        if (osSetor === 'CNC') return custoHoraCnc;
        if (osSetor === 'EDM_FIO') return custoHoraEdm;
        return custoHoraPadrao;
    };

    const isProgrammerLocked = role !== 'admin';
    const initialSector = isProgrammerLocked ? ((setorPadrao && setorPadrao !== 'TODOS') ? setorPadrao : 'CNC') : (activeSector || 'TODOS');

    // Estados dos Filtros
    const [periodo, setPeriodo] = useState('mes'); // 'mes', 'semana', 'hoje'
    const [turno, setTurno] = useState('todos'); // 'todos', 't1', 't2', 't3'
    const [setorFilter, setSetorFilter] = useState(initialSector);

    const gerarMesesPassados = () => {
        const meses = [];
        const d = new Date();
        for (let i = 1; i <= 6; i++) {
            const dataRef = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const y = dataRef.getFullYear();
            const m = String(dataRef.getMonth() + 1).padStart(2, '0');
            const nomeMes = dataRef.toLocaleString('pt-BR', { month: 'short' });
            const label = `${nomeMes.toUpperCase()}/${y}`;
            meses.push({ value: `${y}-${m}`, label });
        }
        return meses;
    };



    // Filtragem Master das OS Concluídas
    const filteredConcluidas = useMemo(() => {
        const rawConcluidas = kanban.concluido || [];
        const now = new Date();

        return rawConcluidas.filter(os => {
            // Filtro por Setor
            if (setorFilter !== 'TODOS') {
                const osSetor = os.setor || os.tipo_processo || 'CNC';
                if (osSetor !== setorFilter) return false;
            }

            // Data base para período
            const tsRaw = os.timestamp_entrada_concluido || os.timestampEntrada_concluido || os.created_at || os.createdAt;
            const dataBase = (tsRaw && !isNaN(new Date(tsRaw).getTime())) ? new Date(tsRaw) : new Date();

            // Filtro Temporal
            let matchPeriodo = true;
            if (periodo === 'mes') matchPeriodo = dataBase.getFullYear() === now.getFullYear() && dataBase.getMonth() === now.getMonth();
            else if (periodo === 'semana') {
                const diffTime = Math.abs(now.getTime() - dataBase.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchPeriodo = diffDays <= 7;
            }
            else if (periodo === 'hoje') matchPeriodo = dataBase.toDateString() === now.toDateString();
            else if (/^\d{4}-\d{2}$/.test(periodo)) {
                const [y, m] = periodo.split('-').map(Number);
                matchPeriodo = dataBase.getFullYear() === y && dataBase.getMonth() === (m - 1);
            }


            // Filtro de Turno
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
                        matchTurno = osTimeVal >= startVal && osTimeVal < endVal;
                    } else {
                        matchTurno = osTimeVal >= startVal || osTimeVal < endVal;
                    }
                }
            }

            return matchPeriodo && matchTurno;
        });
    }, [kanban.concluido, periodo, turno, setorFilter, configuracoesGlobais?.turnos]);

    // -- Calculators for KPI Top Cards --
    const concluidas = filteredConcluidas;

    // Filtrar O.S. ativas pelo setor selecionado
    const todasAtivasFiltradas = useMemo(() => {
        const rawAtivas = [
            ...(kanban.aFazer || []),
            ...(kanban.setup || []),
            ...(kanban.emCorte || []),
            ...(kanban.afericao || [])
        ];
        if (setorFilter === 'TODOS') return rawAtivas;
        return rawAtivas.filter(os => (os.setor || os.tipo_processo || 'CNC') === setorFilter);
    }, [kanban, setorFilter]);

    const ativasCount = todasAtivasFiltradas.length;

    // Quality FPY calculation
    const aprovadas = concluidas.filter(o => (o.resultadoAfericao || o.resultado_afericao) === 'Aprovada').length;
    const totalAferidas = concluidas.filter(o => (o.resultadoAfericao || o.resultado_afericao)).length;
    const fpy = totalAferidas > 0 ? ((aprovadas / totalAferidas) * 100).toFixed(1) : '100';

    // Global Efficiency calc & Financial
    let totalRealH = 0;
    let totalPlanH = 0;
    let totalValorCorte = 0;
    let totalValorTrabalho = 0;
    let totalValorPerdidoRefugo = 0;
    let totalValorTempoMorto = 0;

    concluidas.forEach(os => {
        const osSetor = os.setor || os.tipo_processo || (setorFilter !== 'TODOS' ? setorFilter : 'CNC');
        const osRate = getCustoHoraOS(osSetor);

        const setupH = parseInt(os.tempo_estimado_setup_horas || os.tempoEstimadoSetupHoras || 0, 10) || 0;
        const setupM = (parseInt(os.tempo_estimado_setup_minutos || os.tempoEstimadoSetupMinutos || 0, 10) || 0) / 60;
        const corteH = parseInt(os.tempo_estimado_corte_horas || os.tempoEstimadoCorteHoras || 0, 10) || 0;
        const corteM = (parseInt(os.tempo_estimado_corte_minutos || os.tempoEstimadoCorteMinutos || 0, 10) || 0) / 60;
        totalPlanH += (setupH + setupM + corteH + corteM);

        const realSetup = Number(os.tempos_fases?.setup ?? os.temposFases?.setup ?? 0) || 0;
        const realCorte = Number(os.tempos_fases?.emCorte ?? os.temposFases?.emCorte ?? 0) || 0;
        totalRealH += (realSetup + realCorte);

        const resultAfericao = os.resultado_afericao || os.resultadoAfericao;
        const horasTotais = realSetup + realCorte;

        if (resultAfericao === 'Aprovada') {
            totalValorCorte += (realCorte * osRate);
            totalValorTrabalho += (horasTotais * osRate);
        } else if (resultAfericao === 'Refugo') {
            totalValorPerdidoRefugo += (horasTotais * osRate);
        } else {
            // OS concluída sem resultado de aferição: conta no trabalho realizado
            // (operador pode ter concluído sem passar pela etapa de aferição)
            totalValorTrabalho += (horasTotais * osRate);
        }

        const pausas = os.historico_pausas || os.historicoPausas || [];
        pausas.forEach(p => {
            const d = Math.max(0, Number(p.duracaoHoras) || 0);
            totalValorTempoMorto += (d * osRate);
        });
    });

    // Pausas ativas
    const agoraMs = Date.now();
    todasAtivasFiltradas.forEach(os => {
        if (os.is_pausado || os.isPausado) {
            const dataPausa = os.data_pausa || os.dataPausa;
            if (dataPausa) {
                const t = new Date(dataPausa).getTime();
                if (!isNaN(t)) {
                    const durH = Math.max(0, (agoraMs - t) / (1000 * 60 * 60));
                    const osSetor = os.setor || os.tipo_processo || (setorFilter !== 'TODOS' ? setorFilter : 'CNC');
                    totalValorTempoMorto += (durH * getCustoHoraOS(osSetor));
                }
            }
        }
    });

    // OEE = Tempo Real Produtivo / Tempo Planejado × 100
    // Valor > 100% significa que a OS foi executada mais rápido que o estimado (positivo)
    const oeeRaw = totalPlanH > 0 ? ((totalRealH / totalPlanH) * 100) : 100;
    const oeeEfficiency = Math.min(oeeRaw, 999).toFixed(1); // sem teto artificial — pode ser >100% se mais eficiente que estimado

    const valorGeradoCorte = totalValorCorte.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorGeradoTotais = totalValorTrabalho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorPerdido = totalValorPerdidoRefugo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorTempoMorto = totalValorTempoMorto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- Lead Time Médio ---
    const leadTimesHoras = concluidas
        .map(os => {
            const inicio = os.created_at || os.createdAt;
            const fim = os.timestamp_entrada_concluido || os.timestampEntrada_concluido;
            return Math.max(0, Math.round((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60)));
        })

        .filter(h => h !== null && h >= 0);
    const leadTimeMedio = leadTimesHoras.length > 0
        ? (leadTimesHoras.reduce((a, b) => a + b, 0) / leadTimesHoras.length)
        : 0;
    const leadTimeMedioStr = leadTimeMedio >= 24
        ? `${(leadTimeMedio / 24).toFixed(1)}d`
        : `${leadTimeMedio.toFixed(1)}h`;

    // --- Peças em Atraso ---
    const agora = new Date();
    const emAtraso = todasAtivasFiltradas.filter(os => {
        const prazo = os.prazo_entrega || os.prazoEntrega;
        return prazo && new Date(prazo) < agora;
    }).length;

    return (
        <ErrorBoundary>
            <div className="min-h-full flex flex-col gap-6 w-full pb-8">
                
                {/* HEADER COM FILTROS (SETOR, PERÍODO, TURNO) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                            <LayoutDashboard className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white">Indicadores de Produção (MES & OEE)</h2>
                            <p className="text-slate-400 mt-0.5 text-sm font-medium">
                                Análise de performance por setor produtivo (CNC, Eletroerosão a Fio e Tornos).
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        
                        {/* FILTRO DE SETOR PRODUTIVO */}
                        {isProgrammerLocked ? (
                            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200 shadow-inner">
                                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>KPIs Exclusivos: {setorFilter === 'EDM_FIO' ? '⚡ Eletroerosão a Fio' : setorFilter === 'TORNO' ? '⚙️ Torno CNC' : '🌀 Centro de Usinagem CNC'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 min-w-[200px]">
                                <Factory className="w-4 h-4 text-amber-400 shrink-0" />
                                <select
                                    className="bg-slate-950 text-sm text-white font-bold outline-none border-none focus:ring-0 cursor-pointer w-full appearance-none pr-4"
                                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                    value={setorFilter}
                                    onChange={(e) => setSetorFilter(e.target.value)}
                                >
                                    <option value="TODOS" className="bg-slate-900 text-white font-bold">🏭 Toda a Fábrica</option>
                                    <option value="CNC" className="bg-slate-900 text-cyan-400 font-bold">🌀 Centro de Usinagem CNC</option>
                                    <option value="EDM_FIO" className="bg-slate-900 text-emerald-400 font-bold">⚡ Eletroerosão a Fio (EDM)</option>
                                    <option value="TORNO" className="bg-slate-900 text-amber-400 font-bold">⚙️ Torno CNC</option>
                                </select>
                            </div>
                        )}


                        {/* FILTRO TEMPORAL */}
                        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                                className="bg-slate-950 text-sm text-white font-bold outline-none border-none focus:ring-0 cursor-pointer min-w-[140px] appearance-none pr-4"
                                style={{ WebkitAppearance: 'none', appearance: 'none' }}
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

                        {/* FILTRO DE TURNO */}
                        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                                className="bg-slate-950 text-sm text-white font-bold outline-none border-none focus:ring-0 cursor-pointer w-full appearance-none pr-4"
                                style={{ WebkitAppearance: 'none', appearance: 'none' }}
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

                {/* HEADER DE KPIs ADAPTADO AO PERFIL */}
                {(() => {
                    const isGerente = role === 'admin' && setorFilter === 'TODOS';
                    const isCncProg = setorFilter === 'CNC';
                    const isEdmProg = setorFilter === 'EDM_FIO';

                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    {isGerente && <span className="text-amber-400">👑 Visão Executiva & Financeira (Diretoria)</span>}
                                    {isCncProg && <span className="text-cyan-400">🌀 KPIs Técnicos — Centro de Usinagem CNC</span>}
                                    {isEdmProg && <span className="text-emerald-400">⚡ KPIs Técnicos — Eletroerosão a Fio (EDM)</span>}
                                    {!isGerente && !isCncProg && !isEdmProg && <span className="text-slate-300">📊 Indicadores Gerais da Fábrica</span>}
                                </h3>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                                    {isGerente ? 'Foco: Retorno Financeiro & OEE Global' : 'Foco: OEE, FPY & Tempos de Ciclo'}
                                </span>
                            </div>

                            {/* Linha 1: Métricas Principais (Adaptadas ao perfil) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <KpiCard
                                    title={isEdmProg ? "OEE Eletroerosão Fio" : isCncProg ? "OEE Usinagem CNC" : "Eficiência OEE Global"}
                                    value={`${oeeEfficiency}%`}
                                    icon={Zap}
                                    trend={parseFloat(oeeEfficiency) > 85 ? "up" : "down"}
                                    colorClass={parseFloat(oeeEfficiency) > 85 ? "bg-emerald-600" : "bg-amber-600"}
                                    tooltipContent="Compara o Tempo Planejado (cadastro) vs Tempo Real (cronometrado no Kanban)."
                                />
                                <KpiCard
                                    title={isEdmProg ? "FPY Precisão Fio" : isCncProg ? "FPY 1ª Usinagem" : "Peças Aprovadas FPY"}
                                    value={`${fpy}%`}
                                    icon={Target}
                                    colorClass="bg-cyan-600"
                                    trend="up"
                                    tooltipContent="First Pass Yield: Porcentagem de peças totalmente aprovadas na inspeção dimensional."
                                />
                                <KpiCard
                                    title="Lead Time Médio"
                                    value={leadTimesHoras.length > 0 ? leadTimeMedioStr : '--'}
                                    icon={Timer}
                                    colorClass="bg-violet-600"
                                    tooltipContent="Tempo médio desde a abertura da O.S até a conclusão final."
                                />
                                <KpiCard
                                    title={isEdmProg ? "Carga WIP (EDM Fio)" : isCncProg ? "Carga WIP (CNC)" : "Fila WIP (Ativas)"}
                                    value={ativasCount.toString()}
                                    icon={Activity}
                                    colorClass="bg-blue-600"
                                    tooltipContent="Quantidade de Ordens de Serviço atualmente ativas no setor."
                                />
                                <KpiCard
                                    title="Concluídas (Período)"
                                    value={concluidas.length.toString()}
                                    icon={Clock}
                                    colorClass="bg-emerald-600"
                                    tooltipContent="Volume total de Peças dadas como Concluídas para o setor e período selecionados."
                                />
                                <KpiCard
                                    title="O.S em Atraso"
                                    value={emAtraso.toString()}
                                    icon={AlertTriangle}
                                    colorClass={emAtraso > 0 ? "bg-red-600" : "bg-slate-700"}
                                    trend={emAtraso > 0 ? "down" : null}
                                    tooltipContent="Peças ativas que passaram do prazo prometido de entrega."
                                />
                            </div>

                            {/* Linha 2: Métricas Financeiras / Custo Operacional */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <KpiCard
                                    title={isEdmProg ? "Valor Corte de Fio" : isCncProg ? "Valor Usinagem CNC" : "Valor Usinagem / Ciclo"}
                                    value={valorGeradoCorte}
                                    icon={DollarSign}
                                    colorClass="bg-emerald-500"
                                    tooltipContent={`Horas de usinagem/corte × taxa horária do setor (CNC: R$ ${custoHoraCnc}/h | Fio: R$ ${custoHoraEdm}/h).`}
                                />
                                <KpiCard
                                    title="Valor Trabalho Total"
                                    value={valorGeradoTotais}
                                    icon={DollarSign}
                                    colorClass="bg-emerald-600"
                                    tooltipContent={`Horas de Setup + Ciclo das peças aprovadas × taxa horária específica do setor.`}
                                />
                                <KpiCard
                                    title="Perda por Refugo"
                                    value={valorPerdido}
                                    icon={TrendingDown}
                                    colorClass="bg-red-500"
                                    tooltipContent={`Horas desperdiçadas em peças refugadas × taxa horária do setor correspondente.`}
                                />
                                <KpiCard
                                    title="Custo de Pausas / Tempo Morto"
                                    value={valorTempoMorto}
                                    icon={PauseCircle}
                                    colorClass="bg-amber-500"
                                    tooltipContent={`Horas em pausas acumuladas × taxa horária do setor produtivo.`}
                                />
                            </div>

                            {/* COMPARATIVO EXECUTIVO POR SETOR (Aparece na Visão Geral Fábrica / Gerente) */}
                            {setorFilter === 'TODOS' && (() => {
                                const rawConcluidas = kanban.concluido || [];

                                const calcularMetricasSetor = (setorId, rateDefault) => {
                                    const rate = Number(
                                        setorId === 'CNC' ? custoHoraCnc :
                                        setorId === 'EDM_FIO' ? custoHoraEdm :
                                        custoHoraPadrao
                                    ) || rateDefault;

                                    const osDoSetor = rawConcluidas.filter(o => {
                                        const s = o.setor || o.tipo_processo || 'CNC';
                                        return s === setorId;
                                    });

                                    let planH = 0;
                                    let realH = 0;
                                    let aprovadasCount = 0;
                                    let aferidasCount = 0;
                                    let valorFaturamento = 0;
                                    let valorPausas = 0;

                                    osDoSetor.forEach(os => {
                                        const sH = parseInt(os.tempo_estimado_setup_horas || os.tempoEstimadoSetupHoras || 0, 10) || 0;
                                        const sM = (parseInt(os.tempo_estimado_setup_minutos || os.tempoEstimadoSetupMinutos || 0, 10) || 0) / 60;
                                        const cH = parseInt(os.tempo_estimado_corte_horas || os.tempoEstimadoCorteHoras || 0, 10) || 0;
                                        const cM = (parseInt(os.tempo_estimado_corte_minutos || os.tempoEstimadoCorteMinutos || 0, 10) || 0) / 60;
                                        planH += (sH + sM + cH + cM);

                                        const rSetup = Number(os.tempos_fases?.setup ?? os.temposFases?.setup ?? 0) || 0;
                                        const rCorte = Number(os.tempos_fases?.emCorte ?? os.temposFases?.emCorte ?? 0) || 0;
                                        realH += (rSetup + rCorte);

                                        const res = os.resultado_afericao || os.resultadoAfericao;
                                        if (res) {
                                            aferidasCount++;
                                            if (res === 'Aprovada') {
                                                aprovadasCount++;
                                                valorFaturamento += ((rSetup + rCorte) * rate);
                                            }
                                        }

                                        const pausas = os.historico_pausas || os.historicoPausas || [];
                                        pausas.forEach(p => {
                                            valorPausas += (Number(p.duracaoHoras || 0) * rate);
                                        });
                                    });

                                    const oee = planH > 0 ? Math.min(100, Math.round((planH / (realH || planH)) * 100)) : 100;
                                    const fpy = aferidasCount > 0 ? Math.round((aprovadasCount / aferidasCount) * 100) : 100;

                                    return {
                                        concluidasCount: osDoSetor.length,
                                        planH: planH.toFixed(1),
                                        realH: realH.toFixed(1),
                                        oee,
                                        fpy,
                                        valorFaturamento: valorFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                        valorPausas: valorPausas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                    };
                                };

                                const cncStats = calcularMetricasSetor('CNC', 90);
                                const edmStats = calcularMetricasSetor('EDM_FIO', 130);
                                const tornoStats = calcularMetricasSetor('TORNO', 80);

                                return (
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-amber-400" />
                                                    Comparativo Executivo de Eficiência por Setor
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    Desempenho comparado entre Usinagem CNC, Eletroerosão a Fio e Torno CNC
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* CNC Card */}
                                            <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                                        <Cpu className="w-4 h-4" /> Centro de Usinagem CNC
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                                                        R$ {custoHoraCnc}/h
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline justify-between pt-1">
                                                    <div>
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Eficiência OEE</span>
                                                        <span className="text-3xl font-black text-white">{cncStats.oee}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Faturamento</span>
                                                        <span className="text-base font-extrabold text-cyan-400">{cncStats.valorFaturamento}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${cncStats.oee}%` }}></div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-900">
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Peças Concluídas:</span>
                                                        <strong className="text-slate-200">{cncStats.concluidasCount} peças</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Aprovação FPY:</span>
                                                        <strong className="text-emerald-400">{cncStats.fpy}%</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Horas Usinadas:</span>
                                                        <strong className="text-slate-200">{cncStats.realH}h</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Custo Pausas:</span>
                                                        <strong className="text-amber-400">{cncStats.valorPausas}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* EDM Card */}
                                            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                        <Zap className="w-4 h-4" /> Eletroerosão a Fio (EDM)
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                                                        R$ {custoHoraEdm}/h
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline justify-between pt-1">
                                                    <div>
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Eficiência OEE</span>
                                                        <span className="text-3xl font-black text-white">{edmStats.oee}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Faturamento</span>
                                                        <span className="text-base font-extrabold text-emerald-400">{edmStats.valorFaturamento}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${edmStats.oee}%` }}></div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-900">
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Peças Concluídas:</span>
                                                        <strong className="text-slate-200">{edmStats.concluidasCount} peças</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Aprovação FPY:</span>
                                                        <strong className="text-emerald-400">{edmStats.fpy}%</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Horas Cortadas:</span>
                                                        <strong className="text-slate-200">{edmStats.realH}h</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Custo Pausas:</span>
                                                        <strong className="text-amber-400">{edmStats.valorPausas}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* TORNO Card */}
                                            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                                        <RotateCw className="w-4 h-4" /> Torno CNC
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                                                        R$ {custoHoraPadrao}/h
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline justify-between pt-1">
                                                    <div>
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Eficiência OEE</span>
                                                        <span className="text-3xl font-black text-white">{tornoStats.oee}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500 font-bold uppercase block">Faturamento</span>
                                                        <span className="text-base font-extrabold text-amber-400">{tornoStats.valorFaturamento}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${tornoStats.oee}%` }}></div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-900">
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Peças Concluídas:</span>
                                                        <strong className="text-slate-200">{tornoStats.concluidasCount} peças</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Aprovação FPY:</span>
                                                        <strong className="text-emerald-400">{tornoStats.fpy}%</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Horas Torneadas:</span>
                                                        <strong className="text-slate-200">{tornoStats.realH}h</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-[10px]">Custo Pausas:</span>
                                                        <strong className="text-amber-400">{tornoStats.valorPausas}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    );
                })()}


                {/* Linha 3: Gráficos de Produção */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LeadTimeChart concluidas={concluidas} />
                    <QualityPieChart concluidas={concluidas} />
                    <InsumosLifeChart periodo={periodo} />
                    <MachineHoursChart concluidas={concluidas} />
                    <ClientPiecesChart concluidas={concluidas} />
                    <MachineConsumptionChart periodo={periodo} />
                </div>

                {/* Linha 4: Análises por Setor e Causa Raiz */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <PauseReasonsChart concluidas={concluidas} kanban={kanban} />
                    <RefugoPorMaquinaChart concluidas={concluidas} />
                    <ProducaoPorOperadorChart concluidas={concluidas} />
                </div>
            </div>
        </ErrorBoundary>
    );
}
