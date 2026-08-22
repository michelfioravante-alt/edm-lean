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
        <div className="min-h-screen bg-[#111318] text-white font-sans overflow-x-hidden relative w-full selection:bg-amber-500/30">
            {/* BACKGROUND GLOWS */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-[#7B808F]/10 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute top-[35%] right-[-10%] w-[550px] h-[550px] bg-[rgba(74,157,116,0.1)] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[rgba(217,125,61,0.1)] rounded-full blur-[140px]"></div>
            </div>

            {/* HEADER */}
            <header className="relative z-10 border-b border-[#262A33] bg-[#111318]/80 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D97D3D] rounded-xl flex items-center justify-center border border-[#D97D3D] shadow-[0_0_20px_rgba(217,125,61,0.25)]">
                            <Cpu className="w-6 h-6 text-[#111318] font-semibold" />
                        </div>
                        <div>
                            <span className="text-xl font-semibold tracking-wider text-white">
                                EDM <span className="text-[#D97D3D]">Lean</span>
                            </span>
                            <span className="block text-[9px] font-semibold uppercase tracking-widest text-[#7B808F]">EDM & CNC Machining MES</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={`text-sm font-bold transition-all ${activeSection === 'home' ? 'text-[#D97D3D]' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}>Início</a>
                        <a href="#maquinas" onClick={(e) => handleNavClick(e, 'maquinas')} className={`text-sm font-bold transition-all ${activeSection === 'maquinas' ? 'text-[#D97D3D]' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}>Máquinas Suportadas</a>
                        <a href="#recursos" onClick={(e) => handleNavClick(e, 'recursos')} className={`text-sm font-bold transition-all ${activeSection === 'recursos' ? 'text-[#D97D3D]' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}>Recursos Lean</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {isLocalMode() ? (
                            <button 
                                onClick={() => enterLocalStudyMode('admin')}
                                className="px-5 py-2.5 bg-[#4A9D74] hover:bg-[#3d8763] text-[#111318] font-semibold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(217,125,61,0.25)] flex items-center gap-2 cursor-pointer animate-bounce-subtle"
                            >
                                <span>Explorar Modo Demonstração (Sem Cadastro)</span>
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <>
                                <button onClick={onLogin} className="text-sm font-semibold text-[#7B808F] hover:text-[#E7E9ED] transition-colors">Acessar Conta</button>
                                <button onClick={onRegister} className="px-5 py-2.5 bg-amber-500 text-[#111318] font-bold rounded-xl text-sm hover:scale-105 transition-all">Criar Fábrica</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section id="home" className="relative z-10 pt-16 pb-20 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#181B22] border border-[#262A33] rounded-full text-xs font-bold text-[#D97D3D] shadow-sm">
                        <Zap size={14} className="animate-pulse text-[#D97D3D]" />
                        Plataforma Integrada de Gestão para Chão de Fábrica & Ferramentarias
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-semibold text-white leading-tight tracking-tight">
                        O Kanban Lean Especializado para <br />
                        <span className="text-[#D97D3D]">
                            Centros de Usinagem, Eletroerosão e Tornos CNC
                        </span>
                    </h1>

                    <p className="text-[#E7E9ED] text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                        Gerencie a produção por setor produtivo com controle de Eficiência Operacional, aderência aos tempos de CAM, vida útil de ferramentas de corte e rastreamento de insumos.
                    </p>

                    {/* HERO ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="px-8 py-4 bg-[#D97D3D] hover:bg-[#c46d32] text-[#111318] font-semibold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_35px_rgba(217,125,61,0.25)] text-base cursor-pointer"
                        >
                            <CheckCircle2 size={22} />
                            <span>Abrir Modo Demonstração Interativo (1-Clique)</span>
                            <ArrowRight size={20} />
                        </button>

                        <button
                            onClick={onLogin}
                            className="px-8 py-4 bg-[#181B22] hover:bg-[#1F232B] border border-[#333844] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-base cursor-pointer"
                        >
                            Acessar com Login
                        </button>
                    </div>

                    {/* BADGES DA APLICAÇÃO */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-[#262A33] text-xs font-semibold uppercase tracking-widest text-[#7B808F]">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#9DA2AE]"></span>
                            <span>Centros de Usinagem (3 / 5 Eixos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4A9D74]"></span>
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
            <section id="maquinas" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-[#262A33]">
                <div className="text-center mb-16">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[#D97D3D] mb-2">Tecnologias Cobertas</h2>
                    <h3 className="text-3xl sm:text-4xl font-semibold text-white">Especializado na Realidade das Suas Máquinas CNC</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* CARD 1: CENTRO DE USINAGEM */}
                    <div className="bg-[#181B22]/80 border border-[#262A33] rounded-[14px] p-8 flex flex-col justify-between hover:border-[#7B808F]/50 transition-all group">
                        <div>
                            <div className="w-14 h-14 bg-[#1F232B] border border-[#333844] rounded-2xl flex items-center justify-center text-[#9DA2AE] mb-6 group-hover:scale-110 transition-transform">
                                <Cpu size={32} />
                            </div>
                            <span className="text-xs font-semibold text-[#9DA2AE] uppercase tracking-widest">Setor 1</span>
                            <h4 className="text-2xl font-semibold text-white mt-1 mb-4">Centros de Usinagem CNC</h4>
                            <p className="text-[#7B808F] text-sm font-medium leading-relaxed mb-6">
                                Suporte a operações de 3, 4 e 5 eixos. Gestão completa de multi-setup (viradas de peça) e magazining de ferramentas.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-[#E7E9ED]">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#9DA2AE]" /> Importação de folhas CAM (NX, Mastercam, SolidCAM)</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#9DA2AE]" /> Controle de vida útil de fresas, brocas e inserts</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#9DA2AE]" /> Motivos de parada por quebra de ferramenta e offset</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-[#1F232B] hover:bg-[#262A33] border border-[#333844] text-[#9DA2AE] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban CNC</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* CARD 2: ELETROEROSÃO A FIO */}
                    <div className="bg-[#181B22]/80 border border-[#262A33] rounded-[14px] p-8 flex flex-col justify-between hover:border-[#4A9D74]/50 transition-all group">
                        <div>
                            <div className="w-14 h-14 bg-[rgba(74,157,116,0.1)] border border-[#4A9D74]/40 rounded-2xl flex items-center justify-center text-[#4A9D74] mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={32} />
                            </div>
                            <span className="text-xs font-semibold text-[#4A9D74] uppercase tracking-widest">Setor 2</span>
                            <h4 className="text-2xl font-semibold text-white mt-1 mb-4">Eletroerosão a Fio (WEDM)</h4>
                            <p className="text-[#7B808F] text-sm font-medium leading-relaxed mb-6">
                                Projetado para o corte de precisão em matrizes, punções e placas de ferramentaria.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-[#E7E9ED]">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4A9D74]" /> Registro por perímetro (mm), passadas e acabamento Ra</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4A9D74]" /> Controle de consumíveis: Fio de latão, resina e filtros</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4A9D74]" /> Paradas por quebra de fio e passagem automática (threading)</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-[rgba(74,157,116,0.1)] hover:bg-[rgba(74,157,116,0.18)] border border-[#4A9D74]/30 text-[#4A9D74] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban EDM</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* CARD 3: TORNOS CNC */}
                    <div className="bg-[#181B22]/80 border border-[#262A33] rounded-[14px] p-8 flex flex-col justify-between hover:border-[#D97D3D]/50 transition-all group">
                        <div>
                            <div className="w-14 h-14 bg-[rgba(217,125,61,0.12)] border border-[#D97D3D]/40 rounded-2xl flex items-center justify-center text-[#D97D3D] mb-6 group-hover:scale-110 transition-transform">
                                <Cog size={32} />
                            </div>
                            <span className="text-xs font-semibold text-[#D97D3D] uppercase tracking-widest">Setor 3</span>
                            <h4 className="text-2xl font-semibold text-white mt-1 mb-4">Tornos CNC & Torneamento</h4>
                            <p className="text-[#7B808F] text-sm font-medium leading-relaxed mb-6">
                                Gestão de usinagem cilíndrica, eixos, buchas e peças de revolução com torre multiferramentas.
                            </p>
                            <ul className="space-y-3 text-sm font-semibold text-[#E7E9ED]">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#D97D3D]" /> Controle de pastilhas/inserts de torneamento e rosqueamento</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#D97D3D]" /> Tempo de ciclo por lote de barras ou peças unitárias</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#D97D3D]" /> Rastreio de paradas de setup de castanhas e encostos</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="mt-8 w-full py-3 bg-[rgba(217,125,61,0.12)] hover:bg-[rgba(217,125,61,0.2)] border border-[#D97D3D]/30 text-[#D97D3D] font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explorar Kanban Torno</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                </div>
            </section>

            {/* SEÇÃO: RECURSOS LEAN */}
            <section id="recursos" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-[#262A33]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-xs font-semibold text-[#D97D3D] uppercase tracking-widest">Metodologia Industrial</span>
                        <h3 className="text-3xl font-semibold text-white mt-2 mb-6">Eficiência Operacional & Aderência ao Planejado</h3>
                        <p className="text-[#7B808F] text-base font-medium leading-relaxed mb-6">
                            Elimine planilhas e quadros de papel. O sistema compara automaticamente o tempo estimado (CAM / Perímetros) com o tempo real usinado, calculando a eficiência e o retorno financeiro de cada O.S.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-[#181B22] rounded-2xl border border-[#262A33]">
                                <Activity className="w-6 h-6 text-[#D97D3D] shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-white">Indicadores em Tempo Real</h4>
                                    <p className="text-xs text-[#7B808F] mt-1">Acompanhe quais máquinas estão em ciclo, pausadas ou em setup instantaneamente.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-[#181B22] rounded-2xl border border-[#262A33]">
                                <Wrench className="w-6 h-6 text-[#9DA2AE] shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-white">Controle de Ferramental & Estoque</h4>
                                    <p className="text-xs text-[#7B808F] mt-1">Saiba a vida útil restante de cada fresa e receba alertas de estoque de inserts antes da peça parar.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#181B22] to-[#111318] p-8 rounded-[14px] border border-[#262A33] text-center shadow-2xl">
                        <h4 className="text-2xl font-semibold text-white mb-4">Pronto para Testar na Prática?</h4>
                        <p className="text-[#7B808F] text-sm font-medium mb-8">
                            Acesse o ambiente local completo com dados de exemplo de ferramentaria sem precisar criar conta ou digitar senha.
                        </p>
                        <button
                            onClick={() => enterLocalStudyMode('admin')}
                            className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#111318] font-semibold rounded-2xl text-base transition-all shadow-[0_8px_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <Zap className="w-6 h-6 fill-[#111318]" />
                            <span>Explorar Modo Demonstração (1-Clique)</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-[#262A33] py-8 px-6 text-center text-xs font-bold text-[#565B68] uppercase tracking-widest">
                <p>&copy; 2026 EDM Lean &bull; Plataforma MES para Centros de Usinagem, Eletroerosão a Fio e Tornos CNC</p>
            </footer>
        </div>
    );
}
