import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import Button from '../common/Button';
import { labelSetor, listarKanbansDoGrupo, textoRoteiroPassos, roteiroDaOs } from '../../constants/osWorkflow';
import { urlKanbanOs } from '../../utils/folhaProcesso';
import { resolveFolhaImagemSrc } from '../../services/osPrints';
import { useAppStore } from '../../store/useAppStore';

function textoRoteiro(os, irmaos) {
    const passos = roteiroDaOs(os, irmaos);
    if (passos.length) return textoRoteiroPassos(passos);
    const lista = (irmaos && irmaos.length > 1) ? irmaos : (os ? [os] : []);
    return lista.map((k) => labelSetor(k.setor || k.tipo_processo)).join('  →  ');
}

function FolhaA4({ os, qr, irmaos }) {
    const peca = os.codigo_peca || os.codigoPeca || 'S/N';
    const molde = os.codigo_molde || os.codigoMolde;
    const prazo = os.prazo_entrega || os.prazoEntrega;
    const prazoTxt = prazo ? String(prazo).slice(0, 10).split('-').reverse().join('/') : '—';
    const desenho = os.link_desenho || os.linkDesenho || '—';
    const programaPath = os.link_programa || os.linkPrograma || os.nx_import?.linkPrograma || os.nxImport?.linkPrograma || '';
    const obs = os.observacoes || os.observacao || '';
    const img = resolveFolhaImagemSrc(os.folha_imagem || os.folhaImagem);
    const qtd = os.quantidade || 1;
    const roteiro = textoRoteiro(os, irmaos);
    const qrUrl = os.id ? urlKanbanOs(os.id) : '';

    return (
        <div className="folha-a4 bg-white text-black mx-auto mb-6 overflow-hidden w-full max-w-[210mm]">
            <div className="flex justify-between items-start border-b-2 border-black px-4 sm:px-6 py-3 sm:py-4 gap-3">
                <div className="min-w-0">
                    <div className="text-[10px] tracking-[0.2em] uppercase">EDM Lean · Folha de processo</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1 break-words">{peca}</div>
                    {molde ? <div className="text-xs mt-0.5">Molde: {molde}</div> : null}
                    <div className="text-sm mt-1">{os.cliente || '—'}</div>
                </div>
                {qr && (
                    <div className="shrink-0 text-center">
                        <img src={qr} alt="QR do kanban" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto" />
                        <div className="text-[8px] text-neutral-600 mt-1 max-w-[96px] leading-tight">Abre este kanban</div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-6 py-3 text-xs border-b border-neutral-400">
                <div>
                    <span className="uppercase tracking-wider text-neutral-600">Código</span>
                    <div className="font-semibold text-sm font-mono break-all">{peca}</div>
                </div>
                <div>
                    <span className="uppercase tracking-wider text-neutral-600">Quantidade</span>
                    <div className="font-semibold text-sm">{qtd} {qtd === 1 ? 'peça' : 'peças'}</div>
                </div>
                <div>
                    <span className="uppercase tracking-wider text-neutral-600">Setor atual</span>
                    <div className="font-semibold text-sm">{labelSetor(os.setor || os.tipo_processo)}</div>
                </div>
                <div>
                    <span className="uppercase tracking-wider text-neutral-600">Prazo</span>
                    <div className="font-semibold text-sm">{prazoTxt}</div>
                </div>
            </div>
            <div className="px-4 sm:px-6 py-3 border-b border-neutral-400">
                <span className="text-[10px] uppercase tracking-wider text-neutral-600">Caminho do kanban</span>
                <div className="font-semibold text-sm mt-0.5">{roteiro || labelSetor(os.setor || os.tipo_processo)}</div>
                {irmaos?.length > 1 && (
                    <ol className="mt-2 text-xs space-y-0.5">
                        {irmaos.map((k, i) => (
                            <li key={k.id || i}>
                                {i + 1}. {labelSetor(k.setor || k.tipo_processo)}
                                {k.id === os.id ? ' ← este cartão' : ''}
                                {k.status ? ` · ${k.status}` : ''}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            <div className="px-4 sm:px-6 py-2 text-xs border-b border-neutral-400">
                <span className="uppercase tracking-wider text-neutral-600">Desenho da peça</span>
                <div className="font-mono text-[10px] break-all">{desenho}</div>
            </div>
            {programaPath ? (
            <div className="px-4 sm:px-6 py-2 text-xs border-b border-neutral-400">
                <span className="uppercase tracking-wider text-neutral-600">Programa CAM</span>
                <div className="font-mono text-[10px] break-all">{programaPath}</div>
            </div>
            ) : null}
            <div className="px-4 sm:px-6 py-4">
                {img ? (
                    <img src={img} alt="Peça" className="w-full max-h-[50vh] print:max-h-[150mm] object-contain bg-neutral-100" />
                ) : (
                    <div className="h-[80mm] print:h-[120mm] border border-dashed border-neutral-400 flex items-center justify-center text-neutral-500 text-sm">
                        Sem print da peça.
                    </div>
                )}
            </div>
            {obs && (
                <div className="px-4 sm:px-6 pb-4">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">Observações</div>
                    <p className="text-sm whitespace-pre-wrap border border-neutral-300 p-3 min-h-[20mm]">{obs}</p>
                </div>
            )}
            <div className="px-4 sm:px-6 pb-6 text-[9px] text-neutral-500 break-all">
                QR: {qrUrl}
            </div>
        </div>
    );
}

export default function FolhaProcessoModal({ osList, onClose }) {
    const [qrs, setQrs] = useState({});
    const lista = (osList || []).filter(Boolean);
    const kanban = useAppStore((s) => s.kanban);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const next = {};
            for (const os of lista) {
                if (!os?.id) continue;
                try {
                    next[os.id] = await QRCode.toDataURL(urlKanbanOs(os.id), {
                        margin: 1,
                        width: 240,
                        color: { dark: '#000000', light: '#ffffff' },
                    });
                } catch {
                    next[os.id] = '';
                }
            }
            if (!cancelled) setQrs(next);
        })();
        return () => { cancelled = true; };
    }, [lista.map((o) => o.id).join(',')]);

    useEffect(() => {
        if (!lista.length) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [lista.length]);

    if (!lista.length) return null;

    return createPortal(
        <div className="fixed inset-0 z-[400] bg-black/80 overflow-y-auto print:bg-white print:static print:overflow-visible" id="folha-print-root">
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 py-3 bg-[#181B22] border-b border-[#262A33] print:hidden">
                <p className="text-xs sm:text-sm text-[#E7E9ED]">Folha de processo — no celular use Imprimir e “Salvar PDF”.</p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onClose}>Fechar</Button>
                    <Button type="button" variant="primary" size="sm" className="flex-1 sm:flex-none" onClick={() => window.print()}>
                        <span className="inline-flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Imprimir / PDF</span>
                    </Button>
                </div>
            </div>
            <div className="py-4 px-2 sm:px-4 print:p-0">
                {lista.map((os) => (
                    <FolhaA4 key={os.id} os={os} qr={qrs[os.id]} irmaos={listarKanbansDoGrupo(kanban, os)} />
                ))}
            </div>
        </div>,
        document.body
    );
}
