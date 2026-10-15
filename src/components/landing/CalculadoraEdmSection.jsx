import React, { useMemo, useState } from 'react';
import { Calculator, Clock, Zap, ArrowRight } from 'lucide-react';
import { KANBAN_COLUMNS } from '../../constants/cncProcess';
import { calcularTempoPorArea, rotuloTempo } from '../../utils/calculadoraEdm';

const COLUNAS = Object.values(KANBAN_COLUMNS);
const TEMA = {
    aFazer: { barra: '#7B808F', titulo: 'A FAZER' },
    setup: { barra: '#D97D3D', titulo: 'SETUP' },
    emCorte: { barra: '#3D9B8F', titulo: 'EM USINAGEM' },
    afericao: { barra: '#8B7BB8', titulo: 'INSPEÇÃO' },
    concluido: { barra: '#4A9D74', titulo: 'CONCLUÍDO' },
};

const inp = 'w-full rounded-md border border-[#333844] bg-[#111318] px-2.5 py-2 text-[14px] font-semibold tabular-nums text-[#E7E9ED] placeholder-[#565B68] focus:border-[#D97D3D] focus:outline-none';
const inpNum = 'w-[5.5rem] rounded-md border border-[#333844] bg-[#111318] px-2 py-2 text-[14px] font-semibold tabular-nums text-[#E7E9ED] placeholder-[#565B68] focus:border-[#D97D3D] focus:outline-none';

function Campo({ label, hint, className = '', children }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1 block text-[11px] font-medium text-[#9DA2AE]">{label}</span>
            {children}
            {hint ? <span className="mt-1 block text-[10px] leading-snug text-[#565B68]">{hint}</span> : null}
        </label>
    );
}

