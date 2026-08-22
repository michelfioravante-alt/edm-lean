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
            onConfirm(null);
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

    const inputCls = "w-full p-2 bg-[#111318] border border-[#262A33] rounded-[6px] text-[#E7E9ED] font-bold text-center focus:border-[#D97D3D] outline-none transition-colors text-sm";
    const labelCls = "block text-[10px] font-semibold text-[#565B68] uppercase tracking-wider mb-1";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Deseja realizar mais um set-up?"
            maxWidth="max-w-md"
        >
            <div className="space-y-5">
                <p className="text-[#7B808F] text-sm leading-relaxed">
                    Você está movendo o serviço <span className="text-[#E7E9ED] font-semibold">{osData?.codigo_peca || osData?.codigoPeca}</span> de volta para o Set-up. Deseja adicionar tempos extras planejados para esta nova etapa?
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => setAddMore(false)}
                        className={`flex-1 p-3.5 rounded-[8px] border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${!addMore ? 'border-[#333844] bg-[#1F232B]' : 'border-[#262A33] bg-[#111318] opacity-50'}`}
                    >
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#565B68]">Não</span>
                        <span className="text-sm font-semibold text-[#E7E9ED]">Apenas mover</span>
                    </button>
                    <button
                        onClick={() => setAddMore(true)}
                        className={`flex-1 p-3.5 rounded-[8px] border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${addMore ? 'border-[#D97D3D] bg-[rgba(217,125,61,0.08)]' : 'border-[#262A33] bg-[#111318] opacity-50'}`}
                    >
                        <PlusCircle className={`w-5 h-5 ${addMore ? 'text-[#D97D3D]' : 'text-[#565B68]'}`} />
                        <span className="text-sm font-semibold text-[#E7E9ED]">Sim, somar tempos</span>
                    </button>
                </div>

                {addMore && (
                    <div className="bg-[#111318] border border-[#262A33] rounded-[8px] p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between items-center bg-[#1F232B] p-3 rounded-[7px] border border-[#333844]">
                            <div className="flex items-center gap-2">
                                <Calculator className="w-3.5 h-3.5 text-[#D97D3D]" />
                                <span className="text-xs font-medium text-[#9DA2AE]">Cálculo de Perímetro/Múltiplos?</span>
                            </div>
                            <button
                                onClick={() => setShowCalculator(true)}
                                className="text-[10px] font-semibold uppercase tracking-widest bg-[#D97D3D] text-[#111318] px-3 py-1.5 rounded-[5px] hover:bg-[#c46d32] transition-colors cursor-pointer"
                            >
                                Abrir Assistente
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#9DA2AE] flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-[#D97D3D]" /> Set-up Extra
                                </label>
                                <div className="flex gap-2">
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
                                <label className="text-xs font-semibold text-[#9DA2AE] flex items-center gap-2">
                                    <Scissors className="w-3 h-3 text-[#4A9D74]" /> Corte Extra
                                </label>
                                <div className="flex gap-2">
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
                        <p className="text-[10px] text-[#565B68] italic text-center">
                            Estes valores serão somados aos tempos estimados originais do serviço.
                        </p>
                    </div>
                )}

                <div className="pt-2 flex gap-3 border-t border-[#262A33]">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
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
