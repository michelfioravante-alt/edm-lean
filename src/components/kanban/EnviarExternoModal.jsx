import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { TIPOS_SERVICO_EXTERNO, rotuloTipoServicoExterno } from '../../constants/osWorkflow';
import { useAppStore } from '../../store/useAppStore';

export default function EnviarExternoModal({ isOpen, onClose, onConfirm, fornecedores }) {
    const [fornecedorId, setFornecedorId] = useState('');
    const [tipo, setTipo] = useState('tratamento');
    const notificarApp = useAppStore((s) => s.notificarApp);

    if (!isOpen) return null;

    const handle = () => {
        const f = (fornecedores || []).find((x) => x.id === fornecedorId);
        if (!f) {
            notificarApp('Selecione o fornecedor.', 'aviso');
            return;
        }
        onConfirm({
            fornecedor_id: f.id,
            fornecedor_nome: f.nome,
            tipo_servico_externo: tipo,
            enviado_em: new Date().toISOString(),
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enviar ao terceiro" maxWidth="max-w-md">
            <div className="space-y-4">
                <p className="text-xs text-[#7B808F]">Registra quem recebeu a peça e a data de saída — para comparar prazo de tratamento térmico e achar gargalo.</p>
                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#565B68] mb-1.5">Fornecedor</label>
                    <select
                        value={fornecedorId}
                        onChange={(e) => setFornecedorId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#262A33] bg-[#111318] rounded-[8px] text-sm text-[#E7E9ED]"
                    >
                        <option value="">— Selecionar —</option>
                        {(fornecedores || []).map((f) => (
                            <option key={f.id} value={f.id}>{f.nome}{f.tipo ? ` (${rotuloTipoServicoExterno(f.tipo)})` : ''}</option>
                        ))}
                    </select>
                    {(!fornecedores || !fornecedores.length) && (
                        <p className="text-[10px] text-[#C99A4A] mt-1">Cadastre fornecedores em Configurações → Máquinas & CAM.</p>
                    )}
                </div>
                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#565B68] mb-1.5">Serviço</label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="w-full px-3 py-2 border border-[#262A33] bg-[#111318] rounded-[8px] text-sm text-[#E7E9ED]"
                    >
                        {TIPOS_SERVICO_EXTERNO.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="flex-[2]" onClick={handle}>Confirmar envio</Button>
                </div>
            </div>
        </Modal>
    );
}
