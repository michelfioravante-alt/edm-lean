import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import TrialExpiradoScreen from './components/common/TrialExpiradoScreen'
import ErroOperacaoAviso from './components/common/ErroOperacaoAviso'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { parseOsHash } from './utils/folhaProcesso'

// Carregamento dinâmico das views (Lazy Loading) para otimização de performance
const Board = lazy(() => import('./components/kanban/Board'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ConfigSettings = lazy(() => import('./pages/ConfigSettings'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Registros = lazy(() => import('./pages/Registros'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Ferramental = lazy(() => import('./pages/Ferramental'))
const HomeGerente = lazy(() => import('./pages/HomeGerente'))
const Carteira = lazy(() => import('./pages/Carteira'))
const Moldes = lazy(() => import('./pages/Moldes'))
const JoinCompany = lazy(() => import('./pages/JoinCompany'))
const LandingPage = lazy(() => import('./pages/LandingPage'))

/** Telas do app. `soGestor`: quem não é gestor cai no Kanban. */
const VIEWS = {
    home: { Componente: HomeGerente, soGestor: true },
    carteira: { Componente: Carteira, soGestor: true },
    moldes: { Componente: Moldes, soGestor: true },
    configuracoes: { Componente: ConfigSettings, soGestor: true },
    clientes: { Componente: Clientes, soGestor: true },
    dashboard: { Componente: Dashboard },
    kanban: { Componente: Board },
    estoque: { Componente: Estoque },
    registros: { Componente: Registros },
    ferramental: { Componente: Ferramental },
};

const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const Spinner = ({ className = 'min-h-screen bg-[#111318]' }) => (
    <div className={`${className} flex justify-center items-center`}>
        <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
    </div>
);

function trialExpirado(plano, dataCriacao) {
    if (!dataCriacao || plano !== 'piloto') return false;
    return Date.now() > new Date(dataCriacao).getTime() + TRIAL_DURATION_MS;
}

function App() {
    const [activeView, setActiveView] = useState('kanban');
    const { processarKanbansAutomaticos } = useAppStore();
    const { user, role, isInitialized, initializeAuth, plano, dataCriacao, nomeEmpresa, logout, isResettingPassword } = useAuthStore();
    const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

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

    const prevRoleRef = useRef(null);
    useEffect(() => {
        if (!user || !role) return;
        if (prevRoleRef.current !== role) {
            setActiveView(role === 'admin' ? 'home' : 'kanban');
            prevRoleRef.current = role;
        }
    }, [user, role]);

    useEffect(() => {
        if (!user) return;
        const osId = parseOsHash(currentHash);
        if (osId) {
            useAppStore.getState().setOsDeepLinkId(osId);
            setActiveView('kanban');
        }
    }, [user, currentHash]);

    // Onboarding por convite (/join/CODIGO) vem antes de qualquer bloqueio
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
        return (
            <Suspense fallback={<Spinner />}>
                <JoinCompany inviteCode={path.split('/join/')[1]} />
            </Suspense>
        );
    }

    if (!isInitialized) return <Spinner />;

    if (!user || isResettingPassword) {
        const showLogin = currentHash === '#login' || currentHash === '#register' || isResettingPassword;
        if (!showLogin) {
            return (
                <Suspense fallback={<Spinner />}>
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

    if (trialExpirado(plano, dataCriacao)) {
        return <TrialExpiradoScreen nomeEmpresa={nomeEmpresa} onLogout={logout} />;
    }

    const view = VIEWS[activeView];
    const { Componente } = view && (!view.soGestor || role === 'admin') ? view : VIEWS.kanban;

    return (
        <Layout activeView={activeView} onViewChange={setActiveView} role={role}>
            <Suspense fallback={<Spinner className="h-[60vh]" />}>
                <Componente onNavigate={setActiveView} />
            </Suspense>
            <ErroOperacaoAviso />
        </Layout>
    )
}

export default App
