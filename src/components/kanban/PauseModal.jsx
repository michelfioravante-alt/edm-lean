import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAppStore } from '../../store/useAppStore';

import { MOTIVOS_PAUSA_CNC } from '../../constants/cncProcess';
import { SECTORS } from '../../constants/sectorConstants';

export default function PauseModal({ isOpen, onClose, onConfirm, osData }) {
    const { estoque, maquinas, operadores, registrarTrocaConsumivel, configuracoesGlobais, ferramentasMaquina, activeSector } = useAppStore();

    const osSector = osData?.setor || activeSector || 'CNC';
    const MOTIVOS_PAUSA = SECTORS[osSector]?.motivosPausa || MOTIVOS_PAUSA_CNC;

    const filteredEstoque = (estoque || []).filter(item => {
        if (!item.setor || item.setor === 'TODOS' || osSector === 'TODOS') return true;
        return item.setor === osSector;
    });

    const filteredMaquinas = (maquinas || []).filter(m => {
        if (!m.setor || m.setor === 'TODOS' || osSector === 'TODOS') return true;
        return m.setor === osSector;
    });

    const filteredOperadores = (operadores || []).filter(op => {
        if (!op.setor || op.setor === 'TODOS' || osSector === 'TODOS') return true;
        return op.setor === osSector;
    });



    const estrategiaOs = osData?.estrategia_ferramental || osData?.estrategiaFerramental
        || configuracoesGlobais?.modoMagazineDefault || 'individual';
    const isModoLote = estrategiaOs === 'lote';

    const [motivo, setMotivo] = useState('');
    const [observacao, setObservacao] = useState('');

    // Estados específicos para Troca de Insumo
    const [trocaMaquina, setTrocaMaquina] = useState('');
    const [trocaInsumo, setTrocaInsumo] = useState('');
    const [trocaOperador, setTrocaOperador] = useState('');

    // Estados compartilhados troca/quebra de ferramenta (modo individual)
    const [ferramentaEstoqueId, setFerramentaEstoqueId] = useState('');
    const [ferramentaMaquina, setFerramentaMaquina] = useState('');
    const [ferramentaOperador, setFerramentaOperador] = useState('');
    const [ferramentaSaiuId, setFerramentaSaiuId] = useState('');
    const [trocaSlot, setTrocaSlot] = useState('');
    const [quebraRetroativo, setQuebraRetroativo] = useState(false);
    const [horaInicioQuebra, setHoraInicioQuebra] = useState('');
    const [horaFimQuebra, setHoraFimQuebra] = useState('');

    // Estados específicos para Falta de Energia
    const [horaInicioEnergia, setHoraInicioEnergia] = useState('');
    const [horaFimEnergia, setHoraFimEnergia] = useState('');
    const [aplicarGlobal, setAplicarGlobal] = useState(true);

    const isAlreadyPaused = osData?.is_pausado || osData?.isPausado;

    const maquinaOsNome = osData?.maquina_nome || osData?.maquina || '';
    const ferramentasNaMaquina = (ferramentasMaquina || []).filter(
        (f) => (f.maquinaNome || f.maquina_nome) === maquinaOsNome || (f.osId || f.os_id) === osData?.id
    );

    useEffect(() => {
        if (!isOpen || !osData) return;
        if (motivo !== 'Quebra de Ferramenta' && motivo !== 'Troca de Ferramenta') return;
        if (maquinaOsNome && !ferramentaMaquina) {
            const m = maquinas.find((x) => x.nome === maquinaOsNome);
            if (m) setFerramentaMaquina(m.id);
        }
        const op = osData.operador_atual || osData.operadorAtual;
        if (op && !ferramentaOperador) setFerramentaOperador(op);
    }, [isOpen, osData, motivo, maquinas, ferramentaMaquina, ferramentaOperador, maquinaOsNome]);

    const resetForm = () => {
        setMotivo('');
        setObservacao('');
        setTrocaMaquina('');
        setTrocaInsumo('');
        setTrocaOperador('');
        setFerramentaEstoqueId('');
        setFerramentaMaquina('');
        setFerramentaOperador('');
        setFerramentaSaiuId('');
        setTrocaSlot('');
        setQuebraRetroativo(false);
        setHoraInicioQuebra('');
        setHoraFimQuebra('');
        setHoraInicioEnergia('');
        setHoraFimEnergia('');
        setAplicarGlobal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let obsFinal = observacao;

        if (!isAlreadyPaused && motivo === 'Troca de Insumo') {
            if (!trocaMaquina || !trocaInsumo || !trocaOperador) {
                alert("Por favor, preencha a máquina, o insumo e o operador para registrar a troca.");
                return;
            }
            registrarTrocaConsumivel(trocaMaquina, trocaInsumo, trocaOperador);

            const nomeMaquina = maquinas.find(m => m.id === trocaMaquina)?.nome || 'Máquina';
            obsFinal = `Troca de insumo: ${trocaInsumo} na máquina ${nomeMaquina} por ${trocaOperador}. ${observacao}`.trim();
        } else if (!isAlreadyPaused && motivo === 'Troca de Ferramenta') {
            if (!ferramentaEstoqueId || !ferramentaMaquina || !ferramentaOperador) {
                alert('Selecione a ferramenta do estoque, a máquina e o operador.');
                return;
            }
            const item = estoque.find((i) => i.id === ferramentaEstoqueId);
            const maquinaNome = maquinas.find((m) => m.id === ferramentaMaquina)?.nome || '';
            onConfirm({
                tipo: 'trocaFerramentaEstoque',
                estoqueItemId: ferramentaEstoqueId,
                itemNome: item?.nome || '',
                maquinaNome,
                operadorNome: ferramentaOperador,
                codigoPeca: osData.codigo_peca || osData.codigoPeca || '',
                observacao,
                slot: trocaSlot.trim() || null,
                ferramentaSaiuId: ferramentaSaiuId || null,
                fimDeCiclo: !!ferramentaSaiuId || isModoLote,
            });
            resetForm();
            return;
        } else if (!isAlreadyPaused && motivo === 'Quebra de Ferramenta') {
            if (!ferramentaEstoqueId || !ferramentaMaquina || !ferramentaOperador) {
                alert('Selecione a ferramenta do estoque, a máquina e o operador.');
                return;
            }
            if (quebraRetroativo) {
                if (!horaInicioQuebra || !horaFimQuebra) {
                    alert('Informe o horário de início e término da parada por quebra.');
                    return;
                }
                const [hIni, mIni] = horaInicioQuebra.split(':').map(Number);
                const [hFim, mFim] = horaFimQuebra.split(':').map(Number);
                const inicioMin = hIni * 60 + mIni;
                const fimMin = hFim * 60 + mFim;
                if (isNaN(inicioMin) || isNaN(fimMin) || fimMin <= inicioMin) {
                    alert('Horário de retorno deve ser maior que o horário de início.');
                    return;
                }
            }

            const item = estoque.find((i) => i.id === ferramentaEstoqueId);
            const maquinaNome = maquinas.find((m) => m.id === ferramentaMaquina)?.nome || '';

            onConfirm({
                tipo: 'quebraFerramenta',
                retroativo: quebraRetroativo,
                estoqueItemId: ferramentaEstoqueId,
                itemNome: item?.nome || '',
                maquinaNome,
                operadorNome: ferramentaOperador,
                codigoPeca: osData.codigo_peca || osData.codigoPeca || '',
                observacao,
                horaInicioQuebra: quebraRetroativo ? horaInicioQuebra : null,
                horaFimQuebra: quebraRetroativo ? horaFimQuebra : null,
            });

            resetForm();
            return;
        } else if (!isAlreadyPaused && motivo === 'Falta de Energia') {
            if (!horaInicioEnergia || !horaFimEnergia) {
                alert("Por favor, preencha o horário de início e término da falta de energia.");
                return;
            }

            const [hIni, mIni] = horaInicioEnergia.split(':').map(Number);
            const [hFim, mFim] = horaFimEnergia.split(':').map(Number);
            const inicioMin = hIni * 60 + mIni;
            const fimMin = hFim * 60 + mFim;
            if (isNaN(inicioMin) || isNaN(fimMin) || fimMin <= inicioMin) {
                alert("Horário de retorno deve ser maior que o horário de início.");
                return;
            }

            obsFinal = `Período sem energia: de ${horaInicioEnergia} às ${horaFimEnergia}. ${observacao}`.trim();

            onConfirm({
                tipo: 'faltaEnergiaRetroativa',
                horaInicioEnergia,
                horaFimEnergia,
                observacaoPausa: obsFinal,
                aplicarGlobal
            });

            resetForm();
            return;
        }

        if (isAlreadyPaused) {
            onConfirm({
                isPausado: false,
                motivoPausa: null,
                observacaoPausa: null,
                dataRetomada: new Date().toISOString()
            });
        } else {
            onConfirm({
                isPausado: true,
                motivoPausa: motivo,
                observacaoPausa: obsFinal,
                dataPausa: new Date().toISOString()
            });
        }

        resetForm();
    };

    if (!osData) return null;

    const codigoPeca = osData.codigo_peca || osData.codigoPeca;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isAlreadyPaused ? `Retomar Produção: ${codigoPeca}` : `Pausar O.S: ${codigoPeca}`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isAlreadyPaused ? (
                    <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-xl text-slate-300 shadow-xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-kanban-green"></div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Deseja Retomar Produção?</h3>
                        <p className="text-slate-400 text-sm">A workstation será reativada e o cronômetro voltará a contar.</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Atalhos Rápidos de Usinagem</label>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {[
                                    'Envio Tratamento Térmico (Ext.)',
                                    'Troca de Insert',
                                    'Ajuste de Offset / Zero',
                                    'Troca de Ferramenta',
                                    'Quebra de Ferramenta',
                                    'Entrada de outra O.S.',
                                ].map((quickReason) => (
                                    <button
                                        key={quickReason}
                                        type="button"
                                        onClick={() => setMotivo(quickReason)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                            motivo === quickReason
                                                ? 'bg-kanban-amber text-slate-950 shadow-md scale-105'
                                                : quickReason.includes('Térmico')
                                                ? 'bg-purple-950/80 text-purple-200 border border-purple-800 hover:border-purple-500'
                                                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-kanban-amber/60 hover:text-white'
                                        }`}
                                    >
                                        {quickReason.includes('Térmico') ? '🔥 ' : '⚡ '}{quickReason}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-sm font-bold text-slate-300 mb-2">Motivo da Pausa *</label>
                            <select
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 font-bold text-lg [color-scheme:dark]"
                            >
                                <option value="" disabled>Selecione um motivo...</option>
                                <option value="Envio Tratamento Térmico (Ext.)">🔥 Envio Tratamento Térmico (Externo)</option>
                                {MOTIVOS_PAUSA.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {motivo === 'Envio Tratamento Térmico (Ext.)' && (
                            <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl space-y-2 text-xs text-purple-200 animate-in fade-in duration-200">
                                <strong className="text-purple-300 flex items-center gap-1.5 font-bold uppercase text-xs">
                                    🔥 Devolução para Fila Inicial (A Fazer)
                                </strong>
                                <p className="leading-relaxed">
                                    Ao confirmar o envio para Tratamento Térmico externo, esta peça sairá da máquina atual e voltará para a coluna **&quot;A fazer&quot;** com a etiqueta <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">[Aguardando Retorno T.T.]</span>.
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                    Isso libera a máquina para receber outros componentes e não polui o fluxo ativo de corte da oficina.
                                </p>
                            </div>
                        )}

                        {motivo === 'Outros' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Observação Adicional *</label>
                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Detalhe o motivo da pausa..."
                                    className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-lg bg-slate-950 placeholder-slate-600"
                                />
                            </div>
                        )}

                        {motivo === 'Quebra de Ferramenta' && (
                            <div className="bg-slate-900 border border-red-500/30 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-slate-100 flex items-center gap-2">
                                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs uppercase tracking-widest">Quebra</span>
                                    Ferramenta + estoque
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Registra operador, máquina e peça <strong className="text-slate-400">{codigoPeca}</strong> e desconta 1 unidade do estoque.
                                </p>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Ferramenta que quebrou *</label>
                                    <select
                                        value={ferramentaEstoqueId}
                                        onChange={(e) => setFerramentaEstoqueId(e.target.value)}
                                        className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]"
                                        required
                                    >
                                        <option value="" disabled>Selecione no estoque...</option>
                                        {filteredEstoque.filter((i) => i.quantidade > 0).map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.nome} (Disp: {item.quantidade})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Máquina *</label>
                                    <select
                                        value={ferramentaMaquina}
                                        onChange={(e) => setFerramentaMaquina(e.target.value)}
                                        className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]"
                                        required
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {filteredMaquinas.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Operador *</label>
                                    <select
                                        value={ferramentaOperador}
                                        onChange={(e) => setFerramentaOperador(e.target.value)}
                                        className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]"
                                        required
                                    >
                                        <option value="" disabled>Quem estava na máquina...</option>
                                        {filteredOperadores.map((o) => (
                                            <option key={o.id} value={o.nome}>{o.nome}</option>
                                        ))}
                                    </select>

                                </div>

                                <div className="flex items-start gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                                    <input
                                        id="quebraRetroativo"
                                        type="checkbox"
                                        checked={quebraRetroativo}
                                        onChange={(e) => setQuebraRetroativo(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-kanban-amber focus:ring-kanban-amber"
                                    />
                                    <div>
                                        <label htmlFor="quebraRetroativo" className="text-xs font-bold text-slate-200">
                                            Registrar tempo retroativo (operador registrou depois)
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Desconta o período da parada sem deixar a O.S. pausada agora — útil quando o operador foi direto à máquina.
                                        </p>
                                    </div>
                                </div>

                                {quebraRetroativo && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-1">Início da parada</label>
                                            <input
                                                type="time"
                                                value={horaInicioQuebra}
                                                onChange={(e) => setHoraInicioQuebra(e.target.value)}
                                                required
                                                className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-1">Retorno à usinagem</label>
                                            <input
                                                type="time"
                                                value={horaFimQuebra}
                                                onChange={(e) => setHoraFimQuebra(e.target.value)}
                                                required
                                                className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {motivo === 'Troca de Ferramenta' && (
                            <div className="bg-slate-900 border border-kanban-amber/30 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-slate-100 flex items-center gap-2">
                                    <span className="bg-kanban-amber text-slate-900 px-2 py-1 rounded text-xs uppercase tracking-widest">Setup</span>
                                    Nova ferramenta na máquina
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                    Setup físico no torno (fim de ciclo ou nova OP). Troca automática do magazine não entra aqui — leva segundos e não vale pausar.
                                </p>

                                {ferramentasNaMaquina.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Ferramenta que saiu (fim de ciclo)</label>
                                        <select
                                            value={ferramentaSaiuId}
                                            onChange={(e) => setFerramentaSaiuId(e.target.value)}
                                            className="w-full p-2 border border-slate-800 rounded-lg text-slate-100 bg-slate-950 [color-scheme:dark]"
                                        >
                                            <option value="">Não informar</option>
                                            {ferramentasNaMaquina.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.itemNome || f.item_nome}{f.slot ? ` (${f.slot})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Nova ferramenta (estoque) *</label>
                                    <select
                                        value={ferramentaEstoqueId}
                                        onChange={(e) => setFerramentaEstoqueId(e.target.value)}
                                        className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 [color-scheme:dark]"
                                        required
                                    >
                                        <option value="" disabled>Selecione no estoque...</option>
                                        {estoque.filter((i) => i.quantidade > 0).map((item) => (
                                            <option key={item.id} value={item.id}>{item.nome} (Disp: {item.quantidade})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Posição / T</label>
                                        <input type="text" placeholder="T02" value={trocaSlot} onChange={(e) => setTrocaSlot(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg text-slate-100 bg-slate-950" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Máquina *</label>
                                        <select value={ferramentaMaquina} onChange={(e) => setFerramentaMaquina(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 [color-scheme:dark]" required>
                                            <option value="" disabled>Selecione...</option>
                                            {maquinas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Operador *</label>
                                    <select value={ferramentaOperador} onChange={(e) => setFerramentaOperador(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 [color-scheme:dark]" required>
                                        <option value="" disabled>Quem montou...</option>
                                        {operadores.map((o) => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {motivo === 'Falta de Energia' && (
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-slate-100 flex items-center gap-2">
                                    <span className="bg-kanban-red text-white px-2 py-1 rounded text-xs uppercase tracking-widest">Atenção</span>
                                    Registro de Horário Retrospectivo
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Hora Inicial</label>
                                        <input
                                            type="time"
                                            value={horaInicioEnergia}
                                            onChange={(e) => setHoraInicioEnergia(e.target.value)}
                                            required
                                            className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Hora de Retorno</label>
                                        <input
                                            type="time"
                                            value={horaFimEnergia}
                                            onChange={(e) => setHoraFimEnergia(e.target.value)}
                                            required
                                            className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex items-start gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                                    <input
                                        id="aplicarGlobalEnergia"
                                        type="checkbox"
                                        checked={aplicarGlobal}
                                        onChange={(e) => setAplicarGlobal(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-kanban-amber focus:ring-kanban-amber"
                                    />
                                    <div>
                                        <label htmlFor="aplicarGlobalEnergia" className="text-xs font-bold text-slate-200">
                                            Deseja registrar esta falta de energia para todo o sistema?
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Aplica este mesmo período de parada a todas as O.S. ativas em Set-up, Corte e Aferição.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {motivo === 'Troca de Insumo' && (
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-kanban-amber flex items-center gap-2">
                                    <span className="bg-kanban-amber text-slate-900 px-2 py-1 rounded text-xs uppercase tracking-widest">Estoque</span>
                                    Registro de Retirada
                                </h4>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Máquina Parada Onde Ocorreu a Troca</label>
                                    <select value={trocaMaquina} onChange={e => setTrocaMaquina(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]" required>
                                        <option value="" disabled>Selecione...</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Insumo Utilizado</label>
                                    <select value={trocaInsumo} onChange={e => setTrocaInsumo(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]" required>
                                        <option value="" disabled>Selecione o insumo...</option>
                                        {estoque.filter(i => i.quantidade > 0).map(item => (
                                            <option key={item.id} value={item.nome}>{item.nome} (Disp: {item.quantidade})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Operador Responsável</label>
                                    <select value={trocaOperador} onChange={e => setTrocaOperador(e.target.value)} className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark] touch-manipulation" required>
                                        <option value="" disabled>Quem efetuou a troca...</option>
                                        {operadores.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {(motivo !== '' && motivo !== 'Outros' && motivo !== 'Quebra de Ferramenta' && motivo !== 'Troca de Ferramenta') && (
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Observação Extra (Opcional)</label>
                                <input
                                    type="text"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder="Alguma nota sobre a parada de máquina?"
                                    className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-lg bg-slate-950 placeholder-slate-600"
                                />
                            </div>
                        )}

                        {(motivo === 'Quebra de Ferramenta' || motivo === 'Troca de Ferramenta') && (
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Observação (opcional)</label>
                                <input
                                    type="text"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder={motivo === 'Quebra de Ferramenta' ? 'Ex: quebrou no acabamento OP20...' : 'Ex: montou T03 broca Ø6...'}
                                    className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-lg bg-slate-950 placeholder-slate-600"
                                />
                            </div>
                        )}
                    </>
                )}

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-800 mt-8">
                    <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button
                        type="submit"
                        variant={isAlreadyPaused ? "success" : "primary"}
                        size="lg"
                        className="w-2/3 shadow-md"
                    >
                        {isAlreadyPaused ? 'Retomar Produção' : (
                            motivo === 'Quebra de Ferramenta'
                                ? (quebraRetroativo ? 'Registrar quebra (retroativo)' : 'Registrar quebra e pausar')
                                : (motivo === 'Troca de Ferramenta' ? 'Registrar setup e pausar' : 'Confirmar Pausa')
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
