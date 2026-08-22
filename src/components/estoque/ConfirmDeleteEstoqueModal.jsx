import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteEstoqueModal({ isOpen, onClose, onConfirm, itemName }) {
    if (!itemName) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excluir Item do Estoque">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(200,85,88,0.1)] flex items-center justify-center mb-6 border border-[#C85558]/20">
                    <Trash2 className="w-8 h-8 text-[#C85558]" />
                </div>

                <h4 className="text-xl font-bold text-[#E7E9ED] text-center mb-2">
                    Remover "{itemName}"?
                </h4>

                <p className="text-[#E7E9ED] text-center text-sm mb-8 leading-relaxed">
                    Você está prestes a excluir permanentemente este item do inventário.
                    <br /><br />
                    Esta ação <span className="font-bold underline text-[#C85558]">não pode</span> ser desfeita. Tem certeza?
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
                        className="flex-1 bg-[#C85558] hover:bg-[#b04548] text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#C85558] focus:ring-offset-2 flex items-center justify-center shadow-lg"
                        onClick={() => onConfirm(itemName)}
                    >
                        Sim, Remover
                    </button>
                </div>
            </div>
        </Modal>
    );
}
