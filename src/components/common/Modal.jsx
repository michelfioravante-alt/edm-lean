import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md'
}) {
    // Travar scroll do body enquanto modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div
                className={`relative bg-slate-950 border border-slate-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] w-full ${maxWidth} flex flex-col max-h-[90dvh] animate-modal-in`}
                style={{ animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            >
                {title && (
                    <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/80 rounded-t-xl shrink-0">
                        <h3 className="text-lg md:text-xl font-extrabold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <div className="p-5 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
