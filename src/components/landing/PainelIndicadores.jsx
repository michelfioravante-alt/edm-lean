import React, { useEffect, useRef, useState } from 'react';
import { Zap, Target, Timer, Activity, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const KPIS = [
    {
        label: 'Eficiência CAM',
        valor: '92%',
        icon: Zap,
        cor: '#4A9D74',
        corBg: 'rgba(74,157,116,0.14)',
        hint: '38h CAM · 41h máquina',
        legenda: 'Previsto (cadastro) ÷ horas reais de setup + corte. Acima de 100% = mais rápido que o CAM. Aferição e pausa não entram.',
    },
    {
        label: 'FPY (1ª aprovação)',
        valor: '97%',
        icon: Target,
        cor: '#4A9D74',
        corBg: 'rgba(74,157,116,0.14)',
        hint: 'Aprovadas na inspeção',
        legenda: 'Peças aprovadas na aferição sobre as que tiveram resultado. Refugo baixa o índice.',
    },
    {
        label: 'Lead time médio',
        valor: '1d 4h',
        icon: Timer,
        cor: '#D97D3D',
        corBg: 'rgba(217,125,61,0.14)',
        hint: 'Abertura → concluído',
        legenda: 'Da abertura da O.S. até entrar em concluído. Mostra quanto a peça demora a atravessar a fábrica.',
    },
    {
        label: 'WIP no quadro',
        valor: '12',
        icon: Activity,
        cor: '#9DA2AE',
        corBg: 'rgba(157,162,174,0.12)',
        hint: 'Fila + setup + máquina',
        legenda: 'Cartões em fila, set-up, máquina e aferição agora. É a carga viva do quadro — não usa o filtro de mês.',
    },
    {
        label: 'Concluídas no período',
        valor: '48',
        icon: CheckCircle2,
        cor: '#3D9B8F',
        corBg: 'rgba(61,155,143,0.14)',
        hint: 'Com filtro de mês/turno',
        legenda: 'O.S. que chegaram a concluído no período e turno selecionados. Base para comparar ritmo de entrega.',
    },
    {
        label: 'O.S. em atraso',
        valor: '2',
        icon: AlertTriangle,
        cor: '#C85558',
        corBg: 'rgba(200,85,88,0.14)',
        hint: 'Prazo já vencido',
        legenda: 'Ordens ativas com prazo de entrega já vencido. É o alerta para o gestor agir primeiro.',
    },
];

function KpiTile({ kpi, index, ativo }) {
    const Icon = kpi.icon;
    return (
        <div
            className={`kpi-tile relative overflow-hidden rounded-lg border border-[#262A33] bg-[#181B22] p-4 sm:p-5 ${
                ativo ? 'kpi-tile-in' : 'opacity-0 translate-y-3'
            }`}
            style={{ animationDelay: ativo ? `${index * 90}ms` : undefined }}
        >
            <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
                style={{ background: kpi.cor }}
            />
            <div
                className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-700"
                style={{ background: kpi.cor, opacity: ativo ? 0.16 : 0 }}
            />

            <div className="relative flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#7B808F]">{kpi.label}</p>
                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ background: kpi.corBg, color: kpi.cor }}
                >
                    <Icon className="h-3.5 w-3.5" />
                </span>
            </div>

            <p
                className="relative mt-3 font-['Space_Grotesk'] text-[28px] font-medium tracking-tight sm:text-[32px]"
                style={{ color: kpi.cor }}
            >
                {kpi.valor}
            </p>
            <p className="relative mt-1 text-[11px] text-[#565B68]">{kpi.hint}</p>
        </div>
    );
}

export default function PainelIndicadores() {
    const ref = useRef(null);
    const [ativo, setAtivo] = useState(false);
    const [legendaAberta, setLegendaAberta] = useState(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAtivo(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div ref={ref}>
            <figure className="overflow-hidden rounded-lg border border-[#262A33] bg-[#0E1015] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-1.5 border-b border-[#262A33] bg-[#181B22] px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#333844]" />
                    <span className="h-2 w-2 rounded-full bg-[#333844]" />
                    <span className="h-2 w-2 rounded-full bg-[#333844]" />
                    <span className="ml-2 text-[10px] tracking-wide text-[#565B68]">EDM Lean · Painel de controle</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262A33] bg-[#181B22] px-4 py-3 sm:px-5">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[14px] text-[#E7E9ED]">Indicadores do chão</p>
                        <p className="text-[11px] text-[#565B68]">Exemplo ilustrativo — mesmos KPIs do sistema após o login</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-[#333844] bg-[#111318] px-2.5 py-1 text-[11px] text-[#9DA2AE]">
                            Setor · CNC
                        </span>
                        <span className="rounded-md border border-[#333844] bg-[#111318] px-2.5 py-1 text-[11px] text-[#9DA2AE]">
                            Este mês
                        </span>
                        <span className="rounded-md border border-[#D97D3D]/35 bg-[#D97D3D]/10 px-2.5 py-1 text-[11px] text-[#D97D3D]">
                            Todos os turnos
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
                    {KPIS.map((kpi, i) => (
                        <button
                            key={kpi.label}
                            type="button"
                            className="text-left"
                            onClick={() => setLegendaAberta(legendaAberta === i ? null : i)}
                            aria-expanded={legendaAberta === i}
                        >
                            <KpiTile kpi={kpi} index={i} ativo={ativo} />
                        </button>
                    ))}
                </div>

                <div className="border-t border-[#262A33] bg-[#181B22] px-4 py-4 sm:px-5">
                    <div className="mb-3 flex items-center gap-2">
                        <HelpCircle className="h-3.5 w-3.5 text-[#D97D3D]" />
                        <p className="text-[12px] font-medium text-[#E7E9ED]">
                            {legendaAberta != null ? `Legenda · ${KPIS[legendaAberta].label}` : 'Legenda · toque um indicador para detalhar'}
                        </p>
                    </div>
                    {legendaAberta != null ? (
                        <p className="text-[13px] leading-relaxed text-[#9DA2AE] kpi-legenda-in">
                            {KPIS[legendaAberta].legenda}
                        </p>
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {KPIS.map((kpi) => (
                                <li key={kpi.label} className="flex gap-2.5 text-[12px] leading-snug text-[#7B808F]">
                                    <span
                                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ background: kpi.cor }}
                                    />
                                    <span>
                                        <span className="font-medium text-[#9DA2AE]">{kpi.label}: </span>
                                        {kpi.legenda}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </figure>
        </div>
    );
}
