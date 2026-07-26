import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { RotateCcw } from 'lucide-react';

export default function ConfirmDevolverCorteModal({ isOpen, onClose, onConfirm }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Devolver para Set-up">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-kanban-teal/10 flex items-center justify-center mb-6">
                    <RotateCcw className="w-8 h-8 text-kanban-teal" />
                </div>

                <h4 className="text-xl font-bold text-slate-100 text-center mb-2">
                    Devolver para Set-up?
                </h4>

                <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
                    Esta O.S. será devolvida de <span className="font-bold text-kanban-teal">Em Corte</span> para <span className="font-bold text-kanban-amber">Set-up</span>.
                    O tempo já gasto em Corte será mantido nos registros.
                </p>

                <div className="flex w-full gap-3 mt-2">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <button
                        className="flex-1 bg-kanban-teal hover:bg-teal-400 text-slate-900 font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-kanban-teal focus:ring-offset-2 flex items-center justify-center"
                        onClick={onConfirm}
                    >
                        Sim, Devolver
                    </button>
                </div>
            </div>
        </Modal>
    );
}
