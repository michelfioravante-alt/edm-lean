import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, Clock, Zap, ArrowRight, X, LayoutGrid } from 'lucide-react';
import { KANBAN_COLUMNS } from '../../constants/cncProcess';
import { calcularTempoPorPasses, rotuloTempo } from '../../utils/calculadoraEdm';

const COLUNAS = Object.values(KANBAN_COLUMNS);
const TEMA = {
    aFazer: { barra: '#7B808F', titulo: 'A FAZER' },
    setup: { barra: '#D97D3D', titulo: 'SETUP' },
    emCorte: { barra: '#3D9B8F', titulo: 'EM USINAGEM' },
    afericao: { barra: '#8B7BB8', titulo: 'INSPEÇÃO' },
    concluido: { barra: '#4A9D74', titulo: 'CONCLUÍDO' },
};

const inp = 'w-full min-w-0 rounded-md border border-[#333844] bg-[#111318] px-2.5 py-2 text-[14px] font-semibold tabular-nums text-[#E7E9ED] placeholder-[#565B68] focus:border-[#D97D3D] focus:outline-none';
const inpNum = 'w-[5.25rem] max-w-full rounded-md border border-[#333844] bg-[#111318] px-2 py-2 text-[14px] font-semibold tabular-nums text-[#E7E9ED] placeholder-[#565B68] focus:border-[#D97D3D] focus:outline-none';

function Campo({ label, hint, className = '', children }) {
    return (
        <label className={`block min-w-0 ${className}`}>
            <span className="mb-1 block text-[11px] font-medium text-[#9DA2AE]">{label}</span>
            {children}
            {hint ? <span className="mt-1 block text-[10px] leading-snug text-[#565B68]">{hint}</span> : null}
        </label>
    );
}

