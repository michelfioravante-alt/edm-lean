import React from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md'
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 pb-4 px-4 sm:px-6 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className={`relative bg-slate-950 border border-slate-800 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] w-full ${maxWidth} transform transition-all flex flex-col max-h-full`}>
                {title && (
                    <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 rounded-t-xl">
                        <h3 className="text-xl md:text-2xl font-extrabold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95"
                        >
                            <X className="h-6 w-6" />
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
