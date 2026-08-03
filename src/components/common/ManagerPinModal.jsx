import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ManagerPinModal({ isOpen, onClose, onSuccess }) {
    const { configuracoesGlobais } = useAppStore();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const targetPin = (configuracoesGlobais?.pinOnboarding || configuracoesGlobais?.pin_onboarding || '1234').toString();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin === targetPin) {
            setError('');
            setPin('');
            onSuccess();
            onClose();
        } else {
            setError('PIN Master incorreto. Tente novamente.');
            setPin('');
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setPin('');
                setError('');
                onClose();
            }}
            title="🔒 Acesso Restrito à Gerência"
            maxWidth="max-w-sm"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                        <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Digite a Senha / PIN Master da Fábrica</p>
                    <p className="text-xs text-slate-400">
                        Para visualizar dados financeiros, faturamento e visão executiva de todos os setores.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                        PIN de 4 Dígitos
                    </label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => {
                                setError('');
                                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                            }}
                            placeholder="••••"
                            autoFocus
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-center font-black text-2xl tracking-[0.4em] text-white focus:border-amber-500 outline-none"
                            required
                        />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 text-center mt-2">
                        Dica: O PIN padrão inicial é <strong className="text-amber-400 font-mono">1234</strong>
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 text-xs uppercase tracking-wider shadow-lg"
                        disabled={pin.length < 4}
                    >
                        Desbloquear
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
