import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { RotateCcw } from 'lucide-react';

export default function ConfirmDevolverCorteModal({ isOpen, onClose, onConfirm }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Devolver para Set-up">
            <div className="flex flex-col items-center justify-center py-2">
                <div className="w-14 h-14 rounded-full bg-[rgba(74,157,116,0.1)] border border-[#4A9D74]/30 flex items-center justify-center mb-5">
                    <RotateCcw className="w-7 h-7 text-[#4A9D74]" />
                </div>

                <h4 className="text-base font-semibold text-[#E7E9ED] text-center mb-2">
                    Devolver para Set-up?
                </h4>

                <p className="text-[#7B808F] text-center text-sm mb-6 leading-relaxed">
                    Esta O.S. será devolvida de{' '}
                    <span className="font-semibold text-[#4A9D74]">Em Corte</span> para{' '}
                    <span className="font-semibold text-[#C99A4A]">Set-up</span>.
                    <br />
                    O tempo já gasto em Corte será mantido nos registros.
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
                        variant="success"
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
