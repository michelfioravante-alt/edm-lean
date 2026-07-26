import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Clock, Scissors, PlusCircle, Calculator } from 'lucide-react';
import CalculadoraTempoModal from '../common/CalculadoraTempoModal';

export default function ExtraSetupModal({ isOpen, onClose, onConfirm, osData }) {
    const [addMore, setAddMore] = useState(false);
    const [extraSetupH, setExtraSetupH] = useState('0');
    const [extraSetupM, setExtraSetupM] = useState('0');
    const [extraCorteH, setExtraCorteH] = useState('0');
    const [extraCorteM, setExtraCorteM] = useState('0');
    const [showCalculator, setShowCalculator] = useState(false);

    const handleConfirm = () => {
        if (!addMore) {
            onConfirm(null); // Just move
            return;
        }

        onConfirm({
            extraSetupH: parseInt(extraSetupH || '0'),
            extraSetupM: parseInt(extraSetupM || '0'),
            extraCorteH: parseInt(extraCorteH || '0'),
            extraCorteM: parseInt(extraCorteM || '0')
        });
    };

    const handleApplyCalculation = (h, m) => {
        setExtraCorteH(h.toString());
        setExtraCorteM(m.toString());
        setShowCalculator(false);
    };

    const inputCls = "w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-center focus:border-kanban-amber outline-none";
    const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Deseja realizar mais um set-up?"
            maxWidth="max-w-md"
        >
            <div className="space-y-6">
                <p className="text-slate-400 text-sm leading-relaxed">
                    Você está movendo o serviço <span className="text-white font-bold">{osData?.codigo_peca || osData?.codigoPeca}</span> de volta para o Set-up. Deseja adicionar tempos extras planejados para esta nova etapa?
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => setAddMore(false)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${!addMore ? 'border-slate-500 bg-slate-800/50' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
                    >
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Não</span>
                        <span className="text-sm font-black text-white">Apenas mover</span>
                    </button>
                    <button
                        onClick={() => setAddMore(true)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${addMore ? 'border-kanban-amber bg-kanban-amber/10' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
                    >
                        <PlusCircle className={`w-5 h-5 ${addMore ? 'text-kanban-amber' : 'text-slate-600'}`} />
                        <span className="text-sm font-black text-white">Sim, somar tempos</span>
                    </button>
                </div>

                {addMore && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-kanban-amber" />
                                <span className="text-xs font-bold text-slate-300">Cálculo de Perímetro/Múltiplos?</span>
                            </div>
                            <button
                                onClick={() => setShowCalculator(true)}
                                className="text-[10px] font-black uppercase tracking-widest bg-kanban-amber text-slate-900 px-3 py-1.5 rounded-md hover:bg-yellow-400 transition-colors shadow-sm"
                            >
                                Abrir Assistente
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-kanban-amber" /> Set-up Extra
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className={labelCls}>Hrs</label>
                                        <input type="number" min="0" value={extraSetupH} onChange={e => setExtraSetupH(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={labelCls}>Min</label>
                                        <input type="number" min="0" max="59" value={extraSetupM} onChange={e => setExtraSetupM(e.target.value)} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                    <Scissors className="w-3 h-3 text-kanban-teal" /> Corte Extra
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className={labelCls}>Hrs</label>
                                        <input type="number" min="0" value={extraCorteH} onChange={e => setExtraCorteH(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={labelCls}>Min</label>
                                        <input type="number" min="0" max="59" value={extraCorteM} onChange={e => setExtraCorteM(e.target.value)} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic text-center">
                            Estes valores serão somados aos tempos estimados originais do serviço.
                        </p>
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="flex-1" onClick={handleConfirm}>Confirmar</Button>
                </div>

                {/* Nested Calculator Modal */}
                <Modal
                    isOpen={showCalculator}
                    onClose={() => setShowCalculator(false)}
                    title="Calculadora de Tempo"
                    maxWidth="max-w-md"
                >
                    <CalculadoraTempoModal
                        onCalculate={handleApplyCalculation}
                        onClose={() => setShowCalculator(false)}
                        initialQuantidade={osData?.quantidade || 1}
                    />
                </Modal>
            </div>
        </Modal>
    );
}
