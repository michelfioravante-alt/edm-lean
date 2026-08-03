import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Split, ArrowRight, RotateCcw, Boxes } from 'lucide-react';

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
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <Boxes className="w-12 h-12 text-kanban-teal mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">Lote Parcialmente Concluído</h3>
                    {concluidasBanco > 0 ? (
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Você concluiu <span className="text-kanban-teal font-black">{concluidasBanco}</span> peças de um total de <span className="text-slate-200 font-bold">{total}</span>.
                        </p>
                    ) : (
                        <div className="space-y-2 w-full mt-2">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Informe quantas peças deste lote foram concluídas agora.
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Peças concluídas</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={Math.max(0, total - 1)}
                                    value={manualConcluidas}
                                    onChange={(e) => setManualConcluidas(e.target.value)}
                                    className="w-20 px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-center text-sm font-bold text-slate-100 focus:outline-none focus:border-kanban-amber"
                                />
                                <span className="text-xs text-slate-500">de {total}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Se concluir o lote inteiro, use apenas <span className="font-semibold text-slate-300">Avançar Tudo</span>.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onConfirm('all')}
                        className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-kanban-blue hover:bg-slate-900 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-kanban-blue/10 rounded-lg text-kanban-blue group-hover:bg-kanban-blue group-hover:text-white transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-slate-100 uppercase tracking-wider text-xs">Avançar Tudo</div>
                                <div className="text-[10px] text-slate-500 font-medium">Move as {osData.quantidade} peças para a próxima fase.</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onConfirm('split', concluidasEfetivas)}
                        className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-kanban-amber hover:bg-slate-900 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-kanban-amber/10 rounded-lg text-kanban-amber group-hover:bg-kanban-amber group-hover:text-white transition-colors">
                                <Split className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-slate-100 uppercase tracking-wider text-xs">Desmembrar (Split)</div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                    {concluidasEfetivas > 0 && faltantes > 0
                                        ? `Avança ${concluidasEfetivas} peças e cria nova O.S com ${faltantes} para a fila.`
                                        : 'Avança apenas parte do lote e mantém o restante em uma nova O.S.'}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-kanban-amber uppercase bg-kanban-amber/10 px-2 py-0.5 rounded">Sugerido</span>
                        </div>
                    </button>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                    <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-full">Cancelar</Button>
                </div>
            </div>
        </Modal>
    );
}
