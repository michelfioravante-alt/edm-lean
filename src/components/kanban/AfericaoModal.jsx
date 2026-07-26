import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AfericaoModal({ isOpen, onClose, onConfirm, osData }) {
    const [resultado, setResultado] = useState(null);
    const [motivoRefugo, setMotivoRefugo] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (resultado) {
            onConfirm({
                resultadoAfericao: resultado,
                motivoRefugo: resultado === 'Refugo' ? motivoRefugo : null,
                dataAfericao: new Date().toISOString()
            });
            setResultado(null);
            setMotivoRefugo('');
        }
    };

    if (!osData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Aferição de Qualidade${osData.codigoPeca || osData.codigo_peca ? ': ' + (osData.codigoPeca || osData.codigo_peca) : ''}`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-center font-bold text-slate-100 text-lg mb-4">
                        Qual foi o resultado da aferição desta peça?
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setResultado('Aprovada')}
                            className={`flex flex-col items-center justify-center p-6 border-4 rounded-xl transition-all ${resultado === 'Aprovada'
                                ? 'border-kanban-green bg-kanban-green/10'
                                : 'border-slate-800 bg-slate-900 hover:border-kanban-green/50'
                                }`}
                        >
                            <CheckCircle2 className={`w-12 h-12 mb-2 ${resultado === 'Aprovada' ? 'text-kanban-green' : 'text-slate-400'}`} />
                            <span className={`font-extrabold text-lg ${resultado === 'Aprovada' ? 'text-kanban-green' : 'text-slate-400'}`}>
                                APROVADA
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setResultado('Refugo')}
                            className={`flex flex-col items-center justify-center p-6 border-4 rounded-xl transition-all ${resultado === 'Refugo'
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-slate-800 bg-slate-900 hover:border-red-500/50'
                                }`}
                        >
                            <XCircle className={`w-12 h-12 mb-2 ${resultado === 'Refugo' ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={`font-extrabold text-lg ${resultado === 'Refugo' ? 'text-red-500' : 'text-slate-400'}`}>
                                REFUGO
                            </span>
                        </button>
                    </div>

                    {resultado === 'Refugo' && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                Motivo do Refugo (Opcional)
                            </label>
                            <textarea
                                value={motivoRefugo}
                                onChange={(e) => setMotivoRefugo(e.target.value)}
                                placeholder="Descreva brevemente por que a peça foi reprovada..."
                                rows={3}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                    <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-2/3 shadow-md"
                        disabled={!resultado}
                    >
                        Finalizar O.S.
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
