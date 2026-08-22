import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertOctagon } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, osData }) {
    if (!osData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excluir Ordem de Serviço">
            <div className="flex flex-col items-center justify-center py-2">
                <div className="w-14 h-14 rounded-full bg-[rgba(200,85,88,0.1)] border border-[#C85558]/30 flex items-center justify-center mb-5">
                    <AlertOctagon className="w-7 h-7 text-[#C85558]" />
                </div>

                <h4 className="text-base font-semibold text-[#E7E9ED] text-center mb-2">
                    Remover O.S. {osData.codigo_peca || osData.codigoPeca || 'S/N'}?
                </h4>

                <p className="text-[#7B808F] text-center text-sm mb-6 leading-relaxed">
                    Esta O.S. será removida da fila de produção e movida para o histórico como{' '}
                    <span className="font-semibold text-[#C85558]">Cancelada / Excluída</span>.
                    <br /><br />
                    Os registros da máquina são mantidos. Tem certeza?
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
                        variant="danger"
                        className="flex-1"
                        onClick={() => onConfirm(osData)}
                    >
                        Sim, Excluir O.S.
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
