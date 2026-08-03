import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { 
    Zap, 
    Cpu, 
    Cog, 
    ArrowRight, 
    ShieldCheck, 
    Layers, 
    Boxes, 
    Clock, 
    Activity, 
    CheckCircle2,
    FileText,
    Wrench
} from 'lucide-react';

export default function LandingPage({ onLogin, onRegister }) {
    const [activeSection, setActiveSection] = useState('home');
    const enterLocalStudyMode = useAuthStore((s) => s.enterLocalStudyMode);

    useEffect(() => {
        const sections = ['home', 'maquinas', 'recursos', 'seguranca'];
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.unobserve(el);
            });
        };
    }, []);

    const handleNavClick = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.pushState(null, '', `#${id}`);
            setActiveSection(id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden relative w-full selection:bg-amber-500/30">
            {/* BACKGROUND GLOWS */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute top-[35%] right-[-10%] w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]"></div>
            </div>

            {/* HEADER */}
            <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center border border-amber-300/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <Cpu className="w-6 h-6 text-slate-950 font-black" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-wider text-white">
                                LEAN <span className="text-amber-400">SHOPFLOOR</span>
                            </span>
                            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">EDM & CNC Machining MES</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={`text-sm font-bold transition-all ${activeSection === 'home' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>Início</a>
                        <a href="#maquinas" onClick={(e) => handleNavClick(e, 'maquinas')} className={`text-sm font-bold transition-all ${activeSection === 'maquinas' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>Máquinas Suportadas</a>
                        <a href="#recursos" onClick={(e) => handleNavClick(e, 'recursos')} className={`text-sm font-bold transition-all ${activeSection === 'recursos' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>Recursos Lean</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {isLocalMode() ? (
                            <button 
                                onClick={() => enterLocalStudyMode('admin')}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer animate-bounce-subtle"
                            >
                                <span>Entrar sem Senha (Modo Estudo)</span>
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <>
                                <button onClick={onLogin} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Acessar Conta</button>
                                <button onClick={onRegister} className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:scale-105 transition-all">Criar Fábrica</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section id="home" className="relative z-10 pt-16 pb-20 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-amber-400 shadow-sm">
                        <Zap size={14} className="animate-pulse text-amber-400" />
                        Plataforma Integrada de Gestão para Chão de Fábrica & Ferramentarias
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
                        O Kanban Lean Especializado para <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400">
                            Centros de Usinagem, Eletroerosão e Tornos CNC
                        </span>
                    </h1>

                    <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                        Gerencie a produção por setor produtivo com controle de OEE, vida útil de ferramentas de corte, importação automática de folhas CAM e rastreamento de insumos.
                    </p>

                    {/* HERO ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_35px_rgba(16,185,129,0.3)] text-base cursor-pointer"
                        >
                            <CheckCircle2 size={22} />
                            <span>Entrar no Sistema Agora (Sem Cadastro)</span>
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={onLogin}
                            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-base cursor-pointer"
                        >
                            Acessar com Login
                        </button>
                    </div>

                    {/* BADGES DA APLICAÇÃO */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-900 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span>Centros de Usinagem (3 / 5 Eixos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Eletroerosão a Fio (WEDM)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>Tornos CNC & Torneamento</span>
                        </div>
                    </div>

                </div>
            </section>

            {/* SEÇÃO: MÁQUINAS SUPORTADAS */}
            <section id="maquinas" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
                <div className="text-center mb-16">
                    <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">Tecnologias Cobertas</h2>
                    <h3 className="text-3xl sm:text-4xl font-black text-white">Especializado na Realidade das Suas Máquinas CNC</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* CARD 1: CENTRO DE USINAGEM */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group">
                        <div>
                            <div className="w-14 h-14 bg-cyan-950 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                                <Cpu size={32} />
                            </div>
                            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Setor 1</span>
                            <h4 className="text-2xl font-black text-white mt-1 mb-4">Centros de Usinagem CNC</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Suporte a operações de 3, 4 e 5 eixos. Gestão completa de multi-setup (viradas de peça) e magazining de ferramentas.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Importação de folhas CAM (NX, Mastercam, SolidCAM)</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Controle de vida útil de fresas, brocas e inserts</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Motivos de parada por quebra de ferramenta e offset</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban CNC</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* CARD 2: ELETROEROSÃO A FIO */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-500/50 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group">
                        <div>
                            <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={32} />
                            </div>
                            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Setor 2</span>
                            <h4 className="text-2xl font-black text-white mt-1 mb-4">Eletroerosão a Fio (WEDM)</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Projetado para o corte de precisão em matrizes, punções e placas de ferramentaria.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Registro por perímetro (mm), passadas e acabamento Ra</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Controle de consumíveis: Fio de latão, resina e filtros</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Paradas por quebra de fio e passagem automática (threading)</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban EDM</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* CARD 3: TORNOS CNC */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] group">
                        <div>
                            <div className="w-14 h-14 bg-amber-950 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                                <Cog size={32} />
                            </div>
                            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Setor 3</span>
                            <h4 className="text-2xl font-black text-white mt-1 mb-4">Tornos CNC & Torneamento</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Gestão de usinagem cilíndrica, eixos, buchas e peças de revolução com torre multiferramentas.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400" /> Controle de pastilhas/inserts de torneamento e rosqueamento</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400" /> Tempo de ciclo por lote de barras ou peças unitárias</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400" /> Rastreio de paradas de setup de castanhas e encostos</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-amber-950 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban Torno</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                </div>
            </section>

            {/* SEÇÃO: RECURSOS LEAN */}
            <section id="recursos" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Metodologia Industrial</span>
                        <h3 className="text-3xl font-black text-white mt-2 mb-6">OEE Automático & Sistema Andon Integrado</h3>
                        <p className="text-slate-400 text-base font-medium leading-relaxed mb-6">
                            Elimine planilhas e quadros de papel. O sistema calcula a Disponibilidade, Performance e Qualidade da sua ferramentaria automaticamente por máquina e por setor.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                <Activity className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-extrabold text-white">Indicadores em Tempo Real</h4>
                                    <p className="text-xs text-slate-400 mt-1">Acompanhe quais máquinas estão em ciclo, pausadas ou em setup instantaneamente.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                <Wrench className="w-6 h-6 text-cyan-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-extrabold text-white">Controle de Ferramental & Estoque</h4>
                                    <p className="text-xs text-slate-400 mt-1">Saiba a vida útil restante de cada fresa e receba alertas de estoque de inserts antes da peça parar.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 text-center shadow-2xl">
                        <h4 className="text-2xl font-black text-white mb-4">Pronto para Testar na Prática?</h4>
                        <p className="text-slate-400 text-sm font-medium mb-8">
                            Acesse o ambiente local completo com dados de exemplo de ferramentaria sem precisar criar conta ou digitar senha.
                        </p>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-base transition-all shadow-[0_8px_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <Zap className="w-6 h-6 fill-slate-950" />
                            <span>Abrir Sistema em Modo Estudo (1-Clique)</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-slate-900 py-8 px-6 text-center text-xs font-bold text-slate-600 uppercase tracking-widest">
                <p>&copy; 2026 Lean Shopfloor • Plataforma MES para Centros de Usinagem, Fio e Tornos CNC</p>
            </footer>
        </div>
    );
}
