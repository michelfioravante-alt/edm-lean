import React, { useMemo, useState, lazy, Suspense } from 'react';
import {
    AlertTriangle, ArrowRight, Bell, CheckCircle2, Clock, Cpu, Factory,
    CircleHelp, Package, PauseCircle, Plus, Zap, FolderUp,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import NovaOSForm from '../components/kanban/NovaOSForm';
import { kanbanPrecisaProgramar, labelSetor } from '../constants/osWorkflow';
import { formatarMoedaBRL } from '../utils/formatters';
import { montarHomeGerente } from '../utils/homeGerente';

const ImportarMoldeModal = lazy(() => import('../components/moldes/ImportarMoldeModal'));

const TONE_CLS = {
    danger: 'border-[#C85558]/40 bg-[rgba(200,85,88,0.08)]',
    warn: 'border-[#C99A4A]/40 bg-[rgba(201,154,74,0.08)]',
    info: 'border-[#4A8EEF]/35 bg-[rgba(74,142,239,0.08)]',
    ok: 'border-[#262A33] bg-[#181B22]',
    neutral: 'border-[#262A33] bg-[#181B22]',
};

const VALUE_CLS = {
    danger: 'text-[#C85558]',
    warn: 'text-[#C99A4A]',
    info: 'text-[#6AA6F0]',
    ok: 'text-[#E7E9ED]',
    neutral: 'text-[#E7E9ED]',
};

function gargaloCurto(row) {
    if (row.tudoPronto) return 'Conjunto pronto';
    if (row.passoAberto?.kind === 'marco') return `${row.passoAberto.label} (marco)`;
    const g = row.passoAberto?.os || row.gargalo;
    if (!g) return '—';
    const extra = kanbanPrecisaProgramar(g) ? ' · a programar' : '';
    return `${labelSetor(g.setor || g.tipo_processo)} — ${g.codigo_peca || g.codigoPeca || 'kanban'}${extra}`;
}

function QueueCard({ titulo, vazio, itens, onOpen, onVerTodas }) {
    return (
        <div className="border border-[#262A33] rounded-[10px] bg-[#181B22] flex flex-col min-h-[220px]">
            <div className="px-3.5 py-2.5 border-b border-[#262A33] flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9DA2AE]">{titulo}</h3>
                <button type="button" onClick={onVerTodas} className="text-[10px] text-[#D97D3D] font-semibold cursor-pointer">
                    Ver todas
                </button>
            </div>
            {itens.length === 0 ? (
                <p className="p-4 text-sm text-[#7B808F]">{vazio}</p>
            ) : (
                <ul className="divide-y divide-[#262A33]">
                    {itens.map((row) => (
                        <li key={row.grupoId}>
                            <button
                                type="button"
                                onClick={() => onOpen(row)}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-[#1F232B] cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm text-[#E7E9ED] font-medium truncate">{row.titulo || 'S/N'}</span>
                                    {row.atrasada ? (
                                        <span className="shrink-0 text-[9px] uppercase font-semibold text-[#C85558]">Atraso</span>
                                    ) : null}
                                </div>
                                <p className="text-[11px] text-[#7B808F] truncate mt-0.5">{row.cliente || '—'}</p>
                                <p className="text-[11px] text-[#9DA2AE] truncate mt-0.5">{gargaloCurto(row)}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function StripChip({ label, n }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#9DA2AE]">
            <span className="text-[#565B68]">{label}</span>
            <span className="font-mono font-semibold text-[#E7E9ED]">{n}</span>
        </span>
    );
}

export default function HomeGerente({ onNavigate }) {
    const kanban = useAppStore((s) => s.kanban);
    const estoque = useAppStore((s) => s.estoque);
    const config = useAppStore((s) => s.configuracoesGlobais);
    const irParaKanban = useAppStore((s) => s.irParaKanban);
    const pedirFiltroCarteira = useAppStore((s) => s.pedirFiltroCarteira);
    const [novaOs, setNovaOs] = useState(false);
    const [importMolde, setImportMolde] = useState(false);

    const painel = useMemo(
        () => montarHomeGerente(kanban, estoque, config || {}),
        [kanban, estoque, config],
    );

    const irCarteira = (filtro) => {
        if (filtro) pedirFiltroCarteira(filtro);
        onNavigate?.('carteira');
    };

    const openBoard = (os) => {
        if (os) irParaKanban(os);
        onNavigate?.('kanban');
    };

    const clicarKpi = (kpi) => {
        if (kpi.view === 'kanban') {
            onNavigate?.('kanban');
            return;
        }
        irCarteira(kpi.filtroCarteira);
    };

    const onAlertClick = (aviso) => {
        if (aviso.view === 'estoque') {
            onNavigate?.('estoque');
            return;
        }
        if (aviso.view === 'carteira') {
            irCarteira(aviso.filtroCarteira);
            return;
        }
        openBoard(aviso.os);
    };

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#262A33] pb-3">
                <div>
                    <h1 className="font-['Space_Grotesk'] text-lg font-semibold text-[#E7E9ED]">Inicio</h1>
                    <p className="text-xs text-[#7B808F] mt-1 capitalize">{hoje} · o que precisa da sua atencao agora</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => irCarteira('todas')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[7px] border border-[#333844] text-[#9DA2AE] text-xs font-semibold cursor-pointer"
                    >
                        Carteira completa
                    </button>
                    <button
                        type="button"
                        onClick={() => setNovaOs(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[7px] border border-[#333844] text-[#9DA2AE] text-xs font-semibold cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Nova O.S. manual
                    </button>
                    <button
                        type="button"
                        onClick={() => setImportMolde(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[7px] bg-[#D97D3D] text-[#111318] text-xs font-semibold cursor-pointer"
                    >
                        <FolderUp className="w-4 h-4" /> Importar molde
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                {painel.kpis.map((kpi) => (
                    <button
                        key={kpi.id}
                        type="button"
                        onClick={() => clicarKpi(kpi)}
                        className={`text-left rounded-[10px] border px-3 py-3 cursor-pointer hover:border-[#333844] ${TONE_CLS[kpi.tone] || TONE_CLS.neutral}`}
                    >
                        <div className="flex items-start justify-between gap-1.5">
                            <div className="text-[10px] uppercase tracking-wider text-[#7B808F] font-semibold leading-snug">{kpi.label}</div>
                            {kpi.legend ? (
                                <span
                                    className="relative shrink-0 group/wip"
                                    title=""
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <CircleHelp className="w-3.5 h-3.5 text-[#7B808F] hover:text-[#E7E9ED]" />
                                    <span
                                        role="tooltip"
                                        className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 w-[220px] rounded-[8px] border border-[#333844] bg-[#1F232B] px-2.5 py-2 text-[10px] font-normal normal-case tracking-normal text-[#C5C8D0] leading-snug shadow-lg opacity-0 translate-y-0.5 group-hover/wip:opacity-100 group-focus-within/wip:opacity-100 transition-opacity"
                                    >
                                        {kpi.legend}
                                    </span>
                                </span>
                            ) : null}
                        </div>
                        <div className={`mt-1.5 text-xl font-semibold font-mono ${VALUE_CLS[kpi.tone] || VALUE_CLS.neutral}`}>
                            {kpi.money ? formatarMoedaBRL(kpi.value) : kpi.value}
                        </div>
                        <div className="text-[10px] text-[#565B68] mt-1 leading-snug">{kpi.hint}</div>
                    </button>
                ))}
            </div>

            <div className="border border-[#262A33] rounded-[10px] bg-[#181B22] px-3.5 py-3 flex flex-col gap-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#565B68]">Chao agora</div>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Cpu className="w-3.5 h-3.5 text-[#7B808F] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#E7E9ED] w-16 shrink-0">CNC</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <StripChip label="Fila" n={painel.faixa.cnc.fila} />
                            <StripChip label="Setup" n={painel.faixa.cnc.setup} />
                            <StripChip label="Maq." n={painel.faixa.cnc.maquina} />
                            <StripChip label="Afer." n={painel.faixa.cnc.afericao} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Zap className="w-3.5 h-3.5 text-[#7B808F] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#E7E9ED] w-16 shrink-0">Eletrofio</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <StripChip label="Fila" n={painel.faixa.edm.fila} />
                            <StripChip label="Setup" n={painel.faixa.edm.setup} />
                            <StripChip label="Maq." n={painel.faixa.edm.maquina} />
                            <StripChip label="Afer." n={painel.faixa.edm.afericao} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Factory className="w-3.5 h-3.5 text-[#7B808F] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#E7E9ED] w-16 shrink-0">Externo</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <StripChip label="A enviar" n={painel.faixa.ext.fila} />
                            <StripChip label="La" n={painel.faixa.ext.la} />
                            <StripChip label="Volta" n={painel.faixa.ext.volta} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                <div className="xl:col-span-2 border border-[#262A33] rounded-[10px] bg-[#181B22]">
                    <div className="px-3.5 py-2.5 border-b border-[#262A33] flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-[#D97D3D]" />
                        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#9DA2AE]">Avisos automaticos</h2>
                        <span className="ml-auto text-[10px] font-mono text-[#565B68]">{painel.avisos.length}</span>
                    </div>
                    {painel.avisos.length === 0 ? (
                        <div className="p-6 flex flex-col items-center text-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-[#4A9D74]" />
                            <p className="text-sm text-[#E7E9ED] font-medium">Chao sob controle</p>
                            <p className="text-xs text-[#7B808F]">Sem atraso, parada longa, CAM no prazo nem estoque critico.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#262A33] max-h-[420px] overflow-y-auto">
                            {painel.avisos.map((a) => (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        onClick={() => onAlertClick(a)}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#1F232B] cursor-pointer flex gap-2.5"
                                    >
                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                            a.sev === 'red' ? 'bg-[#C85558]' : a.sev === 'amber' ? 'bg-[#C99A4A]' : 'bg-[#5B8DEF]'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-[#E7E9ED] leading-snug">{a.titulo}</p>
                                            {a.detalhe ? <p className="text-[11px] text-[#7B808F] mt-0.5 truncate">{a.detalhe}</p> : null}
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97D3D] mt-1">
                                                {a.acao} <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                        {a.view === 'estoque' ? <Package className="w-3.5 h-3.5 text-[#C99A4A] shrink-0 mt-0.5" /> : null}
                                        {a.sev === 'red' && a.view !== 'estoque' ? <AlertTriangle className="w-3.5 h-3.5 text-[#C85558] shrink-0 mt-0.5" /> : null}
                                        {a.id.startsWith('pausa-') ? <PauseCircle className="w-3.5 h-3.5 text-[#C99A4A] shrink-0 mt-0.5" /> : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <QueueCard
                        titulo="Atrasando / vence hoje"
                        vazio="Nenhum prazo no vermelho hoje."
                        itens={painel.filas.prazo}
                        onOpen={(row) => openBoard(row.gargalo || row.head)}
                        onVerTodas={() => irCarteira('atrasando')}
                    />
                    <QueueCard
                        titulo="Travadas"
                        vazio="Nada parado em CAM, pausa ou terceiro."
                        itens={painel.filas.travadas}
                        onOpen={(row) => openBoard(row.gargalo || row.head)}
                        onVerTodas={() => irCarteira('a_programar')}
                    />
                    <QueueCard
                        titulo="Pronto / a cobrar"
                        vazio="Nenhuma peca pronta para retirada."
                        itens={painel.filas.prontas}
                        onOpen={(row) => irCarteira('peca_pronta')}
                        onVerTodas={() => irCarteira('peca_pronta')}
                    />
                </div>
            </div>

            <p className="text-[10px] text-[#565B68] flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Historico de movimentos continua em Registros. Graficos da semana ficam no Dashboard executivo.
            </p>

            <NovaOSForm isOpen={novaOs} onClose={() => setNovaOs(false)} />
            {importMolde ? (
                <Suspense fallback={null}>
                    <ImportarMoldeModal
                        open={importMolde}
                        onClose={() => setImportMolde(false)}
                        onCreated={() => onNavigate?.('moldes')}
                    />
                </Suspense>
            ) : null}
        </div>
    );
}
