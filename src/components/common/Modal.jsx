import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md'
}) {
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(80px, env(safe-area-inset-bottom))', paddingLeft: '12px', paddingRight: '12px' }}
        >
            <div
                className="fixed inset-0 -z-10"
                onClick={onClose}
            />

            <div className={`relative bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] w-full ${maxWidth} flex flex-col overflow-hidden my-auto`}
                style={{ maxHeight: 'calc(100dvh - 100px)' }}
            >
                {title && (
                    <div className="flex justify-between items-center px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md rounded-t-2xl shrink-0">
                        <h3 className="text-base sm:text-xl font-extrabold text-white pr-2 leading-tight">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ml-2"
                            aria-label="Fechar"
                        >
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                )}

                <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
