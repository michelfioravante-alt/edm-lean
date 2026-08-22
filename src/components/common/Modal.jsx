import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/70 backdrop-blur-sm">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className={`relative z-10 bg-[#181B22] border border-[#262A33] rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.7)] w-full ${maxWidth} flex flex-col max-h-[90dvh] sm:max-h-[85vh] shrink-0 overflow-hidden animate-modal-in`}>
                {title && (
                    <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#262A33] bg-[#1F232B] shrink-0">
                        <h3 className="font-['Space_Grotesk'] text-base sm:text-lg font-semibold text-[#E7E9ED] pr-2 leading-tight truncate">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-[6px] text-[#7B808F] hover:bg-[#262A33] hover:text-[#E7E9ED] transition-colors active:scale-95 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ml-2"
                            aria-label="Fechar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
