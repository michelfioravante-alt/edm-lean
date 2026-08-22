import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertTriangle } from 'lucide-react';

export default function MachineOccupiedModal({ isOpen, onClose, maquinaName, targetCol }) {
    if (!maquinaName) return null;

    const colName = targetCol === 'emCorte' ? 'Corte' : 'Set-up';
    const colColor = targetCol === 'emCorte' ? 'text-[#4A9D74]' : 'text-[#C99A4A]';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Máquina Ocupada" maxWidth="max-w-md">
            <div className="flex flex-col items-center justify-center py-2">
                <div className="w-14 h-14 rounded-full bg-[rgba(201,154,74,0.1)] border border-[#C99A4A]/30 flex items-center justify-center mb-5">
                    <AlertTriangle className="w-7 h-7 text-[#C99A4A]" />
                </div>

                <h4 className="text-base font-semibold text-[#E7E9ED] text-center mb-2">
                    {maquinaName} em Uso
                </h4>

                <p className="text-[#7B808F] text-center text-sm mb-6 leading-relaxed">
                    Você não pode adicionar esta O.S. na fase de{' '}
                    <strong className={colColor}>{colName}</strong>.
                    <br /><br />
                    A máquina <strong className="text-[#E7E9ED]">{maquinaName}</strong> já possui uma O.S. ativa nesta etapa.{' '}
                    Por favor, <strong className="text-[#E7E9ED]">pause ou conclua</strong> o processo atual antes de iniciar uma nova atividade.
                </p>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={onClose}
                >
                    Entendi, fechar
                </Button>
            </div>
        </Modal>
    );
}
