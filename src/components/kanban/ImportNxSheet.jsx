import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Sliders, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { parseNxShopDoc, minutosParaHorasMin, applyCustomMapping } from '../../utils/nxShopDocParser';

const COLUMN_ROLE_OPTIONS = [
    { value: 'ignore', label: '❌ Ignorar coluna' },
    { value: 'tool_code', label: '🛠️ Código Ferramenta (T01...)' },
    { value: 'tool_name', label: '📝 Nome / Descrição Ferramenta' },
    { value: 'op_time', label: '⏱️ Tempo Operação (min)' },
    { value: 'setup_time', label: '🔧 Tempo de Setup (min)' },
    { value: 'op_name', label: '⚙️ Nome da Operação' },
    { value: 'part_code', label: '📦 Código Peça / Programa' },
];

// Aparecem na pré-visualização quando a folha os traz. Cliente e programador só
// chegam ao formulário se baterem com um cadastro; máquina é escolhida no Set-up.
const DADOS_DA_FOLHA = [
    { chave: 'cliente', rotulo: 'Cliente' },
    { chave: 'programador', rotulo: 'Programador' },
    { chave: 'maquina', rotulo: 'Máquina' },
];

export default function ImportNxSheet({ onImport, disabled }) {
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [showMapper, setShowMapper] = useState(false);
    const [colMapping, setColMapping] = useState({});

    const processFile = async (file) => {
        if (!file) return;
        setLoading(true);
        setError('');
        setPreview(null);
        setColMapping({});
        setShowMapper(false);

        try {
            const data = await parseNxShopDoc(file);
            setPreview(data);

            // Tenta adivinhar mapeamento inicial didático baseado no número de colunas
            if (data.rawRows && data.rawRows.length > 0) {
                const numCols = Math.max(...data.rawRows.map(r => r.length));
                const initialMap = {};
                for (let i = 0; i < numCols; i++) {
                    initialMap[i] = 'ignore';
                }
                setColMapping(initialMap);
            }

            onImport?.(data);
        } catch (err) {
            setError(err.message || 'Erro ao ler folha.');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        processFile(e.dataTransfer.files?.[0]);
    };

    const handleColRoleChange = (colIdx, role) => {
        const newMapping = { ...colMapping, [colIdx]: role };
        setColMapping(newMapping);

        if (preview?.rawRows) {
            const remapped = applyCustomMapping(preview.rawRows, newMapping);
            const updatedPreview = {
                ...preview,
                ...remapped,
            };
            setPreview(updatedPreview);
            onImport?.(updatedPreview);
        }
    };

    const tempo = preview ? minutosParaHorasMin(preview.tempoUsinagemMinutos) : null;
    const tempoSetup = preview ? minutosParaHorasMin(preview.tempoSetupMinutos) : null;
    const avisos = preview?.avisos || [];
    const sampleRows = preview?.rawRows ? preview.rawRows.slice(0, 5) : [];
    const maxCols = sampleRows.length > 0 ? Math.max(...sampleRows.map(r => r.length)) : 0;

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed border-slate-800' : 'border-slate-700 hover:border-kanban-amber/60 hover:bg-slate-900/50'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".html,.htm,.xlsx,.xls"
                    className="hidden"
                    disabled={disabled}
                    onChange={(e) => processFile(e.target.files?.[0])}
                />
                <Upload className="w-8 h-8 mx-auto text-kanban-amber mb-2" />
                <p className="text-sm font-bold text-slate-200">Importar folha de processo CAM (Shop Doc)</p>
                <p className="text-xs text-slate-500 mt-1">Arraste .html ou .xlsx (Siemens NX, Mastercam, PowerMill, WorkNC...)</p>
                {loading && <p className="text-xs text-kanban-amber mt-2">Lendo arquivo...</p>}
            </div>

            {error && (
                <div className="flex gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            {preview && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 text-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        {avisos.length > 0 ? (
                            <div className="flex items-center gap-2 text-kanban-amber font-bold text-xs uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4" />
                                Folha Lida com Ressalvas
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-kanban-green font-bold text-xs uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4" />
                                Folha de Processo Lida com Sucesso
                            </div>
                        )}
                        {maxCols > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowMapper(!showMapper)}
                                className="text-xs font-bold text-kanban-amber hover:underline flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                {showMapper ? 'Ocultar Mapeador' : 'Mapear Colunas Didático'}
                                {showMapper ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Arquivo</span>
                            <span className="text-slate-200 font-medium truncate block">{preview.arquivo}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Tempo Total Usinagem</span>
                            <span className="text-kanban-amber font-bold">{tempo?.horas || 0}h {String(tempo?.minutos || 0).padStart(2, '0')}m</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Tempo de Setup</span>
                            <span className="text-kanban-amber font-bold">{tempoSetup?.horas || 0}h {String(tempoSetup?.minutos || 0).padStart(2, '0')}m</span>
                        </div>
                        {preview.operacoes?.length > 0 && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Operações</span>
                                <span className="text-slate-200 font-bold">{preview.operacoes.length}</span>
                            </div>
                        )}
                        {DADOS_DA_FOLHA.map(({ chave, rotulo }) =>
                            preview[chave] ? (
                                <div key={chave} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">{rotulo}</span>
                                    <span className="text-slate-200 font-medium truncate block">{preview[chave]}</span>
                                </div>
                            ) : null
                        )}
                    </div>

                    {avisos.length > 0 && (
                        <ul className="text-[11px] text-kanban-amber/90 bg-kanban-amber/5 border border-kanban-amber/30 rounded-lg p-2.5 space-y-1">
                            {avisos.map((aviso, i) => (
                                <li key={i} className="flex gap-1.5">
                                    <span className="text-kanban-amber">•</span>
                                    {aviso}
                                </li>
                            ))}
                        </ul>
                    )}

                    {preview.ferramentas?.length > 0 && (
                        <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 font-bold block mb-1">Ferramentas Detectadas ({preview.ferramentas.length}):</span>
                            <div className="flex flex-wrap gap-1.5">
                                {preview.ferramentas.map((f, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[11px] border border-slate-800">
                                        <strong className="text-kanban-amber">{f.codigoT}:</strong> {f.nome}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MAPEADOR DIDÁTICO INTERATIVO DE COLUNAS */}
                    {showMapper && maxCols > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in duration-300">
                            <div className="bg-slate-950 p-3 rounded-xl border border-kanban-amber/40 space-y-2">
                                <h4 className="font-extrabold text-kanban-amber text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="w-4 h-4" /> Mapeador Didático de Colunas CAM
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Abaixo estão as primeiras 5 linhas da sua folha. Escolha no seletor do topo de cada coluna a informação correspondente:
                                </p>

                                <div className="overflow-x-auto max-w-full rounded-lg border border-slate-800 mt-2">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-900">
                                                {Array.from({ length: maxCols }).map((_, colIdx) => (
                                                    <th key={colIdx} className="p-2 border-b border-r border-slate-800 min-w-[150px]">
                                                        <span className="text-[10px] text-slate-500 font-mono block mb-1">Coluna {colIdx + 1}</span>
                                                        <select
                                                            value={colMapping[colIdx] || 'ignore'}
                                                            onChange={(e) => handleColRoleChange(colIdx, e.target.value)}
                                                            className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded p-1 text-[11px] font-bold focus:border-kanban-amber"
                                                        >
                                                            {COLUMN_ROLE_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sampleRows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                                                    {Array.from({ length: maxCols }).map((_, colIdx) => (
                                                        <td key={colIdx} className="p-2 border-r border-slate-900 text-[11px] text-slate-300 font-mono truncate max-w-[180px]">
                                                            {row[colIdx] || <span className="text-slate-600 italic">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
