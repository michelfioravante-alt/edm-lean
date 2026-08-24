import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';

const NAV = [
    { id: 'produto', label: 'Produto' },
    { id: 'uso', label: 'Uso' },
];

export default function LandingPage({ onLogin, onRegister }) {
    const [active, setActive] = useState('home');
    const [menuOpen, setMenuOpen] = useState(false);
    const enterLocalStudyMode = useAuthStore((s) => s.enterLocalStudyMode);
    const local = isLocalMode();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: '-35% 0px -50% 0px', threshold: 0 },
        );
        ['home', 'produto', 'uso'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const go = (e, id) => {
        e.preventDefault();
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${id}`);
        setActive(id);
    };

    return (
        <div className="min-h-screen bg-[#111318] text-[#E7E9ED]">
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
                        <button
                            type="button"
                            onClick={onLogin}
                            className="rounded-md border border-[#333844] px-3.5 py-1.5 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/50 hover:text-white"
                        >
                            Entrar
                        </button>
                        {!local && (
                            <button
                                type="button"
                                onClick={onRegister}
                                className="hidden rounded-md bg-[#D97D3D] px-3.5 py-1.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] sm:inline"
                            >
                                Criar conta
                            </button>
                        )}
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
                    </div>
                )}
            </header>

            <main>
                <section id="home" className="mx-auto max-w-[1080px] px-6 pb-24 pt-20 sm:pt-28">
                    <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">
                        Produção · Matrizaria · CNC · Eletrofio
                    </p>
                    <h1 className="mt-5 max-w-[18ch] font-['Space_Grotesk'] text-[40px] font-medium leading-[1.12] tracking-tight text-white sm:text-[56px]">
                        Ordem na oficina. Sem o peso de um ERP.
                    </h1>
                    <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-[#9DA2AE]">
                        Software de chão de fábrica para pequenas matrizarias: kanban por setor, roteiro da peça, folha de processo e estoque de ferramenta — no mesmo lugar.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={onLogin}
                            className="rounded-md bg-[#D97D3D] px-5 py-2.5 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32]"
                        >
                            Entrar
                        </button>
                        {local ? (
                            <button
                                type="button"
                                onClick={() => enterLocalStudyMode('admin')}
                                className="text-[13px] text-[#9DA2AE] underline-offset-4 hover:text-[#E7E9ED] hover:underline"
                            >
                                Abrir exemplo
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onRegister}
                                className="text-[13px] text-[#9DA2AE] underline-offset-4 hover:text-[#E7E9ED] hover:underline"
                            >
                                Criar conta
                            </button>
                        )}
                    </div>
                </section>

                <section id="produto" className="border-t border-[#262A33]">
                    <div className="mx-auto max-w-[1080px] px-6 py-20">
                        <p className="text-[12px] tracking-[0.18em] text-[#7B808F] uppercase">Produto</p>
                        <h2 className="mt-3 max-w-[22ch] font-['Space_Grotesk'] text-[28px] font-medium tracking-tight text-white sm:text-[32px]">
                            O que a oficina precisa acompanhar, e nada além disso.
                        </h2>
                        <div className="mt-14 divide-y divide-[#262A33] border-y border-[#262A33]">
                            {[
                                ['Quadro', 'Kanban de CNC e eletrofio: fila, preparação, usinagem ou corte, inspeção e concluído.'],
                                ['Roteiro', 'CNC, eletrofio, laser, retífica, torno, montagem e serviço externo (têmpera, terceira).'],
                                ['Folha A4', 'Peça, quantidade, desenho, programa CAM, imagem e QR para o cartão. Impressão em formato A4.'],
                                ['CAM e estoque', 'Importação de folha NX, Mastercam ou SolidCAM. Baixa de insert, fresa e fio com alerta de reposição.'],
                                ['Qualidade', 'Inspeção em aprovada ou refugo. Retrabalho gera um novo cartão ligado à O.S. original.'],
                                ['Gestão', 'Carteira de prazos, previsto versus real de máquina, pausas com motivo, clientes e registros.'],
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
                                Três pessoas, um fluxo.
                            </h2>
                            <ol className="mt-10 space-y-8">
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Gestor</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Abre a ordem, define o roteiro e acompanha prazo e carteira.</p>
                                </li>
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Programador</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Importa a folha CAM, aponta o programa e confirma ferramentas no estoque.</p>
                                </li>
                                <li>
                                    <p className="text-[14px] text-[#E7E9ED]">Operador</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#7B808F]">Move o cartão, registra pausa, imprime a folha e faz a inspeção.</p>
                                </li>
                            </ol>
                        </div>
                        <div className="lg:pt-10">
                            <p className="text-[14px] leading-relaxed text-[#9DA2AE]">
                                Pensado para ferramentarias de poucas pessoas — CNC 3 e 5 eixos, eletrofio e um pouco de serviço fora de casa. Não substitui contabilidade nem ERP fiscal.
                            </p>
                            <p className="mt-6 text-[14px] leading-relaxed text-[#7B808F]">
                                Acesso por conta e PIN no terminal. Equipe entra por convite.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <button
                                    type="button"
                                    onClick={onLogin}
                                    className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/40"
                                >
                                    Entrar
                                </button>
                                {local && (
                                    <button
                                        type="button"
                                        onClick={() => enterLocalStudyMode('admin')}
                                        className="text-[13px] text-[#7B808F] hover:text-[#E7E9ED]"
                                    >
                                        Ver com dados de exemplo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#262A33]">
                <div className="mx-auto flex max-w-[1080px] flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#565B68]">© 2026 EDM Lean</p>
                    <p className="text-[12px] text-[#565B68]">Pequenas matrizarias · CNC · Eletroerosão a fio</p>
                </div>
            </footer>
        </div>
    );
}
