import React, { useEffect, useState } from 'react';
import { Check, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
    RELATORIOS_EXPORT,
    baixarWorkbook,
    gerarWorkbook,
    intervaloPeriodo,
    nomeArquivoExport,
    rotuloPeriodo,
} from '../../utils/exportarPlanilha';

const PERIODOS = [
    { id: '7d', label: '7 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'mes_ant', label: 'Mês passado' },
    { id: 'ano', label: 'Este ano' },
    { id: 'tudo', label: 'Tudo' },
    { id: 'intervalo', label: 'Intervalo' },
];

const IDS_TODOS = RELATORIOS_EXPORT.map((r) => r.id);
const IDS_UTEIS = ['resumo', 'ordens', 'carteira', 'concluidas', 'estoque'];

function Chip({ ativo, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                ativo
                    ? 'bg-[#D97D3D] text-[#111318]'
                    : 'border border-[#333844] bg-[#111318] text-[#9DA2AE] hover:text-[#E7E9ED]'
            }`}
        >
            {children}
        </button>
    );
}

export default function ExportarDadosModal({ open, onClose }) {
    const nomeEmpresa = useAuthStore((s) => s.nomeEmpresa);
    const kanban = useAppStore((s) => s.kanban);
    const estoque = useAppStore((s) => s.estoque);
    const movimentacoesEstoque = useAppStore((s) => s.movimentacoesEstoque);
    const clientes = useAppStore((s) => s.clientes);
    const ferramental = useAppStore((s) => s.ferramental);
    const configuracoesGlobais = useAppStore((s) => s.configuracoesGlobais);
    const fetchMovimentacoesEstoque = useAppStore((s) => s.fetchMovimentacoesEstoque);

    const [modo, setModo] = useState('completo');
    const [periodo, setPeriodo] = useState('mes');
    const [de, setDe] = useState('');
    const [ate, setAte] = useState('');
    const [setor, setSetor] = useState('TODOS');
    const [ids, setIds] = useState(IDS_UTEIS);
    const [busy, setBusy] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!open) return;
        fetchMovimentacoesEstoque?.();
        setErro('');
    }, [open, fetchMovimentacoesEstoque]);

    if (!open) return null;

    const escolhidos = modo === 'completo' ? IDS_TODOS : ids;
    const { de: d0, ate: d1 } = intervaloPeriodo(periodo, de, ate);

    const toggleId = (id) => {
        setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const gerar = async () => {
        if (periodo === 'intervalo' && (!de || !ate)) {
            setErro('Informe o início e o fim do intervalo.');
            return;
        }
        if (!escolhidos.length) {
            setErro('Escolha ao menos um relatório.');
            return;
        }
        setErro('');
        setBusy(true);
        try {
            const wb = await gerarWorkbook({
                empresa: nomeEmpresa,
                periodoLabel: rotuloPeriodo(periodo, de, ate),
                ids: escolhidos,
                kanban,
                estoque,
                movimentacoes: movimentacoesEstoque,
                clientes,
                ferramental,
                configHora: configuracoesGlobais,
                de: d0,
                ate: d1,
                setor,
            });
            await baixarWorkbook(wb, nomeArquivoExport(nomeEmpresa));
            onClose();
        } catch (e) {
            setErro(e.message || 'Não foi possível gerar o arquivo.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar" onClick={onClose} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] text-[#E7E9ED]">Levar dados para a planilha</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">
                            Planilha no visual do app. Datas e reais no padrão brasileiro.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]" aria-label="Fechar">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-5">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setModo('completo')}
                            className={`rounded-lg border p-3 text-left ${
                                modo === 'completo' ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#333844] bg-[#111318]'
                            }`}
                        >
                            <p className="text-[13px] font-semibold text-[#E7E9ED]">Relatório completo</p>
                            <p className="mt-1 text-[11px] text-[#7B808F]">Todas as abas, no período.</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModo('escolher')}
                            className={`rounded-lg border p-3 text-left ${
                                modo === 'escolher' ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#333844] bg-[#111318]'
                            }`}
                        >
                            <p className="text-[13px] font-semibold text-[#E7E9ED]">Escolher o que entra</p>
                            <p className="mt-1 text-[11px] text-[#7B808F]">Só o que você vai planilhar.</p>
                        </button>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B808F] mb-2">Período</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PERIODOS.map((p) => (
                                <Chip key={p.id} ativo={periodo === p.id} onClick={() => setPeriodo(p.id)}>
                                    {p.label}
                                </Chip>
                            ))}
                        </div>
                        {periodo === 'intervalo' && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <label className="text-[11px] text-[#7B808F]">
                                    De
                                    <input
                                        type="date"
                                        value={de}
                                        onChange={(e) => setDe(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2 text-[13px] text-[#E7E9ED]"
                                    />
                                </label>
                                <label className="text-[11px] text-[#7B808F]">
                                    Até
                                    <input
                                        type="date"
                                        value={ate}
                                        onChange={(e) => setAte(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2 text-[13px] text-[#E7E9ED]"
                                    />
                                </label>
                            </div>
                        )}
                        <p className="mt-2 text-[11px] text-[#565B68]">
                            Ordens usam abertura, prazo ou conclusão. Estoque é o saldo de agora. Carteira é o quadro aberto.
                        </p>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B808F] mb-2">Setor</p>
                        <select
                            value={setor}
                            onChange={(e) => setSetor(e.target.value)}
                            className="w-full rounded-md border border-[#333844] bg-[#111318] p-2.5 text-sm font-medium text-[#E7E9ED]"
                        >
                            <option value="TODOS">Toda a fábrica</option>
                            <option value="CNC">CNC</option>
                            <option value="EDM_FIO">Eletrofio</option>
                            <option value="EXTERNO">Serviço fora</option>
                        </select>
                    </div>

                    {modo === 'escolher' && (
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B808F] mb-2">Relatórios</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {RELATORIOS_EXPORT.map((r) => {
                                    const on = ids.includes(r.id);
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => toggleId(r.id)}
                                            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-left ${
                                                on ? 'border-[#D97D3D]/50 bg-[#D97D3D]/10' : 'border-[#333844] bg-[#111318]'
                                            }`}
                                        >
                                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                on ? 'border-[#D97D3D] bg-[#D97D3D] text-[#111318]' : 'border-[#565B68]'
                                            }`}>
                                                {on ? <Check className="h-3 w-3" /> : null}
                                            </span>
                                            <span>
                                                <span className="block text-[12px] font-medium text-[#E7E9ED]">{r.titulo}</span>
                                                <span className="block text-[11px] text-[#7B808F]">{r.dica}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {erro ? <p className="text-[12px] text-[#C85558]">{erro}</p> : null}
                </div>

                <div className="flex gap-2 border-t border-[#262A33] px-5 py-3">
                    <button
                        type="button"
                        onClick={gerar}
                        disabled={busy}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                        Baixar Excel
                    </button>
                    <button type="button" onClick={onClose} className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED]">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
