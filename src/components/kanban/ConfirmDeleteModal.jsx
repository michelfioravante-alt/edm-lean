import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertOctagon } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, osData }) {
    if (!osData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excluir Ordem de Serviço">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertOctagon className="w-8 h-8 text-red-500" />
                </div>

                <h4 className="text-xl font-bold text-slate-100 text-center mb-2">
                    Remover O.S. {osData.codigoPeca || 'S/N'}?
                </h4>

                <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
                    Você está prestes a excluir esta Ordem de Serviço da fila de produção.
                    Ela será movida para o histórico como <span className="font-bold text-red-500">Cancelada / Excluída</span>.
                    <br /><br />
                    Esta ação <span className="font-bold underline">não</span> apaga os registros da máquina, mas os tira da fábrica. Tem certeza?
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
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
                        onClick={() => onConfirm(osData)}
                    >
                        Sim, Excluir O.S.
                    </button>
                </div>
            </div>
        </Modal>
    );
}