function MiniCard({ peca, cliente, tempoCorteLabel, tempoSetupLabel, quantidade, revelado }) {
    return (
        <div
            className={`overflow-hidden rounded-[10px] border border-[#D97D3D]/55 bg-[#181B22] shadow-[0_12px_32px_-16px_rgba(217,125,61,0.5)] transition-all duration-500 ${
                revelado ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
        >
            <div className="flex items-center justify-between border-b border-[#262A33] bg-[#1F232B] px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#D97D3D]">
                    <Zap className="h-3 w-3" />
                    Eletrofio
                </div>
                <span className="rounded border border-[#333844] bg-[#111318] px-1.5 py-0.5 text-[9px] uppercase text-[#7B808F]">A fazer</span>
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

export default function CalculadoraEdmSection({ onRegister, onLogin }) {
    const [peca, setPeca] = useState('INSERTO-042');
    const [cliente, setCliente] = useState('');
    const [perimetro, setPerimetro] = useState('420');
    const [espessura, setEspessura] = useState('40');
    const [velocidade, setVelocidade] = useState('45');
    const [eficiencia, setEficiencia] = useState(85);
    const [quantidade, setQuantidade] = useState(1);
    const [setupH, setSetupH] = useState('');
    const [setupM, setSetupM] = useState('');

    const setupMinutos = useMemo(() => {
        const h = Math.max(0, parseInt(setupH, 10) || 0);
        const m = Math.max(0, parseInt(setupM, 10) || 0);
        return h * 60 + m;
    }, [setupH, setupM]);

    const resultado = useMemo(
        () => calcularTempoPorArea({
            perimetroMm: perimetro,
            espessuraMm: espessura,
            velocidadeMm2Min: velocidade,
            eficienciaPct: eficiencia,
            quantidade,
        }),
        [perimetro, espessura, velocidade, eficiencia, quantidade],
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
                espessura,
                velocidade,
                eficiencia,
                quantidade: qtd,
                setupMinutos,
                totalMinutos: resultado.totalMinutos,
                totalComSetupMinutos: totalComSetup.totalMinutos,
                areaMm2: resultado.areaMm2,
            }));
        } catch { /* ignore */ }
        onRegister?.();
    };

    return (
        <section id="calculadora" className="border-t border-[#262A33] scroll-mt-20">
            <div className="mx-auto max-w-[1080px] px-5 py-16 sm:px-6 sm:py-20">
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#7B808F]">Ferramenta gratuita · WEDM</p>
                <h2 className="mt-3 max-w-[20ch] font-['Space_Grotesk'] text-[28px] font-medium leading-tight tracking-tight text-white sm:text-[32px]">
                    Calculadora de eletroerosão a fio
                </h2>
                <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#9DA2AE]">
                    Perímetro, espessura e velocidade da máquina. O tempo vira um cartão no kanban — o mesmo quadro do chão de fábrica.
                </p>

                <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
                    <div className="rounded-xl border border-[#262A33] bg-[#181B22] p-4 sm:p-5">
                        <div className="mb-4 flex items-center gap-2.5">
                            <div className="rounded-md bg-[#D97D3D] p-1.5 text-[#111318]">
                                <Calculator className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-['Space_Grotesk'] text-[14px]">Dados do corte</p>
                                <p className="text-[11px] text-[#7B808F]">Só o essencial para estimar o tempo</p>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-2.5">
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
                                <Campo label="Espessura" hint="mm">
                                    <input className={inpNum} type="number" inputMode="decimal" min="0" step="0.1" value={espessura} onChange={(e) => setEspessura(e.target.value)} />
                                </Campo>
                                <Campo label="Velocidade" hint="mm²/min">
                                    <input className={inpNum} type="number" inputMode="decimal" min="0" step="0.1" value={velocidade} onChange={(e) => setVelocidade(e.target.value)} />
                                </Campo>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-3">
                                <Campo label="Peças" hint="qtd.">
                                    <input className={inpNum} type="number" inputMode="numeric" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                                </Campo>
                                <Campo label="Set-up h" hint="opc.">
                                    <input className={inpNum} type="number" inputMode="numeric" min="0" value={setupH} onChange={(e) => setSetupH(e.target.value)} placeholder="0" />
                                </Campo>
                                <Campo label="Set-up min" hint="opc.">
                                    <input className={inpNum} type="number" inputMode="numeric" min="0" max="59" value={setupM} onChange={(e) => setSetupM(e.target.value)} placeholder="0" />
                                </Campo>
                            </div>

                            <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-[#9DA2AE]">Eficiência esperada</p>
                                        <p className="mt-0.5 text-[10px] leading-snug text-[#565B68]">
                                            A velocidade do catálogo é em trecho reto. Cantos, entradas, soldas e distâncias dos bicos deixam o corte mais lento — a eficiência reduz o ritmo “de papel” para algo mais realista.
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

                        <div className="mt-4 rounded-lg border border-[#333844] bg-[#111318] p-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#7B808F]">
                                <Clock className="h-3.5 w-3.5" />
                                Tempo total estimado
                            </div>
                            <p className="mt-0.5 font-['Space_Grotesk'] text-[28px] font-medium text-white sm:text-[32px]">
                                {rotuloTempo(pronto ? totalComSetup : resultado)}
                            </p>
                            {pronto ? (
                                <p className="mt-0.5 text-[11px] text-[#565B68]">
                                    Corte {rotuloTempo(resultado)}
                                    {setupMinutos > 0 ? ` · Setup ${tempoSetupLabel}` : ''}
                                    {' · '}{qtd} pç
                                    {' · '}{Math.round(resultado.areaMm2).toLocaleString('pt-BR')} mm²
                                </p>
                            ) : (
                                <p className="mt-0.5 text-[11px] text-[#565B68]">Preencha perímetro, espessura e velocidade</p>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <div className="overflow-hidden rounded-xl border border-[#262A33] bg-[#0E1015]">
                            <div className="border-b border-[#262A33] px-3 py-2.5 sm:px-4">
                                <p className="font-['Space_Grotesk'] text-[13px] text-[#E7E9ED]">Quadro · Centro Eletrofio</p>
                                <p className="text-[10px] text-[#565B68]">Prévia do kanban — deslize as colunas no celular</p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto overscroll-x-contain p-2.5 pb-3 [-webkit-overflow-scrolling:touch]">
                                {COLUNAS.map((col) => {
                                    const tema = TEMA[col.key];
                                    const mostra = pronto && col.key === 'aFazer';
                                    return (
                                        <div
                                            key={col.key}
                                            className="flex w-[168px] shrink-0 flex-col rounded-lg border border-[#262A33] bg-[#111318] sm:w-[180px] lg:min-h-[200px] lg:w-0 lg:min-w-0 lg:flex-1"
                                        >
                                            <div className="flex items-center justify-between border-b border-[#262A33] px-2 py-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: tema.barra }} />
                                                    <span className="text-[9px] font-semibold tracking-wide text-[#9DA2AE]">{tema.titulo}</span>
                                                </div>
                                                <span className="font-['IBM_Plex_Mono'] text-[9px] text-[#565B68]">{mostra ? 1 : 0}</span>
                                            </div>
                                            <div className="flex-1 p-1.5">
                                                {mostra ? (
                                                    <MiniCard
                                                        peca={peca}
                                                        cliente={cliente}
                                                        tempoCorteLabel={rotuloTempo(resultado)}
                                                        tempoSetupLabel={tempoSetupLabel}
                                                        quantidade={qtd}
                                                        revelado={pronto}
                                                    />
                                                ) : (
                                                    <div className="flex h-full min-h-[120px] items-center justify-center rounded border border-dashed border-[#262A33]">
                                                        <span className="text-[9px] uppercase tracking-wider text-[#3A3F4A]">Vazio</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`rounded-xl border p-4 sm:p-5 ${pronto ? 'border-[#D97D3D]/45 bg-gradient-to-br from-[#D97D3D]/15 to-transparent' : 'border-[#262A33] bg-[#181B22]'}`}>
                            <p className="font-['Space_Grotesk'] text-[16px] text-white sm:text-[18px]">
                                {pronto ? 'Esse cartão já nasceu. Quer salvá-lo no quadro da fábrica?' : 'O resultado aparece no kanban ao lado.'}
                            </p>
                            <p className="mt-2 text-[12px] leading-relaxed text-[#9DA2AE] sm:text-[13px]">
                                No EDM Lean o tempo previsto vira O.S. no chão. Teste 30 dias, sem cartão.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={salvar}
                                    disabled={!pronto}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#D97D3D] px-4 py-2.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] disabled:cursor-not-allowed disabled:opacity-40"
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
                </div>
            </div>
        </section>
    );
}
