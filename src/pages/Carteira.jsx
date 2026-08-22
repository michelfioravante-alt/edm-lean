import React, { useMemo, useState } from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import NovaOSForm from '../components/kanban/NovaOSForm';
import FolhaProcessoModal from '../components/kanban/FolhaProcessoModal';
import {
    agruparCarteira,
    labelSetor,
    labelStatusExterno,
    kanbanPrecisaProgramar,
    custoHoraKanban,
    colKeyDoKanban,
} from '../constants/osWorkflow';

const FILTROS = [
    { id: 'todas', label: 'Todas' },
    { id: 'atrasando', label: 'Atrasando prazo' },
    { id: 'a_programar', label: 'A programar' },
    { id: 'em_terceiro', label: 'Em terceiro' },
    { id: 'peca_pronta', label: 'Peça pronta p/ retirada' },
];

function gargaloTexto(row) {
    if (row.tudoPronto) return 'Conjunto pronto';
    const g = row.gargalo;
    if (!g) return '—';
    const peca = g.codigo_peca || g.codigoPeca || 'kanban';
    const extra = kanbanPrecisaProgramar(g) ? ' · a programar' : '';
    return `${labelSetor(g.setor || g.tipo_processo)} — ${peca}${extra}`;
}

export default function Carteira({ onNavigate }) {
    const kanban = useAppStore((s) => s.kanban);
    const config = useAppStore((s) => s.configuracoesGlobais);
    const irParaKanban = useAppStore((s) => s.irParaKanban);
    const moveOrdemServico = useAppStore((s) => s.moveOrdemServico);
    const [filtro, setFiltro] = useState('todas');
    const [busca, setBusca] = useState('');
    const [ficha, setFicha] = useState(null);
    const [novaOs, setNovaOs] = useState(false);
    const [folhasPrint, setFolhasPrint] = useState(null);

    const carteira = useMemo(() => agruparCarteira(kanban, config || {}), [kanban, config]);

    const linhas = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return carteira.filter((row) => {
            if (filtro === 'atrasando' && !row.atrasada) return false;
            if (filtro === 'a_programar' && !row.aProgramar) return false;
            if (filtro === 'em_terceiro' && !row.emTerceiro) return false;
            if (filtro === 'peca_pronta' && !row.pecaPronta) return false;
            if (!q) return true;
            return (
                (row.titulo || '').toLowerCase().includes(q)
                || (row.cliente || '').toLowerCase().includes(q)
            );
        });
    }, [carteira, filtro, busca]);

    const filaExterna = useMemo(() => {
        return carteira.flatMap((row) =>
            row.externos
                .filter((k) => (k.statusLocal || k.status) !== 'Concluído')
                .map((k) => ({ row, kanban: k }))
        );
    }, [carteira]);

    const verQuadro = (os) => {
        irParaKanban(os);
        onNavigate?.('kanban');
    };

    const moverExterno = (os, destCol) => {
        const source = colKeyDoKanban(kanban, os.id);
        if (!source || source === destCol) return;
        const statusMap = {
            aFazer: 'A fazer',
            emCorte: 'Em Usinagem',
            concluido: 'Concluído',
        };
        moveOrdemServico(os.id, source, destCol, { status: statusMap[destCol] });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#262A33] pb-3">
                <div>
                    <h1 className="font-['Space_Grotesk'] text-lg font-semibold text-[#E7E9ED]">Carteira de O.S.</h1>
                    <p className="text-xs text-[#7B808F] mt-1">
                        Moldes e peças avulsas. O Kanban do setor fica no menu, para olhar gargalo.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setNovaOs(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[7px] bg-[#D97D3D] text-[#111318] text-xs font-semibold cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Nova O.S.
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {FILTROS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFiltro(f.id)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium border cursor-pointer ${
                            filtro === f.id
                                ? 'border-[#D97D3D] text-[#D97D3D] bg-[rgba(217,125,61,0.12)]'
                                : 'border-[#262A33] text-[#7B808F] bg-[#181B22]'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente ou código"
                className="w-full max-w-md px-3 py-2 border border-[#262A33] bg-[#111318] rounded-[8px] text-sm text-[#E7E9ED] placeholder-[#565B68]"
            />

            {filtro === 'em_terceiro' ? (
                <div className="border border-[#262A33] rounded-[10px] overflow-hidden bg-[#181B22]">
                    <div className="px-4 py-2.5 border-b border-[#262A33] text-[10px] font-semibold uppercase tracking-wider text-[#565B68]">
                        Fila externo — fornecedor
                    </div>
                    {filaExterna.length === 0 ? (
                        <p className="p-4 text-sm text-[#7B808F]">Nenhum kanban de serviço externo aberto.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase text-[#565B68] bg-[#1F232B]">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">O.S. / peça</th>
                                        <th className="px-3 py-2 font-medium">Cliente</th>
                                        <th className="px-3 py-2 font-medium">Status</th>
                                        <th className="px-3 py-2 font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#262A33]">
                                    {filaExterna.map(({ row, kanban: k }) => (
                                        <tr key={k.id} className="text-[#E7E9ED]">
                                            <td className="px-3 py-2.5">
                                                <div className="font-medium">{row.titulo}</div>
                                                <div className="text-[11px] text-[#7B808F]">{k.codigo_peca || k.codigoPeca}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-[#9DA2AE]">{row.cliente || '—'}</td>
                                            <td className="px-3 py-2.5 text-[#C99A4A]">{labelStatusExterno(k)}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex flex-wrap gap-1">
                                                    <button type="button" onClick={() => moverExterno(k, 'aFazer')} className="text-[10px] px-2 py-1 rounded border border-[#262A33] text-[#7B808F] cursor-pointer">A enviar</button>
                                                    <button type="button" onClick={() => moverExterno(k, 'emCorte')} className="text-[10px] px-2 py-1 rounded border border-[#262A33] text-[#7B808F] cursor-pointer">No terceiro</button>
                                                    <button type="button" onClick={() => moverExterno(k, 'concluido')} className="text-[10px] px-2 py-1 rounded border border-[#262A33] text-[#7B808F] cursor-pointer">Voltou</button>
                                                    <button type="button" onClick={() => setFicha(row)} className="text-[10px] px-2 py-1 rounded border border-[#D97D3D]/40 text-[#D97D3D] cursor-pointer">Ficha</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="border border-[#262A33] rounded-[10px] overflow-hidden bg-[#181B22]">
                    {linhas.length === 0 ? (
                        <p className="p-6 text-sm text-[#7B808F]">Nenhuma O.S. neste filtro. Crie uma O.S. ou solte o filtro.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase text-[#565B68] bg-[#1F232B]">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">O.S.</th>
                                        <th className="px-3 py-2 font-medium">Cliente</th>
                                        <th className="px-3 py-2 font-medium">Prazo</th>
                                        <th className="px-3 py-2 font-medium">Gargalo agora</th>
                                        <th className="px-3 py-2 font-medium">Externos</th>
                                        <th className="px-3 py-2 font-medium">Hora / orçado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#262A33]">
                                    {linhas.map((row) => (
                                        <tr
                                            key={row.grupoId}
                                            onClick={() => setFicha(row)}
                                            className={`cursor-pointer hover:bg-[#1F232B]/80 ${row.atrasada ? 'bg-[rgba(200,85,88,0.06)]' : ''}`}
                                        >
                                            <td className="px-3 py-2.5">
                                                <div className="font-medium text-[#E7E9ED]">{row.titulo || 'S/N'}</div>
                                                <div className="text-[10px] text-[#565B68] uppercase tracking-wider">
                                                    {row.isMolde ? `Molde · ${row.kanbans.length} kanbans` : 'Peça avulsa'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-[#9DA2AE]">{row.cliente || '—'}</td>
                                            <td className={`px-3 py-2.5 ${row.atrasada ? 'text-[#C85558]' : 'text-[#9DA2AE]'}`}>
                                                {row.prazo ? String(row.prazo).slice(0, 10) : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#E7E9ED]">{gargaloTexto(row)}</td>
                                            <td className="px-3 py-2.5 text-[#7B808F]">
                                                {row.emTerceiro ? `${row.externos.length} em terceiro` : (row.externos.length ? 'externo ok' : '—')}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="text-[#D97D3D]">R$ {row.custoHora.toFixed(0)}</span>
                                                <span className="text-[#565B68] text-xs">
                                                    {row.orcado != null ? ` / ${row.orcado.toFixed(0)}` : ''}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <NovaOSForm isOpen={novaOs} onClose={() => setNovaOs(false)} onCreated={setFolhasPrint} />
            {folhasPrint && <FolhaProcessoModal osList={folhasPrint} onClose={() => setFolhasPrint(null)} />}

            <Modal
                isOpen={!!ficha}
                onClose={() => setFicha(null)}
                title={ficha ? `Ficha · ${ficha.titulo}` : ''}
                maxWidth="max-w-2xl"
            >
                {ficha && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 text-xs text-[#7B808F]">
                            <span>Cliente: <b className="text-[#E7E9ED]">{ficha.cliente || '—'}</b></span>
                            <span>Prazo do {ficha.isMolde ? 'molde' : 'item'}: <b className="text-[#E7E9ED]">{ficha.prazo ? String(ficha.prazo).slice(0, 10) : '—'}</b></span>
                            {ficha.orcado != null && (
                                <span>Orçado: <b className="text-[#E7E9ED]">R$ {ficha.orcado.toFixed(2)}</b></span>
                            )}
                            <span>Custo hora: <b className="text-[#D97D3D]">R$ {ficha.custoHora.toFixed(2)}</b></span>
                        </div>
                        <p className="text-[11px] text-[#565B68]">
                            Peça pronta pode sair antes do conjunto. Clique em ver no quadro para o Kanban daquele setor.
                        </p>
                        <ul className="space-y-2">
                            {ficha.kanbans.map((k, i) => {
                                const custo = custoHoraKanban(k, config || {});
                                const setor = k.setor || k.tipo_processo;
                                return (
                                    <li key={k.id} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border border-[#262A33] rounded-[8px] px-3 py-2 bg-[#111318]">
                                        <div>
                                            <div className="text-sm text-[#E7E9ED]">
                                                {i + 1}. {k.codigo_peca || k.codigoPeca} · {labelSetor(setor)}
                                            </div>
                                            <div className="text-[11px] text-[#7B808F]">
                                                {setor === 'EXTERNO' ? labelStatusExterno(k) : (k.status || '—')}
                                                {kanbanPrecisaProgramar(k) ? ' · a programar' : ''}
                                                {custo.custo > 0 ? ` · R$ ${custo.custo.toFixed(2)}` : ''}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => verQuadro(k)}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97D3D] cursor-pointer shrink-0"
                                        >
                                            Ver no quadro <ArrowUpRight className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <Button type="button" variant="outline" onClick={() => setFicha(null)}>Fechar</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
