import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MOTIVOS = {
    entrada: ['Compra / recebimento', 'Devolução da produção', 'Ajuste de inventário'],
    saida: ['Consumo na produção', 'Quebra / perda', 'Ajuste de inventário'],
};

export default function MovimentarEstoqueModal({ isOpen, onClose, item, tipoInicial = 'entrada' }) {
    const { movimentarEstoque, operadores } = useAppStore();

    const [tipo, setTipo] = useState(tipoInicial);
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');
    const [motivoOutro, setMotivoOutro] = useState('');
    const [operador, setOperador] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTipo(tipoInicial);
            setQuantidade('');
            setMotivo(MOTIVOS[tipoInicial][0]);
            setMotivoOutro('');
            setOperador('');
            setErro('');
        }
    }, [isOpen, tipoInicial, item?.id]);

    if (!item) return null;

    const trocarTipo = (novoTipo) => {
        setTipo(novoTipo);
        setMotivo(MOTIVOS[novoTipo][0]);
        setErro('');
    };

    const qtd = parseInt(quantidade) || 0;
    const saldoFinal = tipo === 'entrada' ? item.quantidade + qtd : Math.max(0, item.quantidade - qtd);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSalvando(true);
        try {
            await movimentarEstoque({
                itemId: item.id,
                tipo,
                quantidade: qtd,
                motivo: motivo === 'Outro' ? motivoOutro.trim() : motivo,
                operadorNome: operador || null,
            });
            onClose();
        } catch (err) {
            setErro(err.message);
        }
        setSalvando(false);
    };

    const inputCls = 'w-full px-3 py-2.5 border border-slate-700 bg-slate-950 rounded-lg text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-kanban-amber transition-colors';
    const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    const botaoTipo = (valor, rotulo, Icone, cor) => (
        <button
            type="button"
            onClick={() => trocarTipo(valor)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border font-bold text-sm transition-colors ${
                tipo === valor ? cor : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
        >
            <Icone className="w-4 h-4" />
            {rotulo}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Movimentar — ${item.nome}`} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex gap-2">
                    {botaoTipo('entrada', 'Entrada', ArrowDownCircle, 'bg-kanban-green/10 border-kanban-green/40 text-kanban-green')}
                    {botaoTipo('saida', 'Saída', ArrowUpCircle, 'bg-red-500/10 border-red-500/40 text-red-400')}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Quantidade</label>
                        <input
                            type="number"
                            min="1"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            required
                            autoFocus
                            placeholder="0"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Saldo após</label>
                        <div className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-slate-500 text-sm">{item.quantidade}</span>
                            <span className="text-slate-600 text-sm mx-2">→</span>
                            <span className="text-slate-100 font-bold">{saldoFinal}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Motivo</label>
                    <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls}>
                        {MOTIVOS[tipo].map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="Outro">Outro</option>
                    </select>
                    {motivo === 'Outro' && (
                        <input
                            type="text"
                            value={motivoOutro}
                            onChange={(e) => setMotivoOutro(e.target.value)}
                            required
                            placeholder="Descreva o motivo"
                            className={`${inputCls} mt-2`}
                        />
                    )}
                </div>

                <div>
                    <label className={labelCls}>Responsável (opcional)</label>
                    <select value={operador} onChange={(e) => setOperador(e.target.value)} className={inputCls}>
                        <option value="">— Não informar —</option>
                        {operadores.map((o) => (
                            <option key={o.id} value={o.nome}>{o.nome}</option>
                        ))}
                    </select>
                </div>

                {erro && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-bold">
                        {erro}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={salvando || qtd <= 0}
                        className="px-6 py-2.5 text-sm font-extrabold bg-kanban-amber hover:bg-yellow-400 text-slate-900 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {salvando ? 'Registrando...' : 'Registrar movimento'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
