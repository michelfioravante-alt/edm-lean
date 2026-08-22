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
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    {/* Checklist de confirmação */}
                    <div className="mb-4 bg-[#111318] border border-[#262A33] p-3 rounded-[8px]">
                        <label className="flex items-center gap-3 text-sm font-medium text-[#E7E9ED] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={inspecaoConfirmada}
                                onChange={(e) => setInspecaoConfirmada(e.target.checked)}
                                className="w-4 h-4 rounded border-[#333844] bg-[#111318] text-[#4A9D74] focus:ring-0 cursor-pointer accent-[#4A9D74]"
                            />
                            <span>Inspeção dimensional / visual realizada</span>
                        </label>
                    </div>

                    <h3 className="text-center font-semibold text-[#E7E9ED] text-sm mb-4">
                        Resultado da inspeção:
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setResultado('Aprovada')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-[10px] transition-all cursor-pointer ${resultado === 'Aprovada'
                                ? 'border-[#4A9D74] bg-[rgba(74,157,116,0.1)]'
                                : 'border-[#262A33] bg-[#111318] hover:border-[#4A9D74]/50'
                                }`}
                        >
                            <CheckCircle2 className={`w-10 h-10 mb-2 ${resultado === 'Aprovada' ? 'text-[#4A9D74]' : 'text-[#565B68]'}`} />
                            <span className={`font-bold text-sm ${resultado === 'Aprovada' ? 'text-[#4A9D74]' : 'text-[#565B68]'}`}>
                                APROVADA
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setResultado('Refugo')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-[10px] transition-all cursor-pointer ${resultado === 'Refugo'
                                ? 'border-[#C85558] bg-[rgba(200,85,88,0.1)]'
                                : 'border-[#262A33] bg-[#111318] hover:border-[#C85558]/50'
                                }`}
                        >
                            <XCircle className={`w-10 h-10 mb-2 ${resultado === 'Refugo' ? 'text-[#C85558]' : 'text-[#565B68]'}`} />
                            <span className={`font-bold text-sm ${resultado === 'Refugo' ? 'text-[#C85558]' : 'text-[#565B68]'}`}>
                                REFUGO
                            </span>
                        </button>
                    </div>

                    {/* Múltiplos setups */}
                    {resultado === 'Aprovada' && temProximoSetup && (
                        <div className="mt-4 bg-[rgba(201,154,74,0.08)] border border-[#C99A4A]/30 p-3 rounded-[8px] animate-in fade-in duration-200">
                            <label className="flex items-center gap-3 text-xs font-medium text-[#C99A4A] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={avancarProximoSetup}
                                    onChange={(e) => setAvancarProximoSetup(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#333844] focus:ring-0 cursor-pointer accent-[#C99A4A]"
                                />
                                <span>Avançar para o próximo Setup ({proximoSetupNome} - {setupAtual + 1}/{totalSetups})</span>
                            </label>
                            <p className="text-[11px] text-[#7B808F] mt-1 pl-7">
                                Retorna a peça para a coluna Setup para a próxima virada de peça.
                            </p>
                        </div>
                    )}

                    {resultado === 'Refugo' && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-[10px] font-semibold text-[#565B68] mb-2 uppercase tracking-widest">
                                Motivo do Refugo (Opcional)
                            </label>
                            <textarea
                                value={motivoRefugo}
                                onChange={(e) => setMotivoRefugo(e.target.value)}
                                placeholder="Descreva brevemente por que a peça foi reprovada..."
                                rows={3}
                                className="w-full p-3 bg-[#111318] border border-[#262A33] rounded-[7px] text-[#E7E9ED] placeholder:text-[#565B68] focus:border-[#C85558]/50 outline-none text-sm transition-all resize-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 border-t border-[#262A33] pt-4">
                    <Button type="button" variant="ghost" size="md" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-2/3"
                        disabled={!resultado || !inspecaoConfirmada}
                    >
                        {avancarProximoSetup ? `Ir para ${proximoSetupNome}` : 'Concluir O.S.'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
