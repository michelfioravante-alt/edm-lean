import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteEstoqueModal({ isOpen, onClose, onConfirm, itemName }) {
    if (!itemName) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excluir Item do Estoque">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <Trash2 className="w-8 h-8 text-red-500" />
                </div>

                <h4 className="text-xl font-bold text-slate-100 text-center mb-2">
                    Remover "{itemName}"?
                </h4>

                <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
                    Você está prestes a excluir permanentemente este item do inventário.
                    <br /><br />
                    Esta ação <span className="font-bold underline text-red-400">não pode</span> ser desfeita. Tem certeza?
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
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center shadow-lg"
                        onClick={() => onConfirm(itemName)}
                    >
                        Sim, Remover
                    </button>
                </div>
            </div>
        </Modal>
    );
}
