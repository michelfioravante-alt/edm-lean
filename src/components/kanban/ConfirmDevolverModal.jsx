import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { RotateCcw } from 'lucide-react';

export default function ConfirmDevolverModal({ isOpen, onClose, onConfirm, osData, sourceCol }) {
    if (!osData) return null;

    const origemLabel = sourceCol === 'setup' ? 'Set-up' : sourceCol === 'emCorte' ? 'Em Corte' : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Devolver para A fazer">
            <div className="flex flex-col items-center justify-center py-2">
                <div className="w-14 h-14 rounded-full bg-[rgba(201,154,74,0.1)] border border-[#C99A4A]/30 flex items-center justify-center mb-5">
                    <RotateCcw className="w-7 h-7 text-[#C99A4A]" />
                </div>

                <h4 className="text-base font-semibold text-[#E7E9ED] text-center mb-2">
                    Devolver O.S. para a fila?
                </h4>

                <p className="text-[#7B808F] text-center text-sm mb-6 leading-relaxed">
                    Esta O.S. será devolvida de{' '}
                    <span className="font-semibold text-[#C99A4A]">{origemLabel}</span> para{' '}
                    <span className="font-semibold text-[#E7E9ED]">A fazer</span>.
                    <br />
                    O tempo já gasto será mantido nos registros. Máquina e operador serão liberados.
                </p>

                <div className="flex w-full gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={onConfirm}
                    >
                        Sim, Devolver
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
