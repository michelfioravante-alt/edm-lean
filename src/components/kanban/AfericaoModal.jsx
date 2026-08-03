import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AfericaoModal({ isOpen, onClose, onConfirm, osData }) {
    const [resultado, setResultado] = useState(null);
    const [motivoRefugo, setMotivoRefugo] = useState('');
    const [inspecaoConfirmada, setInspecaoConfirmada] = useState(true);
    const [avancarProximoSetup, setAvancarProximoSetup] = useState(false);

    const setupAtual = osData?.setup_atual || osData?.setupAtual || 1;
    const totalSetups = osData?.total_setups || osData?.totalSetups || 1;
    const temProximoSetup = setupAtual < totalSetups;
    const proximoSetupNome = osData?.nomes_setups?.[setupAtual] || `OP${(setupAtual + 1) * 10}`;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (resultado && inspecaoConfirmada) {
            onConfirm({
                resultadoAfericao: resultado,
                motivoRefugo: resultado === 'Refugo' ? motivoRefugo : null,
                dataAfericao: new Date().toISOString(),
                avancarProximoSetup: resultado === 'Aprovada' ? avancarProximoSetup : false,
            });
            setResultado(null);
            setMotivoRefugo('');
            setInspecaoConfirmada(true);
            setAvancarProximoSetup(false);
        }
    };

    if (!osData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Inspeção de Qualidade: ${osData.codigoPeca || osData.codigo_peca || 'O.S.'}`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    {/* Checklist simples de confirmação no estilo EDM Lean */}
                    <div className="mb-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                        <label className="flex items-center gap-3 text-sm font-bold text-slate-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={inspecaoConfirmada}
                                onChange={(e) => setInspecaoConfirmada(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-kanban-green focus:ring-0 cursor-pointer"
                            />
                            <span>Inspeção dimensional / visual realizada</span>
                        </label>
                    </div>

                    <h3 className="text-center font-bold text-slate-100 text-base mb-4">
                        Resultado da inspeção:
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setResultado('Aprovada')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all ${resultado === 'Aprovada'
                                ? 'border-kanban-green bg-kanban-green/10'
                                : 'border-slate-800 bg-slate-900 hover:border-kanban-green/50'
                                }`}
                        >
                            <CheckCircle2 className={`w-10 h-10 mb-2 ${resultado === 'Aprovada' ? 'text-kanban-green' : 'text-slate-400'}`} />
                            <span className={`font-extrabold text-base ${resultado === 'Aprovada' ? 'text-kanban-green' : 'text-slate-400'}`}>
                                APROVADA
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setResultado('Refugo')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all ${resultado === 'Refugo'
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-slate-800 bg-slate-900 hover:border-red-500/50'
                                }`}
                        >
                            <XCircle className={`w-10 h-10 mb-2 ${resultado === 'Refugo' ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={`font-extrabold text-base ${resultado === 'Refugo' ? 'text-red-500' : 'text-slate-400'}`}>
                                REFUGO
                            </span>
                        </button>
                    </div>

                    {/* Caso possua múltiplos setups definidos pelo programador */}
                    {resultado === 'Aprovada' && temProximoSetup && (
                        <div className="mt-4 bg-kanban-amber/10 border border-kanban-amber/30 p-3 rounded-xl animate-in fade-in duration-200">
                            <label className="flex items-center gap-3 text-xs font-bold text-amber-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={avancarProximoSetup}
                                    onChange={(e) => setAvancarProximoSetup(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-kanban-amber focus:ring-0 cursor-pointer"
                                />
                                <span>Avançar para o próximo Setup ({proximoSetupNome} - {setupAtual + 1}/{totalSetups})</span>
                            </label>
                            <p className="text-[11px] text-slate-400 mt-1 pl-7">
                                Retorna a peça para a coluna Setup para a próxima virada de peça.
                            </p>
                        </div>
                    )}

                    {resultado === 'Refugo' && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                Motivo do Refugo (Opcional)
                            </label>
                            <textarea
                                value={motivoRefugo}
                                onChange={(e) => setMotivoRefugo(e.target.value)}
                                placeholder="Descreva brevemente por que a peça foi reprovada..."
                                rows={3}
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none text-sm transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                    <Button type="button" variant="outline" size="md" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-2/3 shadow-md"
                        disabled={!resultado || !inspecaoConfirmada}
                    >
                        {avancarProximoSetup ? `Ir para ${proximoSetupNome}` : 'Concluir O.S.'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
