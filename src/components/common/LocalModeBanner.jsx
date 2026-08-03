import React from 'react';
import { FlaskConical, RotateCcw, LogOut } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { resetDb } from '../../local/localDatabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function LocalModeBanner() {
    const logout = useAuthStore((s) => s.logout);

    if (!isLocalMode()) return null;

    const handleReset = () => {
        if (window.confirm('Restaurar dados de exemplo? Suas alterações locais serão perdidas.')) {
            resetDb();
            window.location.reload();
        }
    };

    const handleExit = () => {
        logout();
    };

    return (
        <div className="bg-kanban-amber/15 border-b border-kanban-amber/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-kanban-amber font-bold uppercase tracking-wider">
                <FlaskConical className="w-4 h-4 shrink-0" />
                Modo Demonstração Interativa — dados salvos no navegador
            </div>
            <div className="flex items-center gap-3 ml-auto">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar exemplos
                </button>
                <div className="w-px h-4 bg-slate-700" />
                <button
                    onClick={handleExit}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-bold transition-colors"
                    title="Sair do modo demonstração e voltar à página inicial"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair do Demo
                </button>
            </div>
        </div>
    );
}
