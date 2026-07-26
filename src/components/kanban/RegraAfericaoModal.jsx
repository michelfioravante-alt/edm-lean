import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { ShieldAlert } from 'lucide-react';

export default function RegraAfericaoModal({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ação Bloqueada"
            maxWidth="max-w-md"
        >
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-kanban-amber/20 p-4 rounded-full mb-4">
                    <ShieldAlert className="w-12 h-12 text-kanban-amber" />
                </div>

                <h3 className="text-xl font-extrabold text-slate-100 mb-2">
                    Aferição Obrigatória
                </h3>

                <p className="text-slate-300 font-medium mb-6">
                    Pelas regras de qualidade da manufatura conectada, toda Ordem de Serviço que sai da fase de <strong className="text-kanban-teal">Corte</strong> deve obrigatoriamente passar pela coluna de <strong className="text-kanban-violet">Aferição</strong> (Qualidade) antes de ser dada como Concluída.
                </p>

                <div className="w-full flex justify-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onClose}
                        className="w-full shadow-md"
                    >
                        Entendi
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
