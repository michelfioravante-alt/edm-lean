import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Wrench, AlertTriangle, Trash2, History, MapPin, User, Cpu, Info, Clock } from 'lucide-react';
import { TIPOS_FERRAMENTAL, STATUS_FERRAMENTAL } from '../constants/cncProcess';
import { formatarDataBR, formatarHoras } from '../utils/formatters';

export default function Ferramental() {
    const {
        ferramental,
        historicoFerramental,
        maquinas,
        operadores,
        kanban,
        fetchFerramental,
        addFerramentalItem,
        registrarQuebraFerramenta,
        removeFerramentalItem,
    } = useAppStore();

    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('Fresa');
    const [registrarCodigo, setRegistrarCodigo] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [motivoCodigo, setMotivoCodigo] = useState('');
    const [vidaUtil, setVidaUtil] = useState('');
    const [alertaHoras, setAlertaHoras] = useState('');
    const [schemaMissing, setSchemaMissing] = useState(false);

    const [quebraId, setQuebraId] = useState('');
    const [quebraMaquina, setQuebraMaquina] = useState('');
    const [quebraOperador, setQuebraOperador] = useState('');
    const [quebraObs, setQuebraObs] = useState('');

    const [selectedTool, setSelectedTool] = useState(null);

    useEffect(() => {
        fetchFerramental().catch((err) => {
            if (err?.message?.includes('ferramental') || err?.code === '42P01') {
                setSchemaMissing(true);
            }
        });
    }, [fetchFerramental]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        try {
            await addFerramentalItem({
                nome: nome.trim(),
                tipo,
                codigo: registrarCodigo ? codigo.trim() : '',
                observacao: registrarCodigo ? motivoCodigo.trim() : '',
                vidaUtilHoras: vidaUtil,
                alertaHoras,
            });
            setNome('');
            setRegistrarCodigo(false);
            setCodigo('');
            setMotivoCodigo('');
            setVidaUtil('');
            setAlertaHoras('');
            setSchemaMissing(false);
        } catch (err) {
            console.error(err);
            alert('Erro ao cadastrar ferramenta. Verifique a conexão.');
        }
    };

    const handleQuebra = async (e) => {
        e.preventDefault();
        if (!quebraId || !quebraMaquina || !quebraOperador) return;
        const maquinaNome = maquinas.find((m) => m.id === quebraMaquina)?.nome || '';
        try {
            await registrarQuebraFerramenta({
                ferramentalId: quebraId,
                maquinaNome,
                operadorNome: quebraOperador,
                observacao: quebraObs,
            });
            setQuebraId('');
            setQuebraMaquina('');
            setQuebraOperador('');
            setQuebraObs('');
        } catch (err) {
            console.error(err);
            alert('Erro ao registrar quebra.');
        }
    };

    const pctVida = (f) => {
        if (!f || !f.vida_util_horas || f.vida_util_horas <= 0) return 0;
        return Math.min(100, (f.horas_usadas / f.vida_util_horas) * 100);
    };

    // Dados da ferramenta selecionada para o modal de detalhes
    const maquinaAlocada = selectedTool?.maquina_id
        ? maquinas.find((m) => m.id === selectedTool.maquina_id)
        : null;

    const osAtivaNaMaquina = maquinaAlocada
        ? ((kanban?.emCorte || []).find((os) => os.maquina_nome === maquinaAlocada.nome || os.maquina === maquinaAlocada.nome) ||
           (kanban?.setup || []).find((os) => os.maquina_nome === maquinaAlocada.nome || os.maquina === maquinaAlocada.nome))
        : null;

    const historicoDaFerramenta = selectedTool
        ? historicoFerramental.filter((h) => h.ferramental_id === selectedTool.id || h.ferramentalId === selectedTool.id)
        : [];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <Wrench className="text-kanban-amber w-7 h-7" />
                    Ferramental CNC
                </h1>
                <p className="text-[#7B808F] text-sm mt-2 max-w-2xl">
                    Controle de ferramentas de usinagem (fresas, brocas, inserts, mandris).
                    Clique em qualquer card do inventário para ver **detalhes de localização, O.S. em andamento e quem registrou quebras**.
                </p>
            </div>

            {schemaMissing && (
                <div className="bg-kanban-amber/10 border border-kanban-amber/30 rounded-2xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="text-kanban-amber shrink-0 mt-0.5" />
                    <div className="text-sm text-[#E7E9ED]">
                        <strong className="text-kanban-amber">Tabelas não encontradas.</strong>{' '}
                        Execute o arquivo <code className="text-white bg-[#1F232B] px-1 rounded">supabase_ferramental.sql</code> no SQL Editor do Supabase para habilitar este módulo.
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <section className="bg-[#181B22]/60 border border-[#262A33] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-1">Cadastrar ferramenta</h2>
                    <p className="text-xs text-[#565B68] mb-4">Insira o nome e tipo. Marque a opção se desejar registrar um código especificando o motivo.</p>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <input
                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white focus:border-kanban-amber outline-none"
                            placeholder="Nome da ferramenta (ex: Broca Ø6 HSS ou Fresa D10 4F)"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-1 gap-3">
                            <select
                                className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white focus:border-kanban-amber outline-none"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                {TIPOS_FERRAMENTAL.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* Opção para registrar código */}
                        <div className="pt-1">
                            <label className="flex items-center gap-2 text-xs text-[#E7E9ED] font-semibold cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={registrarCodigo}
                                    onChange={(e) => setRegistrarCodigo(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#333844] bg-[#111318] text-kanban-amber focus:ring-0"
                                />
                                Desejo registrar um código / rastreio para esta ferramenta
                            </label>
                        </div>

                        {registrarCodigo && (
                            <div className="space-y-3 p-3 bg-[#111318]/80 border border-[#262A33] rounded-xl animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-xs font-bold text-[#7B808F] mb-1">Código / ID da Ferramenta</label>
                                    <input
                                        className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2 text-sm text-white focus:border-kanban-amber outline-none"
                                        placeholder="Ex: T-104 / FR-009"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#7B808F] mb-1">Motivo / Explicação do Código</label>
                                    <textarea
                                        className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2 text-sm text-white focus:border-kanban-amber outline-none min-h-[60px]"
                                        placeholder="Por que registrar este código? (Ex: Controle de desgaste em liga dura, acabamento crítico, etc.)"
                                        value={motivoCodigo}
                                        onChange={(e) => setMotivoCodigo(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] text-[#7B808F] mb-1">Vida útil (horas) - opcional</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-3 py-2 text-sm text-white"
                                            placeholder="Ex: 40"
                                            value={vidaUtil}
                                            onChange={(e) => setVidaUtil(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-[#7B808F] mb-1">Alerta em (horas) - opcional</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-3 py-2 text-sm text-white"
                                            placeholder="Ex: 5"
                                            value={alertaHoras}
                                            onChange={(e) => setAlertaHoras(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Cadastrar Ferramenta
                        </Button>
                    </form>
                </section>

                <section className="bg-[#181B22]/60 border border-[#262A33] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        <AlertTriangle className="text-[#C85558] w-5 h-5" />
                        Registrar quebra de ferramenta
                    </h2>
                    <p className="text-xs text-[#565B68] mb-4">Registre incidentes diretos com máquina e operador para histórico da oficina.</p>
                    <form onSubmit={handleQuebra} className="space-y-3">
                        <select
                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white"
                            value={quebraId}
                            onChange={(e) => setQuebraId(e.target.value)}
                        >
                            <option value="">Selecione a ferramenta</option>
                            {ferramental.filter((f) => f.status !== 'quebrado').map((f) => (
                                <option key={f.id} value={f.id}>{f.nome} ({f.tipo})</option>
                            ))}
                        </select>
                        <select
                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white"
                            value={quebraMaquina}
                            onChange={(e) => setQuebraMaquina(e.target.value)}
                        >
                            <option value="">Máquina</option>
                            {maquinas.map((m) => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                            ))}
                        </select>
                        <select
                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white"
                            value={quebraOperador}
                            onChange={(e) => setQuebraOperador(e.target.value)}
                        >
                            <option value="">Operador</option>
                            {operadores.map((op) => (
                                <option key={op.id} value={op.nome}>{op.nome}</option>
                            ))}
                        </select>
                        <textarea
                            className="w-full bg-[#111318] border border-[#333844] rounded-xl px-4 py-2.5 text-sm text-white min-h-[72px]"
                            placeholder="Observação (ex: quebrou insert no acabamento OP20)"
                            value={quebraObs}
                            onChange={(e) => setQuebraObs(e.target.value)}
                        />
                        <Button type="submit" variant="danger" className="w-full">
                            Registrar quebra
                        </Button>
                    </form>
                </section>
            </div>

            <section className="bg-[#181B22]/60 border border-[#262A33] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Inventário ({ferramental.length})</h2>
                    <span className="text-xs text-[#565B68] font-medium">Clique no card para abrir detalhes e rastreamento</span>
                </div>
                {ferramental.length === 0 ? (
                    <p className="text-[#565B68] text-sm">Nenhuma ferramenta cadastrada.</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {ferramental.map((f) => {
                            const statusInfo = STATUS_FERRAMENTAL[f.status] || STATUS_FERRAMENTAL.disponivel;
                            const pct = pctVida(f);
                            const emAlerta = f.alerta_horas > 0 && (f.vida_util_horas - f.horas_usadas) <= f.alerta_horas;
                            const maq = f.maquina_id ? maquinas.find(m => m.id === f.maquina_id) : null;
                            return (
                                <div
                                    key={f.id}
                                    onClick={() => setSelectedTool(f)}
                                    className="bg-[#111318]/80 border border-[#262A33] hover:border-kanban-amber/60 rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:bg-[#181B22]/70 group shadow-sm hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-white group-hover:text-kanban-amber transition-colors flex items-center gap-2">
                                                {f.nome}
                                                {f.codigo && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-kanban-amber/20 text-kanban-amber border border-kanban-amber/30">
                                                        {f.codigo}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[#565B68] mt-0.5 flex items-center gap-2">
                                                <span>{f.tipo}</span>
                                                {maq && (
                                                    <span className="text-[#7B808F] font-semibold flex items-center gap-1">
                                                        · <Cpu className="w-3 h-3 text-kanban-teal" /> {maq.nome}
                                                    </span>
                                                )}
                                            </div>
                                            {f.observacao && (
                                                <div className="text-xs text-[#7B808F] bg-[#181B22]/80 p-2 rounded-lg mt-2 border border-[#262A33]">
                                                    <span className="font-bold text-[#565B68] block text-[10px] uppercase">Motivo do código:</span>
                                                    {f.observacao}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFerramentalItem(f.id);
                                            }}
                                            className="text-[#565B68] hover:text-[#C85558] p-1"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className={`text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                            {statusInfo.label}{emAlerta && f.status !== 'quebrado' ? ' · ALERTA' : ''}
                                        </div>
                                        <span className="text-[11px] text-[#565B68] group-hover:text-[#E7E9ED] transition-colors flex items-center gap-1 font-semibold">
                                            <Info className="w-3.5 h-3.5" /> Ver detalhes
                                        </span>
                                    </div>
                                    {f.vida_util_horas > 0 && (
                                        <div>
                                            <div className="flex justify-between text-[10px] text-[#565B68] mb-1">
                                                <span>{formatarHoras(f.horas_usadas)} usadas</span>
                                                <span>{formatarHoras(f.vida_util_horas)} total</span>
                                            </div>
                                            <div className="h-1.5 bg-[#1F232B] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-kanban-amber' : 'bg-kanban-teal'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {historicoFerramental.length > 0 && (
                <section className="bg-[#181B22]/60 border border-[#262A33] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-kanban-violet" />
                        Histórico recente de ferramentas
                    </h2>
                    <div className="space-y-2">
                        {historicoFerramental.slice(0, 10).map((h) => (
                            <div key={h.id} className="flex flex-wrap gap-2 text-sm border-b border-[#262A33]/60 pb-2">
                                <span className="font-bold text-[#C85558] uppercase text-xs">{h.evento}</span>
                                <span className="text-[#7B808F]">{formatarDataBR(h.created_at)}</span>
                                {h.maquina_nome && <span className="text-[#E7E9ED]">· {h.maquina_nome}</span>}
                                {h.operador_nome && <span className="text-[#565B68]">· Operador: {h.operador_nome}</span>}
                                {h.observacao && <span className="text-[#565B68] w-full text-xs">{h.observacao}</span>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* MODAL DE DETALHES COMPLETO DA FERRAMENTA */}
            <Modal
                isOpen={!!selectedTool}
                onClose={() => setSelectedTool(null)}
                title={selectedTool ? `Detalhes: ${selectedTool.nome}` : ''}
                maxWidth="max-w-lg"
            >
                {selectedTool && (
                    <div className="space-y-5">
                        {/* Status e identificação */}
                        <div className="bg-[#181B22] border border-[#262A33] p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#7B808F] uppercase tracking-wider">Tipo: {selectedTool.tipo}</span>
                                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                    selectedTool.status === 'quebrado' ? 'bg-[rgba(200,85,88,0.12)] text-[#C85558] border-[#C85558]/40' :
                                    selectedTool.status === 'em_uso' ? 'bg-kanban-teal/20 text-kanban-teal border-kanban-teal/40' :
                                    'bg-kanban-green/20 text-kanban-green border-kanban-green/40'
                                }`}>
                                    {STATUS_FERRAMENTAL[selectedTool.status]?.label || selectedTool.status}
                                </span>
                            </div>
                            {selectedTool.codigo && (
                                <div className="text-sm font-mono text-kanban-amber font-bold pt-1">
                                    Código / ID: <span className="bg-[#111318] px-2 py-0.5 rounded border border-[#262A33]">{selectedTool.codigo}</span>
                                </div>
                            )}
                            {selectedTool.observacao && (
                                <div className="text-xs text-[#E7E9ED] pt-1">
                                    <strong className="text-[#7B808F]">Motivo / Rastreio do Código:</strong>
                                    <p className="bg-[#111318] p-2 rounded-lg border border-[#262A33] mt-1">{selectedTool.observacao}</p>
                                </div>
                            )}
                        </div>

                        {/* Localização Atual e Operação em Andamento */}
                        <div className="bg-[#181B22]/80 border border-[#262A33] p-4 rounded-xl space-y-3">
                            <h3 className="text-xs font-semibold text-[#7B808F] uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-kanban-teal" />
                                Localização e O.S. Atual
                            </h3>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-[#E7E9ED]">
                                    <Cpu className="w-4 h-4 text-[#7B808F]" />
                                    <span className="text-[#7B808F]">Máquina Alocada:</span>
                                    <strong className="text-white">{maquinaAlocada?.nome || 'Ferramentaria / Disponível'}</strong>
                                </div>

                                {osAtivaNaMaquina ? (
                                    <div className="bg-[#111318] p-3 rounded-lg border border-[#262A33] space-y-1.5 mt-1">
                                        <div className="flex justify-between text-xs text-[#7B808F]">
                                            <span>O.S. em Execução:</span>
                                            <span className="font-bold text-kanban-amber">{osAtivaNaMaquina.status}</span>
                                        </div>
                                        <div className="font-bold text-white text-base">
                                            {osAtivaNaMaquina.codigo_peca || osAtivaNaMaquina.codigoPeca} — <span className="text-[#E7E9ED] font-normal">{osAtivaNaMaquina.cliente}</span>
                                        </div>
                                        {osAtivaNaMaquina.total_setups > 1 && (
                                            <div className="text-xs text-[#7B808F] font-mono">
                                                Etapa Atual: <strong className="text-[#E7E9ED]">{osAtivaNaMaquina.nomes_setups?.[(osAtivaNaMaquina.setup_atual || 1) - 1] || `OP${(osAtivaNaMaquina.setup_atual || 1) * 10}`}</strong> ({osAtivaNaMaquina.setup_atual}/{osAtivaNaMaquina.total_setups})
                                            </div>
                                        )}
                                        {osAtivaNaMaquina.operador_atual && (
                                            <div className="text-xs text-[#7B808F] flex items-center gap-1.5 pt-1">
                                                <User className="w-3.5 h-3.5 text-kanban-teal" /> Operador Responsável: <strong className="text-white">{osAtivaNaMaquina.operador_atual}</strong>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-[#565B68] italic bg-[#111318] p-2 rounded-lg border border-[#262A33]">
                                        Nenhuma Ordem de Serviço em execução ativa nesta máquina no momento.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vida Útil */}
                        {selectedTool.vida_util_horas > 0 && (
                            <div className="bg-[#181B22]/80 border border-[#262A33] p-4 rounded-xl space-y-2">
                                <h3 className="text-xs font-semibold text-[#7B808F] uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-kanban-amber" />
                                    Controle de Vida Útil
                                </h3>
                                <div className="flex justify-between text-xs text-[#E7E9ED]">
                                    <span>Horas Usadas: <strong>{formatarHoras(selectedTool.horas_usadas)}</strong></span>
                                    <span>Vida Útil Total: <strong>{formatarHoras(selectedTool.vida_util_horas)}</strong></span>
                                </div>
                                <div className="h-2 bg-[#111318] rounded-full overflow-hidden border border-[#262A33]">
                                    <div
                                        className={`h-full rounded-full ${pctVida(selectedTool) >= 90 ? 'bg-red-500' : pctVida(selectedTool) >= 70 ? 'bg-kanban-amber' : 'bg-kanban-teal'}`}
                                        style={{ width: `${pctVida(selectedTool)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ocorrências e Histórico de Quebras com Operador */}
                        <div className="bg-[#181B22]/80 border border-[#262A33] p-4 rounded-xl space-y-3">
                            <h3 className="text-xs font-semibold text-[#7B808F] uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4 text-kanban-violet" />
                                Ocorrências e Histórico da Ferramenta
                            </h3>

                            {historicoDaFerramenta.length === 0 ? (
                                <p className="text-xs text-[#565B68] italic">Nenhum evento registrado para esta ferramenta.</p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {historicoDaFerramenta.map((h) => (
                                        <div key={h.id} className="bg-[#111318] p-3 rounded-lg border border-[#262A33] text-xs space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-[#C85558] uppercase tracking-wider">{h.evento}</span>
                                                <span className="text-[#565B68] text-[11px]">{formatarDataBR(h.created_at)}</span>
                                            </div>
                                            <div className="text-[#E7E9ED] font-semibold">
                                                {h.operador_nome && <span>Operador: <strong className="text-white">{h.operador_nome}</strong></span>}
                                                {h.maquina_nome && <span className="ml-2">· Máquina: <strong className="text-white">{h.maquina_nome}</strong></span>}
                                            </div>
                                            {h.observacao && (
                                                <div className="text-[#7B808F] italic text-[11px] pt-0.5">
                                                    &quot;{h.observacao}&quot;
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

