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
            title="Acesso Restrito à Gerência"
            maxWidth="max-w-sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-[#111318] border border-[#262A33] p-4 rounded-[8px] text-center space-y-2">
                    <div className="w-12 h-12 bg-[rgba(201,154,74,0.1)] rounded-[8px] border border-[#C99A4A]/30 flex items-center justify-center mx-auto text-[#C99A4A]">
                        <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-[#E7E9ED]">Digite a Senha / PIN Master da Fábrica</p>
                    <p className="text-xs text-[#7B808F]">
                        Para visualizar dados financeiros, faturamento e visão executiva de todos os setores.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-[rgba(200,85,88,0.1)] border border-[#C85558]/30 text-[#C85558] p-3 rounded-[7px] text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-semibold text-[#565B68] uppercase tracking-[0.15em] mb-2 text-center">
                        PIN de 4 Dígitos
                    </label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565B68]" />
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
                            className="w-full bg-[#111318] border border-[#262A33] rounded-[7px] py-3 pl-10 pr-4 text-center font-bold text-2xl tracking-[0.4em] text-[#E7E9ED] focus:border-[#D97D3D] focus:outline-none transition-colors"
                            required
                        />
                    </div>
                    <p className="text-[10px] text-[#565B68] text-center mt-2">
                        Dica: O PIN padrão inicial é <strong className="text-[#C99A4A] font-mono">1234</strong>
                    </p>
                </div>

                <div className="flex gap-3 pt-1">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={pin.length < 4}
                    >
                        Desbloquear
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
