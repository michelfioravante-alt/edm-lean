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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="fixed inset-0 -z-10"
                onClick={onClose}
            />

            <div className={`relative bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] w-full ${maxWidth} flex flex-col max-h-[85vh] shrink-0 overflow-hidden`}>
                {title && (
                    <div className="flex justify-between items-center px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0">
                        <h3 className="text-base sm:text-xl font-extrabold text-white pr-2 leading-tight truncate">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95 shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ml-2"
                            aria-label="Fechar"
                        >
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                )}

                <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
