import React from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { resetDb } from '../../local/localDatabase';

export default function LocalModeBanner() {
    if (!isLocalMode()) return null;

    const handleReset = () => {
        if (window.confirm('Restaurar dados de exemplo? Suas alterações locais serão perdidas.')) {
            resetDb();
            window.location.reload();
        }
    };

    return (
        <div className="bg-kanban-amber/15 border-b border-kanban-amber/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-kanban-amber font-bold uppercase tracking-wider">
                <FlaskConical className="w-4 h-4" />
                Modo Demonstração Interativa — dados salvos no navegador

            </div>
            <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar exemplos
            </button>
        </div>
    );
}