function MiniCard({ peca, cliente, tempoCorteLabel, tempoSetupLabel, quantidade, fase }) {
    const visivel = fase === 'in' || fase === 'landed';
    return (
        <div
            className={`overflow-hidden rounded-[10px] border border-[#D97D3D]/55 bg-[#181B22] shadow-[0_16px_40px_-12px_rgba(217,125,61,0.55)] transition-all duration-700 ease-out ${
                visivel ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-10 scale-90 opacity-0'
            } ${fase === 'landed' ? 'calc-card-pulse' : ''}`}
        >
            <div className="flex items-center gap-1.5 border-b border-[#262A33] bg-[#1F232B] px-2.5 py-1.5">
                <Zap className="h-3 w-3 shrink-0 text-[#D97D3D]" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#D97D3D]">Eletrofio</span>
            </div>
            <div className="p-2.5">
                <p className="truncate font-['Space_Grotesk'] text-[13px] font-semibold text-[#E7E9ED]">{cliente || 'Sua ferramentaria'}</p>
                <p className="mt-0.5 font-['IBM_Plex_Mono'] text-[10px] text-[#9DA2AE]">{peca || 'PECA-001'}</p>
                <div className="mt-2 rounded-md border border-[#262A33] text-[10px]">
                    {tempoSetupLabel ? (
                        <div className="flex justify-between border-b border-[#262A33] px-2 py-1">
                            <span className="text-[#565B68]">Setup</span>
                            <span className="font-['IBM_Plex_Mono'] text-[#9DA2AE]">{tempoSetupLabel}</span>
                        </div>
                    ) : null}
                    <div className="flex justify-between border-b border-[#262A33] px-2 py-1">
                        <span className="text-[#565B68]">Corte</span>
                        <span className="font-semibold text-[#D97D3D]">{tempoCorteLabel}</span>
                    </div>
                    <div className="flex justify-between px-2 py-1">
                        <span className="text-[#565B68]">Peças</span>
                        <span className="font-['IBM_Plex_Mono'] text-[#9DA2AE]">{quantidade}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KanbanModal({
    aberto,
    onFechar,
    peca,
    cliente,
    tempoCorteLabel,
    tempoSetupLabel,
    quantidade,
    tempoTotalLabel,
    onRegister,
    onLogin,
}) {
    const [fase, setFase] = useState('idle'); // idle | in | landed

    useEffect(() => {
        if (!aberto) {
            setFase('idle');
            return undefined;
        }
        setFase('idle');
        const t1 = setTimeout(() => setFase('in'), 180);
        const t2 = setTimeout(() => setFase('landed'), 900);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onFechar();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [aberto, onFechar]);

    if (!aberto) return null;

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button
                type="button"
                aria-label="Fechar"
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px] calc-modal-backdrop"
                onClick={onFechar}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="calc-kanban-title"
                className="relative z-10 flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-2xl border border-[#333844] bg-[#111318] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] sm:rounded-2xl calc-modal-panel"
            >
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-4 py-3.5 sm:px-5">
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7B808F]">Prévia do chão</p>
                        <h3 id="calc-kanban-title" className="mt-0.5 font-['Space_Grotesk'] text-[18px] font-medium text-white sm:text-[20px]">
                            Assim a ordem entra no kanban
                        </h3>
                        <p className="mt-1 text-[12px] text-[#9DA2AE]">
                            Tempo total <span className="font-semibold text-[#D97D3D]">{tempoTotalLabel}</span>
                            {' · '}corte {tempoCorteLabel}
                            {tempoSetupLabel ? ` · setup ${tempoSetupLabel}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onFechar}
                        className="shrink-0 rounded-md border border-[#333844] p-1.5 text-[#7B808F] hover:border-[#D97D3D]/50 hover:text-[#E7E9ED]"
                        aria-label="Fechar modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                    <div className="overflow-hidden rounded-xl border border-[#262A33] bg-[#0E1015]">
                        <div className="border-b border-[#262A33] px-3 py-2.5">
                            <p className="font-['Space_Grotesk'] text-[13px] text-[#E7E9ED]">Quadro · Centro Eletrofio</p>
                            <p className="text-[10px] text-[#565B68]">O cartão cai na coluna A FAZER — pronto para o operador puxar</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto overscroll-x-contain p-2.5 pb-3 [-webkit-overflow-scrolling:touch]">
                            {COLUNAS.map((col) => {
                                const tema = TEMA[col.key];
                                const destino = col.key === 'aFazer';
                                const conta = destino && (fase === 'in' || fase === 'landed') ? 1 : 0;
                                return (
                                    <div
                                        key={col.key}
                                        className={`flex w-[158px] shrink-0 flex-col rounded-lg border bg-[#111318] sm:w-[168px] ${
                                            destino && fase === 'landed'
                                                ? 'border-[#D97D3D]/55 shadow-[0_0_0_1px_rgba(217,125,61,0.2)]'
                                                : 'border-[#262A33]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between border-b border-[#262A33] px-2 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tema.barra }} />
                                                <span className="text-[9px] font-semibold tracking-wide text-[#9DA2AE]">{tema.titulo}</span>
                                            </div>
                                            <span className="font-['IBM_Plex_Mono'] text-[9px] text-[#565B68]">{conta}</span>
                                        </div>
                                        <div className="relative min-h-[168px] flex-1 p-1.5">
                                            {destino ? (
                                                <MiniCard
                                                    peca={peca}
                                                    cliente={cliente}
                                                    tempoCorteLabel={tempoCorteLabel}
                                                    tempoSetupLabel={tempoSetupLabel}
                                                    quantidade={quantidade}
                                                    fase={fase}
                                                />
                                            ) : (
                                                <div className="flex h-full min-h-[150px] items-center justify-center rounded border border-dashed border-[#262A33]">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#3A3F4A]">Vazio</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#262A33] bg-[#181B22] px-4 py-4 sm:px-5">
                    <p className="font-['Space_Grotesk'] text-[15px] text-white sm:text-[16px]">
                        Quer esse cartão no quadro de verdade?
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#9DA2AE]">
                        No EDM Lean o tempo previsto vira O.S. no chão. Teste 30 dias, sem cartão.
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onRegister}
                            className="inline-flex items-center gap-2 rounded-md bg-[#D97D3D] px-4 py-2.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32]"
                        >
                            Salvar este kanban
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        {onLogin ? (
                            <button type="button" onClick={onLogin} className="text-[13px] text-[#9DA2AE] underline-offset-4 hover:underline">
                                Já tenho conta
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default function CalculadoraEdmSection({ onRegister, onLogin }) {
    const [peca, setPeca] = useState('INSERTO-042');
    const [cliente, setCliente] = useState('');
    const [perimetro, setPerimetro] = useState('420');
    const [velocidade, setVelocidade] = useState('5.5');
    const [eficiencia, setEficiencia] = useState(85);
    const [quantidade, setQuantidade] = useState(1);
    const [setupMin, setSetupMin] = useState('');
    const [modalAberto, setModalAberto] = useState(false);

    const setupMinutos = Math.max(0, parseInt(setupMin, 10) || 0);

    const resultado = useMemo(
        () => calcularTempoPorPasses({
            perimetroMm: perimetro,
            passesMmMin: [velocidade],
            eficienciaPct: eficiencia,
            quantidade,
        }),
        [perimetro, velocidade, eficiencia, quantidade],
    );

    const totalComSetup = useMemo(() => {
        const total = resultado.totalMinutos + setupMinutos;
        return { horas: Math.floor(total / 60), minutos: total % 60, totalMinutos: total };
    }, [resultado.totalMinutos, setupMinutos]);

    const qtd = Math.max(1, parseInt(quantidade, 10) || 1);
    const pronto = resultado.totalMinutos > 0;
    const tempoSetupLabel = setupMinutos > 0
        ? rotuloTempo({ horas: Math.floor(setupMinutos / 60), minutos: setupMinutos % 60 })
        : null;

    const salvar = () => {
        try {
            sessionStorage.setItem('edm-lean-calc-rascunho', JSON.stringify({
                peca: peca || 'PECA-001',
                cliente,
                perimetro,
                velocidadeMmMin: velocidade,
                eficiencia,
                quantidade: qtd,
                setupMinutos,
                totalMinutos: resultado.totalMinutos,
                totalComSetupMinutos: totalComSetup.totalMinutos,
            }));
        } catch { /* ignore */ }
        setModalAberto(false);
        onRegister?.();
    };

    const abrirKanban = () => {
        if (!pronto) return;
        setModalAberto(true);
    };

    return (
        <section id="calculadora" className="border-t border-[#262A33] scroll-mt-20">
            <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-6 sm:py-20">
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#7B808F]">Ferramenta gratuita · WEDM</p>
                <h2 className="mt-3 max-w-[20ch] font-['Space_Grotesk'] text-[28px] font-medium leading-tight tracking-tight text-white sm:text-[32px]">
                    Calculadora de eletroerosão a fio
                </h2>
                <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#9DA2AE]">
                    Perímetro e rendimento da máquina em mm/min. Ao calcular, você vê a ordem cair no kanban — como no chão de fábrica.
                </p>

                <div className="mt-10 min-w-0 rounded-xl border border-[#262A33] bg-[#181B22] p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="rounded-md bg-[#D97D3D] p-1.5 text-[#111318]">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-['Space_Grotesk'] text-[14px]">Dados do corte</p>
                            <p className="text-[11px] text-[#7B808F]">Só o essencial para estimar o tempo</p>
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        <div className="grid min-w-0 grid-cols-2 gap-2.5">
                            <Campo label="Código da peça">
                                <input className={inp} value={peca} onChange={(e) => setPeca(e.target.value)} />
                            </Campo>
                            <Campo label="Cliente (opc.)">
                                <input className={inp} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ferramentaria" />
                            </Campo>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-3">
                            <Campo label="Perímetro" hint="mm">
                                <input className={inpNum} type="number" inputMode="decimal" min="0" step="0.1" value={perimetro} onChange={(e) => setPerimetro(e.target.value)} />
                            </Campo>
                            <Campo label="Rendimento" hint="mm/min · típico 4–7">
                                <input className={inpNum} type="number" inputMode="decimal" min="0" max="20" step="0.1" value={velocidade} onChange={(e) => setVelocidade(e.target.value)} />
                            </Campo>
                            <Campo label="Peças" hint="qtd.">
                                <input className={inpNum} type="number" inputMode="numeric" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                            </Campo>
                            <Campo label="Set-up" hint="min · opcional">
                                <input className={inpNum} type="number" inputMode="numeric" min="0" value={setupMin} onChange={(e) => setSetupMin(e.target.value)} placeholder="0" />
                            </Campo>
                        </div>

                        <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-[#9DA2AE]">Eficiência esperada</p>
                                    <p className="mt-0.5 text-[10px] leading-snug text-[#565B68]">
                                        O rendimento em trecho reto quase nunca se mantém no contorno inteiro. Cantos, entradas, soldas e distância dos bicos reduzem o ritmo — a eficiência traz o tempo para algo mais realista.
                                    </p>
                                </div>
                                <span className="shrink-0 rounded bg-[#D97D3D]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#D97D3D]">{eficiencia}%</span>
                            </div>
                            <input
                                type="range"
                                min="40"
                                max="100"
                                step="5"
                                value={eficiencia}
                                onChange={(e) => setEficiencia(Number(e.target.value))}
                                className="mt-2 w-full accent-[#D97D3D]"
                            />
                            <div className="mt-1 flex justify-between text-[9px] text-[#565B68]">
                                <span>40% · cantos</span>
                                <span>100% · reto</span>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-4 rounded-lg border p-3 sm:p-4 ${pronto ? 'border-[#D97D3D]/40 bg-gradient-to-br from-[#D97D3D]/12 to-transparent' : 'border-[#333844] bg-[#111318]'}`}>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7B808F]">
                            <Clock className="h-3.5 w-3.5" />
                            Tempo total estimado
                        </div>
                        <p className="mt-0.5 font-['Space_Grotesk'] text-[32px] font-medium text-white sm:text-[36px]">
                            {rotuloTempo(pronto ? totalComSetup : resultado)}
                        </p>
                        {pronto ? (
                            <p className="mt-0.5 text-[11px] text-[#565B68]">
                                Corte {rotuloTempo(resultado)}
                                {setupMinutos > 0 ? ` · Setup ${tempoSetupLabel}` : ''}
                                {' · '}{qtd} pç
                            </p>
                        ) : (
                            <p className="mt-0.5 text-[11px] text-[#565B68]">Preencha perímetro e rendimento</p>
                        )}

                        <button
                            type="button"
                            onClick={abrirKanban}
                            disabled={!pronto}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#D97D3D] px-4 py-2.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Ver no kanban
                        </button>
                    </div>
                </div>
            </div>

            <KanbanModal
                aberto={modalAberto}
                onFechar={() => setModalAberto(false)}
                peca={peca}
                cliente={cliente}
                tempoCorteLabel={rotuloTempo(resultado)}
                tempoSetupLabel={tempoSetupLabel}
                quantidade={qtd}
                tempoTotalLabel={rotuloTempo(totalComSetup)}
                onRegister={salvar}
                onLogin={onLogin}
            />
        </section>
    );
}
