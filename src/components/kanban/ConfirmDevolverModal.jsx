import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { RotateCcw } from 'lucide-react';

export default function ConfirmDevolverModal({ isOpen, onClose, onConfirm, osData, sourceCol }) {
    if (!osData) return null;

    const origemLabel = sourceCol === 'setup' ? 'Set-up' : sourceCol === 'emCorte' ? 'Em Corte' : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Devolver para A fazer">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-kanban-amber/10 flex items-center justify-center mb-6">
                    <RotateCcw className="w-8 h-8 text-kanban-amber" />
                </div>

                <h4 className="text-xl font-bold text-slate-100 text-center mb-2">
                    Devolver O.S. para a fila?
                </h4>

                <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
                    Esta O.S. será devolvida de <span className="font-bold text-kanban-amber">{origemLabel}</span> para <span className="font-bold">A fazer</span>.
                    O tempo já gasto será mantido nos registros. Máquina e operador serão liberados.
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
                        className="flex-1 bg-kanban-amber hover:bg-yellow-400 text-slate-900 font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-kanban-amber focus:ring-offset-2 flex items-center justify-center"
                        onClick={onConfirm}
                    >
                        Sim, Devolver
                    </button>
                </div>
            </div>
        </Modal>
    );
}
