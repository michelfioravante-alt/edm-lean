import React, { useEffect, useRef, useState } from 'react';
import { HelpButton } from '../components/common/HelpModal';
import CalculadoraEdmSection from '../components/landing/CalculadoraEdmSection';
import PainelIndicadores from '../components/landing/PainelIndicadores';

const NAV = [
    { id: 'calculadora', label: 'Calculadora' },
    { id: 'telas', label: 'Telas' },
    { id: 'indicadores', label: 'Indicadores' },
    { id: 'produto', label: 'Produto' },
    { id: 'uso', label: 'Uso' },
];

function Janela({ className = '', children }) {
    return (
        <figure className={`overflow-hidden rounded-lg border border-[#262A33] bg-[#181B22] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] ${className}`}>
            <div className="flex items-center gap-1.5 border-b border-[#262A33] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#333844]" />
                <span className="h-2 w-2 rounded-full bg-[#333844]" />
                <span className="h-2 w-2 rounded-full bg-[#333844]" />
            </div>
            {children}
        </figure>
    );
}

function Captura({ src, alt, largura, altura, className = '' }) {
    return (
        <Janela className={className}>
            <img src={src} alt={alt} width={largura} height={altura} loading="lazy" decoding="async" className="block h-auto w-full" />
        </Janela>
    );
}

const TITULO = ['Ordem', 'na', 'ferramentaria.', 'Sem', 'o', 'peso', 'de', 'um', 'ERP.'];
const PASSO_TITULO_MS = 90;

function TituloAnimado() {
    const fimPalavras = (TITULO.length - 1) * PASSO_TITULO_MS + 700;
    return (
        <>
            <span className="sr-only">{TITULO.join(' ')}</span>
            <span aria-hidden>
                {TITULO.map((palavra, i) => {
                    const ultima = i === TITULO.length - 1;
                    return (
                        <React.Fragment key={palavra + i}>
                            <span className="titulo-palavra" style={{ animationDelay: `${i * PASSO_TITULO_MS}ms` }}>
                                {ultima ? (
                                    <>
                                        <span className="titulo-riscado" style={{ '--atraso-risco': `${fimPalavras}ms` }}>ERP</span>.
                                    </>
                                ) : palavra}
                            </span>
                            {i < TITULO.length - 1 && ' '}
                        </React.Fragment>
                    );
                })}
            </span>
        </>
    );
}

function VideoFluxo({ className = '' }) {
    const ref = useRef(null);

    // React não grava o atributo `muted` no HTML; sem ele o navegador bloqueia o autoplay.
    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        video.muted = true;
        video.setAttribute('muted', '');
        video.play().catch(() => {});
    }, []);

    return (
        <Janela className={className}>
            <video
                ref={ref}
                src="/landing/fluxo.mp4"
                poster="/landing/fluxo-capa.jpg"
                width={1440}
                height={900}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Gravação do quadro: o operador confirma o checklist, o cartão vai para usinagem e depois é pausado por troca de inserto"
                className="block h-auto w-full"
            />
        </Janela>
    );
}

