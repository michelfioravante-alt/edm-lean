import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Split, ArrowRight, Boxes } from 'lucide-react';

export default function SplitModal({ isOpen, onClose, onConfirm, osData }) {
    if (!osData) return null;

    const concluidasBanco = osData.quantidade_concluida || 0;
    const total = osData.quantidade || 1;

    const [manualConcluidas, setManualConcluidas] = useState(
        concluidasBanco > 0 ? concluidasBanco : ''
    );

    const concluidasEfetivas =
        concluidasBanco > 0
            ? concluidasBanco
            : Math.max(0, Math.min(total, parseInt(manualConcluidas || '0', 10) || 0));

    const faltantes = Math.max(0, total - concluidasEfetivas);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Entrega Parcial de Lote"
            maxWidth="max-w-md"
        >
            <div className="space-y-4">
                <div className="flex flex-col items-center text-center p-4 bg-[#111318] rounded-[8px] border border-[#262A33]">
                    <Boxes className="w-10 h-10 text-[#4A9D74] mb-3" />
                    <h3 className="text-sm font-semibold text-[#E7E9ED] mb-2">Lote Parcialmente Concluído</h3>
                    {concluidasBanco > 0 ? (
                        <p className="text-[#7B808F] text-xs leading-relaxed">
                            Você concluiu <span className="text-[#4A9D74] font-bold">{concluidasBanco}</span> peças de um total de <span className="text-[#E7E9ED] font-semibold">{total}</span>.
                        </p>
                    ) : (
                        <div className="space-y-2 w-full mt-1">
                            <p className="text-[#7B808F] text-xs leading-relaxed">
                                Informe quantas peças deste lote foram concluídas agora.
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                                <span className="text-[10px] font-semibold text-[#565B68] uppercase tracking-wider">Peças concluídas</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={Math.max(0, total - 1)}
                                    value={manualConcluidas}
                                    onChange={(e) => setManualConcluidas(e.target.value)}
                                    className="w-20 px-2 py-1 rounded-[6px] bg-[#111318] border border-[#262A33] text-center text-sm font-bold text-[#E7E9ED] focus:outline-none focus:border-[#D97D3D] transition-colors"
                                />
                                <span className="text-xs text-[#565B68]">de {total}</span>
                            </div>
                            <p className="text-[10px] text-[#565B68]">
                                Se concluir o lote inteiro, use apenas <span className="font-semibold text-[#9DA2AE]">Avançar Tudo</span>.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => onConfirm('all')}
                        className="w-full flex items-center justify-between p-3.5 bg-[#111318] border border-[#262A33] rounded-[8px] hover:border-[#D97D3D] hover:bg-[#1F232B] transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[rgba(217,125,61,0.1)] rounded-[6px] text-[#D97D3D] group-hover:bg-[#D97D3D] group-hover:text-[#111318] transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-[#E7E9ED] uppercase tracking-wider text-xs">Avançar Tudo</div>
                                <div className="text-[10px] text-[#565B68] font-medium">Move as {osData.quantidade} peças para a próxima fase.</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onConfirm('split', concluidasEfetivas)}
                        className="w-full flex items-center justify-between p-3.5 bg-[#111318] border border-[#262A33] rounded-[8px] hover:border-[#C99A4A] hover:bg-[#1F232B] transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[rgba(201,154,74,0.1)] rounded-[6px] text-[#C99A4A] group-hover:bg-[#C99A4A] group-hover:text-[#111318] transition-colors">
                                <Split className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-[#E7E9ED] uppercase tracking-wider text-xs">Desmembrar (Split)</div>
                                <div className="text-[10px] text-[#565B68] font-medium">
                                    {concluidasEfetivas > 0 && faltantes > 0
                                        ? `Avança ${concluidasEfetivas} peças e cria nova O.S com ${faltantes} para a fila.`
                                        : 'Avança apenas parte do lote e mantém o restante em uma nova O.S.'}
                                </div>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#C99A4A] uppercase bg-[rgba(201,154,74,0.1)] px-2 py-0.5 rounded-[4px] shrink-0">Sugerido</span>
                    </button>
                </div>

                <div className="pt-2 border-t border-[#262A33]">
                    <Button type="button" variant="ghost" className="w-full" onClick={onClose}>Cancelar</Button>
                </div>
            </div>
        </Modal>
    );
}
