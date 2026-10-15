import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Printer, X } from 'lucide-react';

const APP_HOST = 'edmlean.com.br';

function HelpBody({ compact }) {
    const h = compact
        ? 'text-[13px] font-semibold text-[#E7E9ED] mt-4 first:mt-0'
        : 'text-[12px] font-semibold uppercase tracking-wider text-neutral-700 mt-4 first:mt-0';
    const p = compact
        ? 'text-[12px] leading-relaxed text-[#9DA2AE] mt-1'
        : 'text-[11px] leading-relaxed text-neutral-700 mt-1';
    const code = compact
        ? 'font-mono text-[11px] text-[#D97D3D]'
        : 'font-mono text-[10px] text-black';

    return (
        <>
            <p className={h}>O sistema</p>
            <p className={p}>
                O EDM Lean é um SaaS no navegador. Não se instala na CNC nem no PC da ferramentaria.
                Basta Chrome ou Edge e saída HTTPS para o site e o banco.
            </p>

            <p className={h}>PCs com internet bloqueada</p>
            <p className={p}>
                Lista branca só de saída (PC → internet). Porta TCP 443. Sem porta de entrada, sem instalar nada, sem IP fixo da nuvem — a lista é por domínio (os IPs mudam).
            </p>
            <ul className={`${p} list-disc pl-4 space-y-1`}>
                <li>
                    Site: <span className={code}>{APP_HOST}</span>
                    {' '}e <span className={code}>www.{APP_HOST}</span>
                    {' '}(HTTPS). Se ainda usarem preview: <span className={code}>*.vercel.app</span>
                </li>
                <li>
                    Dados, login, fotos e arquivos: <span className={code}>*.supabase.co</span>
                    {' '}— REST <span className={code}>https://</span> e tempo real <span className={code}>wss://</span> no mesmo host. Proxy que corta WebSocket ou faz inspeção SSL (quebra o certificado) deixa o quadro parado ou o login falha.
                </li>
                <li>
                    Tipografia (opcional; sem isso o site abre com fonte do Windows):{' '}
                    <span className={code}>fonts.googleapis.com</span>
                    {' '}e <span className={code}>fonts.gstatic.com</span>
                </li>
            </ul>
            <p className={p}>
                Chrome ou Edge atual. Relógio do Windows certo (NTP). Favoritos e quiosque podem blocar o site; não limpar cookies a cada turno — a sessão fica no navegador. Impressão da folha usa o diálogo nativo do Chrome/Edge (Salvar PDF).
            </p>

            <p className={h}>Terminais no chão</p>
            <p className={p}>
                Quiosque ou favorito só neste site. Operador entra com o PIN da ferramentaria, sem e-mail.
                O escritório usa conta normal; o chão só precisa desses destinos.
            </p>

            <p className={h}>Como testar</p>
            <p className={p}>
                Abrir {APP_HOST}, entrar, mover um cartão. Se a página carrega e o kanban não atualiza sozinho, libere o WebSocket.
            </p>

            <p className={h}>Outras opções (ainda SaaS)</p>
            <p className={p}>
                VPN ou Cloudflare Access só para este site, se a política for “PC sem internet”.
                Proxy interno na LAN é possível, mas a TI passa a manter certificado. App instalado na máquina não faz parte deste produto.
            </p>
        </>
    );
}

export function HelpModal({ open, onClose }) {
    if (!open) return null;

    const printPdf = () => window.print();

    // Portal: cabeçalhos com backdrop-blur prendem elementos `fixed` dentro deles.
    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4 print:static print:p-0">
            <button type="button" className="absolute inset-0 bg-black/70 print:hidden" aria-label="Fechar" onClick={onClose} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl print:hidden">
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] text-[#E7E9ED]">Ajuda e acesso na fábrica</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">Para o gestor e para a TI. Sem página extra.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]" aria-label="Fechar">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">
                    <HelpBody compact />
                </div>
                <div className="flex gap-2 border-t border-[#262A33] px-5 py-3">
                    <button
                        type="button"
                        onClick={printPdf}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32]"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Salvar PDF
                    </button>
                    <button type="button" onClick={onClose} className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED]">
                        Fechar
                    </button>
                </div>
            </div>

            <div id="ajuda-print-root" className="pointer-events-none fixed left-[-9999px] top-0 w-[210mm] print:static print:left-auto print:w-full">
                <div className="folha-a4 bg-white text-black p-8 max-w-[210mm]">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">EDM Lean</p>
                    <h1 className="text-xl font-semibold mt-1">Acesso na ferramentaria (SaaS)</h1>
                    <p className="text-[11px] text-neutral-600 mt-1">Documento para TI e gestão · {APP_HOST}</p>
                    <div className="mt-4 border-t border-neutral-300 pt-2">
                        <HelpBody compact={false} />
                    </div>
                    <p className="mt-6 text-[9px] text-neutral-500">
                        No diálogo de impressão, escolha destino «Salvar como PDF» e papel A4.
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function HelpButton({ className = '', label = 'Ajuda' }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={className}
                aria-label="Ajuda"
            >
                <HelpCircle className="h-3.5 w-3.5" />
                {label ? <span>{label}</span> : null}
            </button>
            <HelpModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
