import React, { useMemo, useState } from 'react';
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
import CamVsRealChart from '../components/dashboard/CamVsRealChart';
import WipPipelineChart from '../components/dashboard/WipPipelineChart';
import OrcadoVsCustoChart from '../components/dashboard/OrcadoVsCustoChart';
import FornecedoresChart from '../components/dashboard/FornecedoresChart';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import {
    agregarKpis,
    brl,
    filtrarAtivas,
    filtrarConcluidas,
    fmtLead,
    metricasPorSetor,
    mesesPassados,
    pipelineWip,
    rankingFornecedoresDash,
} from '../utils/dashboardMetrics';
import {
    Activity, AlertTriangle, Clock, Cpu, DollarSign, Factory, Filter, LayoutDashboard,
    Lock, PauseCircle, Target, Timer, TrendingUp, Zap, FileSpreadsheet,
} from 'lucide-react';
import ExportarDadosModal from '../components/common/ExportarDadosModal';

const SETOR_LABEL = { CNC: 'CNC', EDM_FIO: 'Eletrofio', EXTERNO: 'Externo' };

export default function Dashboard() {
    const kanban = useAppStore((s) => s.kanban);
    const configuracoesGlobais = useAppStore((s) => s.configuracoesGlobais);
    const activeSector = useAppStore((s) => s.activeSector);
    const role = useAuthStore((s) => s.role);
    const setorPadrao = useAuthStore((s) => s.setorPadrao);

    const custoHoraCnc = Number(configuracoesGlobais?.custoHoraCnc) || 80;
    const custoHoraEdm = Number(configuracoesGlobais?.custoHoraEdm) || 120;
    const custoHoraPadrao = Number(configuracoesGlobais?.custoHoraMaquina) || 50;
    const configHora = { custoHoraCnc, custoHoraEdm, custoHoraMaquina: custoHoraPadrao };

    const isProgrammerLocked = role !== 'admin';
    const initialSector = isProgrammerLocked
        ? ((setorPadrao && setorPadrao !== 'TODOS') ? setorPadrao : 'CNC')
        : (activeSector === 'TODOS' || !activeSector ? 'TODOS' : activeSector);

    const [periodo, setPeriodo] = useState('mes');
    const [turno, setTurno] = useState('todos');
    const [setorFilter, setSetorFilter] = useState(initialSector);
    const [exportOpen, setExportOpen] = useState(false);

    const concluidas = useMemo(
        () => filtrarConcluidas(kanban.concluido || [], {
            setor: setorFilter,
            periodo,
            turno,
            turnos: configuracoesGlobais?.turnos,
        }),
        [kanban.concluido, setorFilter, periodo, turno, configuracoesGlobais?.turnos],
    );

    const ativas = useMemo(() => filtrarAtivas(kanban, setorFilter), [kanban, setorFilter]);
    const kpis = useMemo(() => agregarKpis(concluidas, ativas, configHora), [concluidas, ativas, custoHoraCnc, custoHoraEdm, custoHoraPadrao]);
    const porSetor = useMemo(() => metricasPorSetor(concluidas, configHora), [concluidas, custoHoraCnc, custoHoraEdm, custoHoraPadrao]);
    const wip = useMemo(() => pipelineWip(kanban, setorFilter), [kanban, setorFilter]);
    const rankingFornecedores = useMemo(() => rankingFornecedoresDash(kanban), [kanban]);

    const isGerente = role === 'admin';
    const isEdm = setorFilter === 'EDM_FIO';
    const isCnc = setorFilter === 'CNC';

    return (
        <ErrorBoundary>
            <div className="min-h-full flex flex-col gap-6 w-full pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#181B22] p-5 rounded-[10px] border border-[#262A33]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[rgba(217,125,61,0.1)] rounded-[8px] border border-[#D97D3D]/20 text-[#D97D3D] shrink-0">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[#E7E9ED]">
                                {isProgrammerLocked ? 'Indicadores do setor' : 'Painel da ferramentaria'}
                            </h2>
                            <p className="text-[#565B68] mt-0.5 text-xs max-w-xl">
                                Concluídas seguem o período e o turno. A fila (WIP) é o quadro agora. Eficiência CAM = horas previstas ÷ setup+corte reais.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {isProgrammerLocked ? (
                            <div className="flex items-center gap-2 bg-[#111318] px-3 py-2 rounded-[7px] border border-[#262A33]">
                                <Lock className="w-3.5 h-3.5 text-[#D97D3D] shrink-0" />
                                <select className="bg-[#111318] text-xs text-[#E7E9ED] font-medium outline-none cursor-pointer" value={setorFilter} onChange={(e) => setSetorFilter(e.target.value)}>
                                    <option value="CNC">Centro CNC</option>
                                    <option value="EDM_FIO">Eletrofio</option>
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-[#111318] px-3 py-2 rounded-[7px] border border-[#262A33]">
                                <Factory className="w-3.5 h-3.5 text-[#D97D3D] shrink-0" />
                                <select className="bg-[#111318] text-xs text-[#E7E9ED] font-medium outline-none cursor-pointer" value={setorFilter} onChange={(e) => setSetorFilter(e.target.value)}>
                                    <option value="TODOS">Toda a fábrica</option>
                                    <option value="CNC">CNC</option>
                                    <option value="EDM_FIO">Eletrofio</option>
                                    <option value="EXTERNO">Serviço externo</option>
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-[#111318] px-3 py-2 rounded-[7px] border border-[#262A33]">
                            <Filter className="w-3.5 h-3.5 text-[#565B68] shrink-0" />
                            <select className="bg-[#111318] text-xs text-[#E7E9ED] font-medium outline-none cursor-pointer" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <optgroup label="Período atual">
                                    <option value="hoje">Hoje</option>
                                    <option value="semana">7 dias</option>
                                    <option value="mes">Este mês</option>
                                </optgroup>
                                <optgroup label="Meses passados">
                                    {mesesPassados().map(({ value, label }) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-[#111318] px-3 py-2 rounded-[7px] border border-[#262A33]">
                            <Clock className="w-3.5 h-3.5 text-[#565B68] shrink-0" />
                            <select className="bg-[#111318] text-xs text-[#E7E9ED] font-medium outline-none cursor-pointer" value={turno} onChange={(e) => setTurno(e.target.value)}>
                                <option value="todos">Todos os turnos</option>
                                {configuracoesGlobais?.turnos?.map((t) => (
                                    <option key={t.id} value={t.id}>{t.nome} ({t.inicio} – {t.fim})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => setExportOpen(true)}
                            className="inline-flex items-center gap-1.5 bg-[#111318] px-3 py-2 rounded-[7px] border border-[#262A33] text-xs font-medium text-[#E7E9ED] hover:border-[#D97D3D]/40"
                            title="Importar dados"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D97D3D]" />
                            Importar dados
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <KpiCard
                        title={isEdm ? 'Eficiência CAM (fio)' : isCnc ? 'Eficiência CAM (CNC)' : 'Eficiência CAM'}
                        value={`${kpis.oee.toFixed(1)}%`}
                        icon={Zap}
                        colorClass={kpis.oee >= 85 ? 'bg-[#4A9D74]' : 'bg-[#C99A4A]'}
                        tooltipContent="Previsto (cadastro) ÷ horas reais de setup + corte. Acima de 100% = mais rápido que o CAM. Aferição e pausa não entram."
                        hint={`${kpis.planH.toFixed(1)}h CAM · ${kpis.realCamH.toFixed(1)}h máquina`}
                    />
                    <KpiCard
                        title="FPY (1ª aprovação)"
                        value={`${kpis.fpy.toFixed(1)}%`}
                        icon={Target}
                        colorClass="bg-[#4A9D74]"
                        tooltipContent="Peças aprovadas na aferição sobre as que tiveram resultado. Refugo baixa o índice."
                    />
                    <KpiCard
                        title="Lead time médio"
                        value={fmtLead(kpis.leadMedio)}
                        icon={Timer}
                        colorClass="bg-[#D97D3D]"
                        tooltipContent="Da abertura da O.S. até entrar em concluído."
                    />
                    <KpiCard
                        title="WIP no quadro"
                        value={String(kpis.wip)}
                        icon={Activity}
                        colorClass="bg-[#9DA2AE]"
                        tooltipContent="Cartões em fila, set-up, máquina e aferição agora. Não usa o filtro de mês."
                    />
                    <KpiCard
                        title="Concluídas no período"
                        value={String(kpis.concluidasN)}
                        icon={Clock}
                        colorClass="bg-[#4A9D74]"
                    />
                    <KpiCard
                        title="O.S. em atraso"
                        value={String(kpis.atrasadas)}
                        icon={AlertTriangle}
                        colorClass={kpis.atrasadas > 0 ? 'bg-[#C85558]' : 'bg-[#333844]'}
                        tooltipContent="Ativas com prazo de entrega já vencido."
                    />
                </div>

                {isGerente && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Valor de corte" value={brl(kpis.valorCorte)} icon={DollarSign} colorClass="bg-[#4A9D74]" tooltipContent="Horas de corte das aprovadas × tarifa do setor." />
                        <KpiCard title="Custo de máquina" value={brl(kpis.custoMaquina)} icon={DollarSign} colorClass="bg-[#4A9D74]" tooltipContent="Horas reais (ou CAM se ainda sem cronômetro) × tarifa." />
                        <KpiCard title="Perda por refugo" value={brl(kpis.valorRefugo)} icon={TrendingUp} colorClass="bg-[#C85558]" tooltipContent="Horas de peças refugadas × tarifa." />
                        <KpiCard title="Custo de pausas" value={brl(kpis.valorPausa)} icon={PauseCircle} colorClass="bg-[#C99A4A]" tooltipContent="Histórico de pausas + pausa aberta agora." />
                    </div>
                )}

                {isGerente && setorFilter === 'TODOS' && (
                    <div className="rounded-[10px] overflow-hidden border border-[#262A33] bg-[#181B22]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262A33]">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#D97D3D]" />
                                <h3 className="text-xs font-semibold text-[#E7E9ED] uppercase tracking-wider">Mesmo período, por setor</h3>
                            </div>
                            <span className="text-[10px] text-[#565B68]">Usa as concluídas filtradas — não o histórico inteiro</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            {porSetor.map((s, i) => (
                                <div key={s.id} className={`p-4 space-y-3 ${i < 2 ? 'md:border-r border-[#262A33]' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-[#D97D3D] flex items-center gap-1.5">
                                            <Cpu className="w-3.5 h-3.5" /> {SETOR_LABEL[s.id] || s.id}
                                        </span>
                                        <span className="text-[10px] font-mono text-[#565B68]">{s.concluidasN} O.S.</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase text-[#565B68]">CAM</p>
                                            <p className="text-xl font-semibold text-[#E7E9ED]">{s.oee.toFixed(0)}%</p>
                                        </div>
                                        {isGerente && (
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-[#565B68]">Máquina</p>
                                                <p className="text-sm font-semibold text-[#4A9D74]">{brl(s.custoMaquina)}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#111318] overflow-hidden">
                                        <div className="h-full bg-[#D97D3D] rounded-full" style={{ width: `${Math.min(s.oee, 100)}%` }} />
                                    </div>
                                    <div className="text-[11px] space-y-1 text-[#9DA2AE]">
                                        <div className="flex justify-between"><span>FPY</span><span className="text-[#4A9D74]">{s.fpy.toFixed(0)}%</span></div>
                                        <div className="flex justify-between"><span>Máquina</span><span>{s.realCamH.toFixed(1)}h</span></div>
                                        <div className="flex justify-between"><span>Pausas</span><span className="text-[#C99A4A]">{brl(s.valorPausa)}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CamVsRealChart series={kpis.camSeries} />
                    <WipPipelineChart pipeline={wip} />
                    {isGerente && (
                        <OrcadoVsCustoChart orcado={kpis.orcado} custo={kpis.custoMaquina} margem={kpis.margem} />
                    )}
                    <FornecedoresChart ranking={rankingFornecedores} />
                    <LeadTimeChart concluidas={concluidas} />
                    <QualityPieChart concluidas={concluidas} />
                    {(setorFilter === 'TODOS' || setorFilter === 'EDM_FIO') && (
                        <InsumosLifeChart periodo={periodo} />
                    )}
                    <MachineHoursChart concluidas={concluidas} />
                    <ClientPiecesChart concluidas={concluidas} />
                    <MachineConsumptionChart periodo={periodo} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <PauseReasonsChart concluidas={concluidas} kanban={kanban} />
                    <RefugoPorMaquinaChart concluidas={concluidas} />
                    <ProducaoPorOperadorChart concluidas={concluidas} />
                </div>
            </div>
            <ExportarDadosModal open={exportOpen} onClose={() => setExportOpen(false)} />
        </ErrorBoundary>
    );
}
