import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ErroOperacaoAviso() {
    const erro = useAppStore((s) => s.erroOperacao);
    const limpar = useAppStore((s) => s.limparErroOperacao);

    useEffect(() => {
        if (!erro) return undefined;
        const t = setTimeout(limpar, 8000);
        return () => clearTimeout(t);
    }, [erro, limpar]);

    if (!erro) return null;

    return (
        <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[calc(100%-2rem)] flex items-start gap-2 rounded-[8px] border border-[#C85558]/40 bg-[#1F1416] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#C85558]" />
            <span className="flex-1">{erro}</span>
            <button type="button" onClick={limpar} aria-label="Fechar aviso" className="text-[#7B808F] hover:text-[#E7E9ED]">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
