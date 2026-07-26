import React, { useState, useEffect } from 'react';
import { 
    Zap, 
    Layout, 
    Clock, 
    Boxes, 
    Users, 
    LineChart, 
    ChevronRight, 
    ArrowRight, 
    ShieldCheck, 
    Layers
} from 'lucide-react';

export default function LandingPage({ onLogin, onRegister }) {
    const [activeSection, setActiveSection] = useState('home');

    // Scroll spy logic using IntersectionObserver to detect active section
    useEffect(() => {
        const sections = ['home', 'recursos', 'seguranca'];
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px', // Trigger when section is in the middle of viewport
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

    const sections = [
        { id: 'home', label: 'Início' },
        { id: 'recursos', label: 'Recursos' },
        { id: 'seguranca', label: 'Segurança' }
    ];

    const handleNavClick = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update hash without triggering reload, and update history stack
            window.history.pushState(null, '', `#${id}`);
            setActiveSection(id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden relative w-full selection:bg-kanban-amber/30">
            {/* BACKGROUND EFFECTS - Strictly clipped inside inset-0 overflow-hidden to prevent horizontal scroll */}
            <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-kanban-amber/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-kanban-amber/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Floating Page Markers (Marcadores de Página) */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-4 bg-slate-900/40 border border-slate-800/50 p-3 rounded-full backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
                {sections.map(section => (
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={(e) => handleNavClick(e, section.id)}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 relative group flex items-center justify-center ${
                            activeSection === section.id
                                ? 'bg-kanban-amber border-kanban-amber scale-125 shadow-[0_0_12px_rgba(245,166,35,0.4)]'
                                : 'bg-transparent border-slate-605 hover:border-slate-405'
                        }`}
                    >
                        {/* Tooltip */}
                        <span className="absolute right-8 px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-white uppercase tracking-wider rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                            {section.label}
                        </span>
                    </a>
                ))}
            </div>

            {/* HEADER */}
            <header className="relative z-10 border-b border-slate-900 bg-slate-950/75 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-kanban-amber rounded-xl flex items-center justify-center border border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                            <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2050/svg">
                                <path d="M20 70L40 50L55 60L85 25" stroke="#0a0c0f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M45 40L55 60" stroke="white" strokeWidth="12" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-black tracking-wider text-white">
                            EDM LEAN
                        </span>
                    </div>

                    {/* PAGINA MARKERS / ANCHOR NAV */}
                    <nav className="hidden md:flex items-center gap-8">
                        {sections.map(section => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                onClick={(e) => handleNavClick(e, section.id)}
                                className={`text-sm font-semibold transition-all duration-200 border-b-2 py-2 ${
                                    activeSection === section.id
                                        ? 'text-kanban-amber border-kanban-amber'
                                        : 'text-slate-400 border-transparent hover:text-white'
                                }`}
                            >
                                {section.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onLogin}
                            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            Acessar Conta
                        </button>
                        <button 
                            onClick={onRegister}
                            className="px-5 py-2.5 bg-kanban-amber text-slate-950 font-bold rounded-xl text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(251,191,36,0.15)]"
                        >
                            Criar Fábrica
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section id="home" className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Hero Text */}
                    <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-kanban-amber w-fit">
                            <Zap size={12} className="animate-pulse" />
                            SaaS para Eletroerosão a Fio
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                            O Kanban Definitivo para <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kanban-amber to-amber-300">
                                Eletroerosão a Fio
                            </span>
                        </h1>

                        <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-[580px]">
                            Otimize setups, reduza refugos e controle o consumo de insumos. Conecte operadores e programadores em um fluxo industrial Lean integrado.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <button 
                                onClick={onRegister}
                                className="px-8 py-4 bg-kanban-amber text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_8px_30px_rgba(251,191,36,0.2)] text-base group"
                            >
                                Experimentar Grátis 
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button 
                                onClick={onLogin}
                                className="px-8 py-4 backdrop-blur-md bg-slate-900/40 border border-slate-850 hover:bg-slate-900/80 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base"
                            >
                                Acessar Sistema
                            </button>
                        </div>
                    </div>

                    {/* Hero Graphic: Kanban + Charts hybrid preview (Redesenhado) */}
                    <div className="lg:col-span-5 flex justify-center items-center relative">
                        {/* Shadow highlight behind */}
                        <div className="absolute inset-0 bg-kanban-amber/10 blur-[100px] rounded-full w-72 h-72 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        
                        <div className="w-full max-w-[460px] bg-slate-900/75 border border-slate-800/80 rounded-[2.2rem] p-6 relative flex flex-col gap-5 overflow-hidden shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-1000">
                            
                            {/* Browser Header dots */}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500/75"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/75"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/75"></span>
                                </div>
                                <div className="bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-lg text-[9px] font-bold text-slate-500 tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-kanban-amber animate-pulse"></span>
                                    monitor.edmlean.com.br
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 hidden sm:inline text-kanban-amber">Tempo Real</span>
                            </div>

                            {/* Section 1: Visual Kanban Board */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-kanban-amber">Fluxo de Chão de Fábrica</span>
                                    <span className="text-[8px] font-bold text-slate-500">3 Ordens Ativas</span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Column 1: A Fazer / Setup */}
                                    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2 flex flex-col gap-1.5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">A Fazer</span>
                                        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2 text-[9px] font-bold text-slate-200 shadow-sm">
                                            <div className="flex justify-between text-[7px] text-slate-500 mb-0.5">
                                                <span>OS #2481</span>
                                                <span className="text-kanban-amber">M1</span>
                                            </div>
                                            <p className="truncate text-slate-300">Set-up Molde</p>
                                            <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                                                <div className="bg-kanban-amber h-full" style={{ width: '15%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Column 2: Em Corte */}
                                    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2 flex flex-col gap-1.5 relative overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-kanban-teal to-transparent animate-pulse"></div>
                                        <span className="text-[8px] font-black text-kanban-teal uppercase flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-kanban-teal rounded-full animate-ping"></span>
                                            Em Corte
                                        </span>
                                        <div className="bg-slate-900 border border-kanban-teal/20 rounded-lg p-2 text-[9px] font-bold text-slate-200 shadow-md">
                                            <div className="flex justify-between text-[7px] text-kanban-teal mb-0.5">
                                                <span>OS #2479</span>
                                                <span>M2</span>
                                            </div>
                                            <p className="truncate text-white font-extrabold">Matriz Aço</p>
                                            <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                                                <div className="bg-kanban-teal h-full animate-mock-progress"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Column 3: Concluído */}
                                    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2 flex flex-col gap-1.5">
                                        <span className="text-[8px] font-black text-emerald-500 uppercase">Aferição</span>
                                        <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-2 text-[9px] font-bold text-slate-400 shadow-sm opacity-80">
                                            <div className="flex justify-between text-[7px] text-slate-600 mb-0.5">
                                                <span>OS #2475</span>
                                                <span>M3</span>
                                            </div>
                                            <p className="truncate line-through decoration-slate-700">Pino Guia</p>
                                            <span className="text-[7px] text-emerald-500 font-extrabold block mt-1">✓ Aferido</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Visual Charts & OEE Analytics */}
                            <div className="flex flex-col gap-2.5 border-t border-slate-800/50 pt-3.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-kanban-amber">Métricas de Produção & Eficiência</span>
                                
                                <div className="grid grid-cols-5 gap-3 items-center">
                                    {/* Circular OEE Gauge */}
                                    <div className="col-span-2 bg-slate-950/60 border border-slate-850 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5">
                                        <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">OEE Global</span>
                                        <div className="relative w-14 h-14 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-slate-850" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-kanban-amber" strokeDasharray="92, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-xs font-black text-white">92%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Line Chart showing Productivity Trend */}
                                    <div className="col-span-3 bg-slate-950/60 border border-slate-850 rounded-2xl p-2.5 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-500 uppercase">
                                            <span>Rendimento (5 dias)</span>
                                            <span className="text-emerald-500 font-mono">+4.2%</span>
                                        </div>
                                        {/* SVG Line Chart */}
                                        <div className="w-full h-10">
                                            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f5a623" stopOpacity="0.35" />
                                                        <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Filled Area */}
                                                <path d="M0 38 Q 20 20, 40 25 T 80 8 T 100 4 L 100 40 L 0 40 Z" fill="url(#chartGradient)" />
                                                {/* Line */}
                                                <path d="M0 38 Q 20 20, 40 25 T 80 8 T 100 4" fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round" />
                                                {/* Pulsing point */}
                                                <circle cx="100" cy="4" r="2.5" fill="#f5a623" />
                                                <circle cx="100" cy="4" r="4.5" fill="none" stroke="#f5a623" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '100px 4px' }} />
                                            </svg>
                                        </div>
                                        <div className="flex justify-between text-[6px] text-slate-600 font-bold">
                                            <span>SEG</span>
                                            <span>TER</span>
                                            <span>QUA</span>
                                            <span>QUI</span>
                                            <span>SEX</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="recursos" className="relative z-10 bg-slate-950/50 border-t border-slate-900 py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-kanban-amber uppercase tracking-widest">EFICIÊNCIA LEAN</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            Tudo que sua oficina precisa em um único lugar
                        </h2>
                        <p className="text-slate-400 font-medium">
                            Desenvolvemos ferramentas específicas para o fluxo de trabalho de ferramentarias e oficinas de eletroerosão.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* feature 1 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <Layout size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Quadro Kanban Industrial</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Arraste e solte ordens de serviço pelas colunas de Setup, Em Corte, Aferição e Concluído. Organização visual focada no chão de fábrica.
                            </p>
                        </div>

                        {/* feature 2 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Controle de Pausas e Paradas</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Registre motivos de paradas (falta de energia, matéria-prima, etc.) com apenas dois toques e calcule o Lead Time real descontando os tempos de inatividade.
                            </p>
                        </div>

                        {/* feature 3 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <Boxes size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Estoque de Consumíveis</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Monitore a durabilidade e trocas de fios de latão, filtros e resinas. Receba alertas de níveis mínimos antes de paralisar as máquinas.
                            </p>
                        </div>

                        {/* feature 4 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Acesso por QR Code & PIN</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Os operadores acessam o terminal do chão de fábrica lendo um QR Code e inserindo um PIN numérico rápido, sem burocracia de e-mails ou senhas complexas.
                            </p>
                        </div>

                        {/* feature 5 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Divisão de Ordens (Split)</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Produza lotes grandes e divida a ordem de serviço em sub-lotes dinamicamente para liberar peças prontas antecipadamente para o cliente.
                            </p>
                        </div>

                        {/* feature 6 */}
                        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] hover:border-slate-800 hover:bg-slate-900/60 hover:scale-[1.02] transition-all duration-300 flex flex-col gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-kanban-amber flex items-center justify-center">
                                <LineChart size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Métricas de Rendimento</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                Visualize custos de hora-máquina, taxas de refugo e rendimento de insumos com gráficos analíticos gerados automaticamente para a tomada de decisão.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO INPI / REGISTRO */}
            <section id="seguranca" className="relative z-10 py-16 border-t border-slate-900 max-w-7xl mx-auto px-6 text-center">
                <div className="bg-slate-900/20 border border-slate-900 rounded-[2.5rem] p-10 backdrop-blur-sm max-w-3xl mx-auto flex flex-col items-center gap-4">
                    <ShieldCheck size={40} className="text-emerald-500" />
                    <h3 className="text-lg font-bold text-white">Software Homologado e Registrado</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-[500px]">
                        O <strong className="text-white">EDM Lean</strong> é uma marca devidamente registrada e resguardada no <strong className="text-white">INPI (Instituto Nacional da Propriedade Industrial)</strong>, garantindo a originalidade e a segurança intelectual de nossos fluxos Lean aplicados à usinagem.
                    </p>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative z-10 py-20 border-t border-slate-900 text-center px-6">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Pronto para transformar a produtividade da sua oficina?
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
                        Crie sua conta em 30 segundos, cadastre suas máquinas e veja a metodologia Lean funcionar na prática no seu chão de fábrica.
                    </p>
                    <div className="flex justify-center mt-2">
                        <button 
                            onClick={onRegister}
                            className="px-10 py-5 bg-kanban-amber text-slate-950 font-black rounded-2xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_10px_35px_rgba(251,191,36,0.3)] text-lg flex items-center gap-3"
                        >
                            Começar Agora (Grátis)
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">EDM LEAN</span>
                        <span className="text-slate-700">|</span>
                        <span className="text-xs font-semibold text-slate-500">Gestão Industrial Simplificada</span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                        &copy; 2026 EDM Lean. Todos os direitos reservados. Marca Registrada INPI.
                    </div>
                </div>
            </footer>
        </div>
    );
}
