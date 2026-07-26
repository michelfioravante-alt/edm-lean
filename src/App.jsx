import React, { useState, useEffect, lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'

// Carregamento dinâmico das views (Lazy Loading) para otimização de performance
const Board = lazy(() => import('./components/kanban/Board'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ConfigSettings = lazy(() => import('./pages/ConfigSettings'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Registros = lazy(() => import('./pages/Registros'))
const Clientes = lazy(() => import('./pages/Clientes'))
const JoinCompany = lazy(() => import('./pages/JoinCompany'))
const LandingPage = lazy(() => import('./pages/LandingPage'))


function App() {
    const [activeView, setActiveView] = useState('kanban');
    const { processarKanbansAutomaticos } = useAppStore();
    const { user, role, isInitialized, initializeAuth, plano, dataCriacao, nomeEmpresa, logout } = useAuthStore();
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

    // Inicializa a autenticação do Supabase
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Listener para mudanças de hash na URL (permite usar botão Voltar do navegador)
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash || '#home');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Cron simulado roda toda vez que o app inicializa
    useEffect(() => {
        if (isInitialized) {
            processarKanbansAutomaticos();
        }
    }, [processarKanbansAutomaticos, isInitialized]);

    // Simula carregamento de dados do SaaS ao fazer Login
    useEffect(() => {
        if (user) {
            setIsInitialLoading(true);
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Intercepta rota de Onboarding (JOIN) antes de qualquer bloqueio
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
        const inviteCode = path.split('/join/')[1];
        return (
            <Suspense fallback={
                <div className="min-h-screen bg-slate-950 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
                </div>
            }>
                <JoinCompany inviteCode={inviteCode} />
            </Suspense>
        );
    }

    // Se o Supabase ainda está checando o token, mostra tela de loading lisa
    if (!isInitialized) {
        return <div className="min-h-screen bg-slate-950 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
        </div>;
    }

    // Se não estiver logado, exibe a Landing Page ou a tela de login/registro
    // Se estiver no fluxo de redefinição de senha, trava no Login direto
    if (!user || useAuthStore.getState().isResettingPassword) {
        const showLogin = currentHash === '#login' || currentHash === '#register' || useAuthStore.getState().isResettingPassword;
        if (!showLogin) {
            return (
                <Suspense fallback={
                    <div className="min-h-screen bg-slate-950 flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
                    </div>
                }>
                    <LandingPage 
                        onLogin={() => window.location.hash = '#login'} 
                        onRegister={() => window.location.hash = '#register'} 
                    />
                </Suspense>
            );
        }
        return (
            <Login 
                initialMode={currentHash === '#register' ? 'register' : 'login'} 
                onBack={() => window.location.hash = '#home'} 
            />
        );
    }

    // Calcula expiração do teste grátis (30 dias)
    const isTrialExpired = (() => {
        if (!dataCriacao || plano !== 'piloto') return false;
        const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
        const creationTime = new Date(dataCriacao).getTime();
        const expirationTime = creationTime + TRIAL_DURATION_MS;
        return Date.now() > expirationTime;
    })();

    // Se o período de testes grátis expirou, bloqueia e exibe a tela de cobrança/suporte
    if (isTrialExpired) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans select-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-kanban-amber/5 via-transparent to-red-500/5 opacity-40 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-[480px] z-10 backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center flex flex-col gap-6 animate-in zoom-in-95 duration-500">
                    <div className="relative mx-auto mb-2">
                        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 17v-5M12 17v-3M15 17v-6" /></svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-tight">Período de Testes Expirado</h2>
                    
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Seu período de avaliação gratuita de 30 dias do **EDM Lean** para a empresa <strong className="text-white">{nomeEmpresa}</strong> chegou ao fim. Esperamos que o painel Kanban e os relatórios OEE tenham ajudado a otimizar a sua produção!
                    </p>

                    <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 text-left flex flex-col gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Como reativar o acesso?</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Para contratar o plano Pro ou reativar o seu acesso de teste, entre em contato diretamente com o responsável comercial/desenvolvedor:
                        </p>
                        {/* BOTÃO WHATSAPP */}
                        <a 
                            href="https://wa.me/5551982710396?text=Olá! Meu período de teste do EDM Lean expirou para a empresa e gostaria de reativar."
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                            <svg className="w-5.5 h-5.5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.465 5.212 3.464 8.379-.003 6.535-5.328 11.859-11.859 11.859-.001 0-.002 0-.003 0-2.001-.001-3.97-.508-5.73-1.472L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.725 1.45h.005c5.379 0 9.75-4.37 9.754-9.754.002-2.607-1.012-5.059-2.859-6.905C16.37 2.099 13.92 1.08 11.861 1.08c-5.38 0-9.75 4.37-9.754 9.75-.001 1.706.444 3.376 1.288 4.881l-.996 3.633 3.658-.96zm11.365-5.462c-.29-.145-1.716-.848-1.98-.942-.266-.096-.46-.145-.652.145-.192.29-.74.942-.907 1.135-.166.19-.33.21-.62.065-.29-.147-1.226-.452-2.336-1.442-.864-.77-1.447-1.722-1.616-2.012-.17-.29-.018-.447.127-.59.13-.13.29-.338.435-.508.145-.17.193-.29.29-.483.097-.19.048-.36-.024-.508-.072-.145-.652-1.573-.894-2.152-.236-.569-.495-.49-.678-.5l-.578-.01c-.198 0-.52.073-.79.37-.27.295-1.03 1.01-1.03 2.46 0 1.45 1.056 2.852 1.2 3.047.145.195 2.08 3.175 5.04 4.455.703.305 1.253.487 1.68.625.706.223 1.348.19 1.858.115.567-.085 1.717-.7 1.96-1.378.24-.678.24-1.257.17-1.378-.07-.122-.26-.19-.55-.337z"/>
                            </svg>
                            <span>Falar com o Comercial</span>
                        </a>
                    </div>

                    <button 
                        onClick={() => logout()}
                        className="text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 w-fit mx-auto cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Sair da Conta
                    </button>
                </div>
            </div>
        );
    }

    // Tela de Carregamento Global (Splash Screen)
    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
                <div className="relative flex flex-col items-center">
                    <div className="absolute inset-0 bg-kanban-amber/20 blur-[50px] rounded-full w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>
                    <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 mb-6 relative z-10 animate-pulse">
                        <span className="text-4xl font-black text-white flex">
                            M<span className="text-kanban-amber">.</span>
                        </span>
                    </div>
                    <div className="flex flex-col items-center z-10">
                        <h2 className="text-xl font-bold text-white tracking-widest mb-2 flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-kanban-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            INICIALIZANDO WORKSPACE
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Buscando configurações da planta...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Layout activeView={activeView} onViewChange={setActiveView} role={role}>
            <Suspense fallback={
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
                </div>
            }>
                {activeView === 'dashboard' && role === 'admin' && <Dashboard />}
                {activeView === 'kanban' && <Board />}
                {activeView === 'estoque' && <Estoque />}
                {activeView === 'registros' && <Registros />}
                {activeView === 'configuracoes' && role === 'admin' && <ConfigSettings />}
                {activeView === 'clientes' && <Clientes />}

                {/* Fallback caso Operador tente acessar URL restrita */}
                {(activeView === 'dashboard' || activeView === 'configuracoes') && role !== 'admin' && (
                    <Board /> // Força volta pro Kanban
                )}
            </Suspense>
        </Layout>
    )
}

export default App