export default function LandingPage({ onLogin, onRegister }) {
    const [active, setActive] = useState('home');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: '-35% 0px -50% 0px', threshold: 0 },
        );
        ['home', 'calculadora', 'telas', 'indicadores', 'produto', 'uso'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const id = (window.location.hash || '').replace(/^#/, '');
        if (!id || id === 'home') return;
        const t = setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(id);
        }, 80);
        return () => clearTimeout(t);
    }, []);

    const go = (e, id) => {
        e.preventDefault();
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${id}`);
        setActive(id);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#111318] text-[#E7E9ED]">
            <header className="sticky top-0 z-20 border-b border-[#262A33]/80 bg-[#111318]/85 backdrop-blur-md">
                <div className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between px-6">
                    <a href="#home" onClick={(e) => go(e, 'home')} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333844] bg-[#181B22] text-[11px] font-semibold tracking-wide text-[#D97D3D]">
                            EL
                        </span>
                        <span className="font-['Space_Grotesk'] text-[15px] tracking-tight">
                            EDM Lean
                        </span>
                    </a>

                    <nav className="hidden items-center gap-10 md:flex">
                        {NAV.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={(e) => go(e, item.id)}
                                className={`text-[13px] tracking-wide ${active === item.id ? 'text-[#E7E9ED]' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <HelpButton className="hidden items-center gap-1 text-[13px] text-[#7B808F] hover:text-[#E7E9ED] sm:inline-flex" />
                        <button
                            type="button"
                            onClick={onLogin}
                            className="rounded-md border border-[#333844] px-3.5 py-1.5 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/50 hover:text-white"
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={onRegister}
                            className="hidden rounded-md bg-[#D97D3D] px-3.5 py-1.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] sm:inline"
                        >
                            Criar conta
                        </button>
                        <button
                            type="button"
                            className="p-1 text-[#9DA2AE] md:hidden"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Menu"
                        >
                            {menuOpen ? 'Fechar' : 'Menu'}
                        </button>
                    </div>
                </div>
                {menuOpen && (
                    <div className="border-t border-[#262A33] px-6 py-4 md:hidden">
                        {NAV.map((item) => (
                            <a key={item.id} href={`#${item.id}`} onClick={(e) => go(e, item.id)} className="block py-2 text-sm text-[#9DA2AE]">
                                {item.label}
                            </a>
                        ))}
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onRegister(); }}
                            className="mt-2 w-full rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318]"
                        >
                            Criar conta grátis
                        </button>
                    </div>
                )}
            </header>

            <main>
                <section id="home" className="mx-auto max-w-[1080px] px-6 pb-24 pt-20 sm:pt-28">
                    <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">
                        Produção · Ferramentaria · CNC · Eletrofio
                    </p>
                    <h1 className="mt-5 max-w-[18ch] font-['Space_Grotesk'] text-[40px] font-medium leading-[1.12] tracking-tight text-white sm:text-[56px]">
                        <TituloAnimado />
                    </h1>
                    <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-[#9DA2AE]">
                        Software de chão de fábrica para equipes pequenas: kanban por setor, roteiro da peça, folha de processo e estoque de ferramenta — no mesmo lugar.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={onRegister}
                            className="rounded-md bg-[#D97D3D] px-5 py-2.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32]"
                        >
                            Testar 30 dias grátis
                        </button>
                        <button
                            type="button"
                            onClick={(e) => go(e, 'calculadora')}
                            className="rounded-md border border-[#333844] px-5 py-2.5 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/50"
                        >
                            Calculadora de eletrofio
                        </button>
                        <button
                            type="button"
                            onClick={onLogin}
                            className="text-[13px] text-[#9DA2AE] underline-offset-4 hover:text-[#E7E9ED] hover:underline"
                        >
                            Já tenho conta
                        </button>
                    </div>
                    <p className="mt-4 text-[12px] text-[#565B68]">Sem cartão de crédito. Seus dados ficam só com a sua empresa.</p>

                    <div className="relative mt-16 overflow-hidden">
                        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 bottom-1/2 rounded-full bg-[#D97D3D]/10 blur-3xl" />
                        <VideoFluxo className="relative" />
                        <p className="mt-3 text-[12px] text-[#565B68]">Quadro do centro CNC: o operador confirma o checklist, o cartão vai para a usinagem e a pausa entra com o motivo (ex.: troca de inserto).</p>
                    </div>
                </section>

                <CalculadoraEdmSection onRegister={onRegister} onLogin={onLogin} />

                <section id="telas" className="border-t border-[#262A33]">
                    <div className="mx-auto max-w-[1080px] space-y-24 px-6 py-20">
                        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.6fr]">
                            <div>
                                <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Gestor</p>
                                <h2 className="mt-3 font-['Space_Grotesk'] text-[26px] font-medium leading-tight tracking-tight text-white">
                                    Abre o sistema e já sabe onde agir.
                                </h2>
                                <p className="mt-4 text-[14px] leading-relaxed text-[#7B808F]">
                                    O que está atrasado, o que travou esperando programa, o que está no terceiro e o que já pode ser cobrado. Avisos de estoque baixo no mesmo lugar.
                                </p>
                            </div>
                            <Captura
                                src="/landing/gestor.webp"
                                alt="Tela inicial do gestor com atrasos, peças travadas, prontas para cobrar e avisos de estoque"
                                largura={3360}
                                altura={1800}
                            />
                        </div>

                        <div className="grid items-center gap-10 lg:grid-cols-[1.6fr_1fr]">
                            <figure className="order-2 overflow-hidden rounded-lg border border-[#262A33] bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] lg:order-1">
                                <img
                                    src="/landing/folha.webp"
                                    alt="Folha de processo A4 com código da peça, quantidade, setor, prazo e QR code"
                                    width={1588}
                                    height={650}
                                    loading="lazy"
                                    decoding="async"
                                    className="block h-auto w-full"
                                />
                            </figure>
                            <div className="order-1 lg:order-2">
                                <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Chão de fábrica</p>
                                <h2 className="mt-3 font-['Space_Grotesk'] text-[26px] font-medium leading-tight tracking-tight text-white">
                                    A folha acompanha a peça. O QR abre o cartão.
                                </h2>
                                <p className="mt-4 text-[14px] leading-relaxed text-[#7B808F]">
                                    Folha A4 impressa com código, quantidade, prazo e desenho. O operador aponta o celular para o QR e move o cartão sem procurar no sistema.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="indicadores" className="border-t border-[#262A33] scroll-mt-20">
                    <div className="mx-auto max-w-[1080px] px-6 py-20">
                        <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Indicadores</p>
                        <h2 className="mt-3 max-w-[22ch] font-['Space_Grotesk'] text-[28px] font-medium tracking-tight text-white sm:text-[32px]">
                            Números do chão, sem planilha à parte.
                        </h2>
                        <p className="mt-4 max-w-[540px] text-[14px] leading-relaxed text-[#9DA2AE]">
                            O painel de controle mostra eficiência, FPY, lead time, WIP e atrasos — com legenda de como cada número é calculado.
                        </p>

                        <div className="mt-12">
                            <PainelIndicadores />
                        </div>
                    </div>
                </section>

                <section id="produto" className="border-t border-[#262A33]">
                    <div className="mx-auto max-w-[1080px] px-6 py-20">
                        <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Produto</p>
                        <h2 className="mt-3 max-w-[22ch] font-['Space_Grotesk'] text-[28px] font-medium tracking-tight text-white sm:text-[32px]">
                            O que a ferramentaria precisa acompanhar, e nada além disso.
                        </h2>
                        <div className="mt-14 divide-y divide-[#262A33] border-y border-[#262A33]">
                            {[
                                ['Quadro', 'Kanban de CNC e eletrofio: fila, preparação, usinagem ou corte, inspeção e concluído.'],
                                ['Roteiro', 'CNC, eletrofio, laser, retífica, torno, montagem e serviço externo (têmpera, terceira).'],
                                ['Folha A4', 'Peça, quantidade, desenho, programa, imagem e QR para o cartão. Impressão em formato A4.'],
                                ['Estoque', 'Baixa de inserto, fresa e fio com alerta de reposição.'],
                                ['Qualidade', 'Inspeção em aprovada ou refugo. Retrabalho gera um novo cartão ligado à O.S. original.'],
                                ['Gestão', 'Indicadores de eficiência, FPY, WIP e atrasos; carteira de prazos; previsto versus real; clientes e registros.'],
                            ].map(([title, text]) => (
                                <div key={title} className="grid gap-2 py-6 sm:grid-cols-[180px_1fr] sm:gap-10">
                                    <p className="text-[14px] font-medium text-[#E7E9ED]">{title}</p>
                                    <p className="text-[14px] leading-relaxed text-[#7B808F]">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="uso" className="border-t border-[#262A33]">
                    <div className="mx-auto grid max-w-[1080px] gap-16 px-6 py-20 lg:grid-cols-2">
                        <div>
                            <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Uso</p>
                            <h2 className="mt-3 font-['Space_Grotesk'] text-[28px] font-medium tracking-tight text-white">
                                Três perfis, um fluxo.
                            </h2>
                            <ol className="mt-10 space-y-8">
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Gestor</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Abre a ordem, define o roteiro e acompanha prazo e carteira.</p>
                                </li>
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Programador</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Aponta o programa, registra tempos previstos e confirma ferramentas no estoque.</p>
                                </li>
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Operador</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Move o cartão, registra pausa, imprime a folha e faz a inspeção.</p>
                                </li>
                            </ol>
                        </div>
                        <div className="lg:pt-10">
                            <p className="text-[14px] leading-relaxed text-[#9DA2AE]">
                                Pensado para equipes pequenas — centros de usinagem, eletrofio e um pouco de serviço fora de casa. Não substitui contabilidade nem ERP fiscal.
                            </p>
                            <p className="mt-6 text-[14px] leading-relaxed text-[#7B808F]">
                                Acesso por conta e PIN no terminal. Equipe entra por convite.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="rounded-md bg-[#D97D3D] px-4 py-2 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32]"
                                >
                                    Testar 30 dias grátis
                                </button>
                                <button
                                    type="button"
                                    onClick={onLogin}
                                    className="text-[13px] text-[#7B808F] hover:text-[#E7E9ED]"
                                >
                                    Entrar
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#262A33]">
                <div className="mx-auto flex max-w-[1080px] flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#565B68]">© 2026 EDM Lean</p>
                    <div className="flex items-center gap-4">
                        <HelpButton className="inline-flex items-center gap-1 text-[12px] text-[#565B68] hover:text-[#E7E9ED]" />
                        <p className="text-[12px] text-[#565B68]">Pequenas ferramentarias · centros de usinagem · eletrofio</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
