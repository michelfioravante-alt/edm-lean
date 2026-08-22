import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import Button from '../common/Button';
import { labelSetor } from '../../constants/osWorkflow';
import { urlKanbanOs } from '../../utils/folhaProcesso';
import { resolveFolhaImagemSrc } from '../../services/osPrints';

function FolhaA4({ os, qr }) {
    const peca = os.codigo_peca || os.codigoPeca || 'S/N';
    const prazo = os.prazo_entrega || os.prazoEntrega;
    const prazoTxt = prazo ? String(prazo).slice(0, 10).split('-').reverse().join('/') : '—';
    const desenho = os.link_desenho || os.linkDesenho || '—';
    const obs = os.observacoes || os.observacao || '';
    const img = resolveFolhaImagemSrc(os.folha_imagem || os.folhaImagem);
    const qtd = os.quantidade || 1;

    return (
        <div className="folha-a4 bg-white text-black mx-auto mb-6 overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex justify-between items-start border-b-2 border-black px-6 py-4">
                <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase">EDM Lean · Folha de processo</div>
                    <div className="text-2xl font-bold mt-1">{peca}</div>
                    <div className="text-sm mt-1">{os.cliente || '—'} · {labelSetor(os.setor || os.tipo_processo)} · Qtd {qtd}</div>
                </div>
                {qr && <img src={qr} alt="QR" className="w-24 h-24" />}
            </div>
            <div className="grid grid-cols-3 gap-3 px-6 py-3 text-xs border-b border-neutral-400">
                <div><span className="uppercase tracking-wider text-neutral-600">Prazo</span><div className="font-semibold text-sm">{prazoTxt}</div></div>
                <div><span className="uppercase tracking-wider text-neutral-600">Setor</span><div className="font-semibold text-sm">{labelSetor(os.setor || os.tipo_processo)}</div></div>
                <div className="min-w-0"><span className="uppercase tracking-wider text-neutral-600">Desenho</span><div className="font-mono text-[10px] break-all">{desenho}</div></div>
            </div>
            <div className="px-6 py-4">
                {img ? (
                    <img src={img} alt="Peça" className="w-full max-h-[170mm] object-contain bg-neutral-100" />
                ) : (
                    <div className="h-[120mm] border border-dashed border-neutral-400 flex items-center justify-center text-neutral-500 text-sm">
                        Sem print da peça — anexe um print na O.S. para esta área.
                    </div>
                )}
            </div>
            {obs && (
                <div className="px-6 pb-4">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">Observações</div>
                    <p className="text-sm whitespace-pre-wrap border border-neutral-300 p-3 min-h-[24mm]">{obs}</p>
                </div>
            )}
            <div className="px-6 pb-6 text-[9px] text-neutral-500">
                QR abre o kanban desta O.S. no EDM Lean. {os.id ? urlKanbanOs(os.id) : ''}
            </div>
        </div>
    );
}

export default function FolhaProcessoModal({ osList, onClose }) {
    const [qrs, setQrs] = useState({});
    const lista = (osList || []).filter(Boolean);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const next = {};
            for (const os of lista) {
                if (!os?.id) continue;
                try {
                    next[os.id] = await QRCode.toDataURL(urlKanbanOs(os.id), { margin: 1, width: 240, color: { dark: '#000000', light: '#ffffff' } });
                } catch {
                    next[os.id] = '';
                }
            }
            if (!cancelled) setQrs(next);
        })();
        return () => { cancelled = true; };
    }, [lista.map((o) => o.id).join(',')]);

    if (!lista.length) return null;

    return (
        <div className="fixed inset-0 z-[220] bg-black/70 overflow-y-auto print:bg-white print:static print:overflow-visible" id="folha-print-root">
            <div className="sticky top-0 z-10 flex justify-between items-center gap-3 px-4 py-3 bg-[#181B22] border-b border-[#262A33] print:hidden">
                <p className="text-sm text-[#E7E9ED]">Folha de processo — use Imprimir e escolha “Salvar como PDF” se quiser arquivo.</p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
                    <Button type="button" variant="primary" onClick={() => window.print()}>
                        <span className="inline-flex items-center gap-1.5"><Printer className="w-4 h-4" /> Imprimir / PDF</span>
                    </Button>
                </div>
            </div>
            <div className="py-6 print:py-0">
                {lista.map((os) => (
                    <FolhaA4 key={os.id} os={os} qr={qrs[os.id]} />
                ))}
            </div>
        </div>
    );
}
