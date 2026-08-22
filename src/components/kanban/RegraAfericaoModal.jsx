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
            <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-[rgba(201,154,74,0.1)] border border-[#C99A4A]/30 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-7 h-7 text-[#C99A4A]" />
                </div>

                <h3 className="text-base font-semibold text-[#E7E9ED] mb-2">
                    Aferição Obrigatória
                </h3>

                <p className="text-[#7B808F] text-sm mb-6 leading-relaxed">
                    Pelas regras de qualidade da manufatura conectada, toda Ordem de Serviço que sai da fase de{' '}
                    <strong className="text-[#4A9D74]">Corte</strong> deve obrigatoriamente passar pela coluna de{' '}
                    <strong className="text-[#E7E9ED]">Aferição</strong> (Qualidade) antes de ser dada como Concluída.
                </p>

                <div className="w-full">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onClose}
                        className="w-full"
                    >
                        Entendi
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
