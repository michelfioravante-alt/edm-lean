import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertTriangle, Settings2 } from 'lucide-react';

export default function MachineOccupiedModal({ isOpen, onClose, maquinaName, targetCol }) {
    if (!maquinaName) return null;

    const colName = targetCol === 'emCorte' ? 'Corte' : 'Set-up';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Máquina Ocupada" maxWidth="max-w-md">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-kanban-amber/10 flex items-center justify-center mb-6 border border-kanban-amber/20">
                    <AlertTriangle className="w-8 h-8 text-kanban-amber" />
                </div>

                <h4 className="text-xl font-bold text-slate-100 text-center mb-2">
                    {maquinaName} em Uso
                </h4>

                <p className="text-slate-300 text-center text-sm mb-6 leading-relaxed">
                    Você não pode adicionar esta Ordem de Serviço na fase de <strong className={targetCol === 'emCorte' ? 'text-kanban-teal' : 'text-kanban-amber'}>{colName}</strong>.
                    <br /><br />
                    A máquina <strong>{maquinaName}</strong> já possui uma O.S. ativa nesta mesma etapa. Por favor, <strong>pause ou conclua</strong> o processo atual da máquina antes de iniciar uma nova atividade nela.
                </p>

                <div className="flex w-full mt-2">
                    <Button
                        variant="primary"
                        className="w-full shadow-lg border border-kanban-amber/30 hover:border-kanban-amber"
                        onClick={onClose}
                    >
                        Entendi, fechar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
