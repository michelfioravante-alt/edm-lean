import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

// Polling de fallback (reduzido para economizar egress no Supabase).
// Quando Realtime está ativo, 30s é suficiente; quando não está, ainda evita dados muito atrasados.
const KANBAN_POLL_INTERVAL_MS = 30000;

export default function Layout({ children, activeView, onViewChange }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { role, empresaId } = useAuthStore();
    const { fetchMaquinas, fetchOperadores, fetchConfiguracoes, fetchEstoque, fetchProgramadores, fetchHistoricoConsumiveis, fetchAutoKanbans, fetchUsuarios, fetchClientes } = useAppStore();

    // Carrega todos os dados ao ter empresaId disponível
    useEffect(() => {
        if (!empresaId) return;

        fetchConfiguracoes();
        fetchMaquinas();
        fetchOperadores();
        fetchProgramadores();
        fetchEstoque();
        fetchHistoricoConsumiveis();
        fetchAutoKanbans();
        fetchUsuarios();
        fetchClientes();
        useAppStore.getState().fetchKanbanDadosInicial();
    }, [empresaId]);

    // Realtime + reconexão ao voltar de aba/foco
    useEffect(() => {
        if (!role || !useAuthStore.getState().empresaId) return;

        const store = useAppStore.getState();
        store.subscribeToKanbanUpdates();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const s = useAppStore.getState();
                // Reconecta realtime (WebSocket cai em background no mobile)
                s.unsubscribeFromKanbanUpdates();
                s.subscribeToKanbanUpdates();
                // Só atualiza o Kanban ao voltar (evita 7 fetches e reduz egress)
                s.fetchKanbanDadosInicial({ merge: true });
            }
        };

        const handleWindowFocus = () => {
            if (document.visibilityState === 'visible') {
                useAppStore.getState().fetchKanbanDadosInicial({ merge: true });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            useAppStore.getState().unsubscribeFromKanbanUpdates();
        };
    }, [role]);

    // Polling de fallback (intervalo maior para reduzir egress). Só roda com aba visível.
    useEffect(() => {
        if (!empresaId) return;

        const interval = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            useAppStore.getState().fetchKanbanDadosInicial({ merge: true });
        }, KANBAN_POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [empresaId]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex flex-1 pb-[60px] md:pb-0">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    activeView={activeView}
                    onViewChange={onViewChange}
                />
                <main className="flex-1 overflow-x-auto overflow-y-visible relative z-10 w-full no-scrollbar">
                    <div className="p-2 sm:p-4 lg:p-7 w-full max-w-[1800px] mx-auto min-h-full flex flex-col">
                        {children}
                    </div>
                </main>
            </div>

            <MobileNav
                activeView={activeView}
                onViewChange={onViewChange}
                role={role}
            />
        </div>
    );
}
