import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Calculator, Plus, Trash2 } from 'lucide-react';

export default function CalculadoraTempoModal({ onCalculate, onClose, initialQuantidade = 1 }) {
    const [perimetro, setPerimetro] = useState('');
    const [passes, setPasses] = useState([{ id: 1, rendimento: '' }]);
    const [percentual, setPercentual] = useState(100);
    const [quantidade, setQuantidade] = useState(initialQuantidade);
    const [resultado, setResultado] = useState({ horas: 0, minutos: 0, totalMinutos: 0 });

    // Calcula o tempo sempre que os inputs mudam
    useEffect(() => {
        const mmParaDividir = parseFloat(perimetro);

        if (!perimetro || mmParaDividir <= 0 || passes.length === 0) {
            setResultado({ horas: 0, minutos: 0, totalMinutos: 0 });
            return;
        }

        let tempoCemPorCento_Minutos_Total = 0;
        let temCalculoValido = false;

        passes.forEach(passo => {
            const taxaCorte = parseFloat(passo.rendimento);
            if (taxaCorte > 0) {
                tempoCemPorCento_Minutos_Total += (mmParaDividir / taxaCorte);
                temCalculoValido = true;
            }
        });

        if (!temCalculoValido) {
            setResultado({ horas: 0, minutos: 0, totalMinutos: 0 });
            return;
        }

        // Ajuste da porcentagem de eficiência e QUANTIDADE
        const eff = parseFloat(percentual) / 100;
        const tempoReal_Minutos = (tempoCemPorCento_Minutos_Total / eff) * Math.max(1, parseInt(quantidade || 1));

        const horasTotais = Math.floor(tempoReal_Minutos / 60);
        const minutosRestantes = Math.round(tempoReal_Minutos % 60);

        setResultado({
            horas: horasTotais,
            minutos: minutosRestantes,
            totalMinutos: Math.round(tempoReal_Minutos)
        });
    }, [perimetro, passes, percentual, quantidade]);

    const handleAddPass = () => {
        if (passes.length < 3) {
            setPasses([...passes, { id: Date.now(), rendimento: '' }]);
        }
    };

    const handleRemovePass = (id) => {
        if (passes.length > 1) {
            setPasses(passes.filter(p => p.id !== id));
        }
    };

    const handleRendimentoChange = (id, value) => {
        setPasses(passes.map(p => p.id === id ? { ...p, rendimento: value } : p));
    };

    const handleApply = () => {
        onCalculate(resultado.horas, resultado.minutos, parseInt(quantidade) || 1);
    };

    return (
        <div className="space-y-4">
            <div className="flex bg-[#181B22] p-3 rounded-xl items-center gap-4 border border-[#333844]">
                <div className="bg-kanban-amber text-[#111318] p-2 rounded-lg shadow-sm">
                    <Calculator className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-[#E7E9ED]">Assistente de Cálculo Múltiplo</h4>
                    <p className="font-semibold text-sm text-[#7B808F] mt-1">Soma de tempos por passes métricos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[#E7E9ED] mb-1.5">Perímetro Unitário (mm)</label>
                    <input
                        type="number"
                        value={perimetro}
                        onChange={(e) => setPerimetro(e.target.value)}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-[#333844] bg-[#111318] rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-[#E7E9ED] font-semibold text-lg placeholder-[#565B68]"
                        placeholder="Ex: 150.5"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#E7E9ED] mb-1.5">Qtd. Peças no Lote</label>
                    <input
                        type="number"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-[#333844] bg-[#111318] rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-[#E7E9ED] font-semibold text-lg placeholder-[#565B68]"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-bold text-[#E7E9ED]">Cortes Esperados (mm/min)</label>
                    {passes.length < 3 && (
                        <button
                            type="button"
                            onClick={handleAddPass}
                            className="text-sm text-kanban-amber hover:text-[#D97D3D] font-semibold flex items-center gap-1 transition-colors bg-kanban-amber/10 hover:bg-kanban-amber/20 px-3 py-1.5 rounded-md"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Passe ({passes.length}/3)
                        </button>
                    )}
                </div>

                {passes.map((passo, index) => (
                    <div key={passo.id} className="flex items-center gap-3 bg-[#181B22] p-2 rounded-lg border border-[#333844] shadow-sm">
                        <span className="font-bold text-[#7B808F] w-20">Passe {index + 1}</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={passo.rendimento}
                            onChange={(e) => handleRendimentoChange(passo.id, e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-[#333844] bg-[#111318] rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-[#E7E9ED] text-base font-bold placeholder-[#565B68]"
                            placeholder="Veloc. (Ex: 2.5)"
                        />
                    </div>
                ))}
            </div>

            <div
                className="pt-2"
                onTouchStart={() => document.activeElement?.blur?.()}
                onClick={() => document.activeElement?.blur?.()}
            >
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-[#E7E9ED]">Corte Global (Redução de Eficiência)</label>
                    <span className="text-base text-kanban-amber font-semibold bg-kanban-amber/10 px-2 py-1 rounded">{percentual}%</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={percentual}
                    onChange={(e) => setPercentual(e.target.value)}
                    className="w-full h-3 bg-[#1F232B] rounded-lg appearance-none cursor-pointer accent-kanban-amber transition-all"
                />
                <div className="flex justify-between text-xs font-bold text-[#565B68] mt-2">
                    <span>Lento (10%)</span>
                    <span>Pleno (100%)</span>
                </div>
            </div>

            <div className="bg-[#181B22] border-2 border-[#333844] rounded-xl p-4 flex justify-between items-center shadow-lg mt-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#E7E9ED] mb-1">Tempo Total Estimado (Lote):</span>
                    {passes.length > 1 && (
                        <span className="text-xs text-[#565B68]">Soma de {passes.length} passes p/ {quantidade} peças</span>
                    )}
                </div>
                <span className="text-2xl font-semibold text-white bg-[#1F232B] border-2 border-[#333844] px-4 py-1.5 rounded-lg shadow-inner">
                    {resultado.horas}h {resultado.minutos.toString().padStart(2, '0')}m
                </span>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[#262A33] mt-5">
                <Button variant="outline" size="md" onClick={onClose} className="w-1/3">Fechar</Button>
                <Button variant="primary" size="md" onClick={handleApply} className="w-2/3 shadow-md">Aplicar na Ordem</Button>
            </div>
        </div>
    );
}
