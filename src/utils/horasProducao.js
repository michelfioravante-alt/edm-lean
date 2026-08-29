import {
    horasKanban, custoHoraKanban, labelSetor, statusEhConcluido,
} from '../constants/osWorkflow';
import { horasPausaOs } from './dashboardMetrics';
import { formatarHoras, formatarMoedaBRL, formatarDataBR } from './formatters';

export function pickOs(os, ...keys) {
    for (const k of keys) {
        const v = os?.[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

export function codigoPecaOs(os) {
    return pickOs(os, 'codigo_peca', 'codigoPeca') || '—';
}

/** Converte horas decimais em h/min para campos do formulário. */
export function horasParaHm(horasDecimais) {
    const h = Number(horasDecimais);
    if (!Number.isFinite(h) || h <= 0) return { horas: 0, minutos: 0 };
    const totalMin = Math.round(h * 60);
    return { horas: Math.floor(totalMin / 60), minutos: totalMin % 60 };
}

export function extrairRoteiroSetores(os) {
    const roteiro = os?.roteiro;
    if (Array.isArray(roteiro) && roteiro.length) {
        return roteiro
            .map((r) => (typeof r === 'string' ? r : r?.setor || r?.id))
            .filter(Boolean);
    }
    const setor = os?.setor || os?.tipo_processo;
    return setor ? [setor] : ['CNC'];
}

/** Dados para pré-preencher Nova O.S. a partir de execução anterior. */
export function dadosFormularioRepetirPeca(os, config = {}) {
    const resumo = resumoHorasOs(os, config);
    const setor = os?.setor || os?.tipo_processo || 'CNC';
    const setup = horasParaHm(resumo.setupReal || resumo.setupEst);
    const corte = horasParaHm(resumo.corteReal || resumo.corteEst);
    const codigo = codigoPecaOs(os);
    const valor = pickOs(os, 'valor_orcado', 'valorOrcado');
    return {
        origemId: os?.id || null,
        cliente: pickOs(os, 'cliente') || '',
        codigoPeca: codigo !== '—' ? codigo : '',
        codigoMolde: pickOs(os, 'codigo_molde', 'codigoMolde') || '',
        linkDesenho: pickOs(os, 'link_desenho', 'linkDesenho') || '',
        quantidade: os?.quantidade || 1,
        valorOrcado: valor,
        setor,
        etapas: extrairRoteiroSetores(os),
        componente: pickOs(os, 'componente_molde', 'componenteMolde') || '',
        setupHm: setup,
        corteHm: corte,
        resumo,
        observacoes: `Repetição de ${codigo}. Ref.: ${resumo.formatado.concluidoEm} — ${resumo.formatado.totalReal} máquina.`,
    };
}

export function resumoHorasOs(os, config = {}) {
    const h = horasKanban(os);
    const custo = custoHoraKanban(os, config);
    const pausas = horasPausaOs(os);
    const setor = os?.setor || os?.tipo_processo || 'CNC';
    const totalReal = h.setupReal + h.corteReal + h.afericaoReal;
    const totalEst = h.setupEst + h.corteEst;
    const eficiencia = h.eficienciaCam;

    return {
        codigo: codigoPecaOs(os),
        cliente: pickOs(os, 'cliente') || '—',
        molde: pickOs(os, 'codigo_molde', 'codigoMolde') || '—',
        setor,
        setorLabel: labelSetor(setor),
        maquina: pickOs(os, 'maquina_nome', 'maquina') || '—',
        operador: pickOs(os, 'operador_atual', 'operadorAtual') || '—',
        programador: pickOs(os, 'programador_nome', 'programador') || '—',
        programa: pickOs(os, 'numero_programa', 'numeroPrograma') || '—',
        resultado: pickOs(os, 'resultado_afericao', 'resultadoAfericao') || '—',
        concluidoEm: pickOs(os, 'timestamp_entrada_concluido', 'timestampEntrada_concluido', 'created_at', 'createdAt'),
        setupReal: h.setupReal,
        corteReal: h.corteReal,
        afericaoReal: h.afericaoReal,
        setupEst: h.setupEst,
        corteEst: h.corteEst,
        totalReal,
        totalEst,
        pausas,
        eficiencia,
        taxaHora: custo.rate,
        referenciaInterna: custo.custo,
        formatado: {
            setupReal: formatarHoras(h.setupReal),
            corteReal: formatarHoras(h.corteReal),
            afericaoReal: formatarHoras(h.afericaoReal),
            setupEst: formatarHoras(h.setupEst),
            corteEst: formatarHoras(h.corteEst),
            totalReal: formatarHoras(totalReal),
            totalEst: formatarHoras(totalEst),
            pausas: formatarHoras(pausas),
            referenciaInterna: formatarMoedaBRL(custo.custo),
            concluidoEm: formatarDataBR(pickOs(os, 'timestamp_entrada_concluido', 'timestampEntrada_concluido', 'created_at', 'createdAt')),
        },
    };
}

export function agregarHorasMolde(kanbans, config = {}) {
    const linhas = (kanbans || []).map((os) => {
        const r = resumoHorasOs(os, config);
        return {
            os,
            ...r,
            concluida: statusEhConcluido(os),
        };
    });

    const concluidas = linhas.filter((l) => l.concluida);
    const soma = (fn) => linhas.reduce((s, l) => s + fn(l), 0);

    const porSetor = {};
    linhas.forEach((l) => {
        const k = l.setor || 'CNC';
        if (!porSetor[k]) {
            porSetor[k] = { setor: k, label: l.setorLabel, horas: 0, pecas: 0, referencia: 0 };
        }
        porSetor[k].horas += l.totalReal || l.totalEst;
        porSetor[k].referencia += l.referenciaInterna || 0;
        porSetor[k].pecas += 1;
    });

    const totalReal = soma((l) => l.totalReal);
    const totalEst = soma((l) => l.totalEst);
    const referenciaTotal = soma((l) => l.referenciaInterna || 0);

    return {
        linhas: linhas.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '')),
        concluidas: concluidas.length,
        total: linhas.length,
        pctConcluido: linhas.length ? Math.round((concluidas.length / linhas.length) * 100) : 0,
        totalReal,
        totalEst,
        referenciaTotal,
        porSetor: Object.values(porSetor).sort((a, b) => b.horas - a.horas),
        formatado: {
            totalReal: formatarHoras(totalReal),
            totalEst: formatarHoras(totalEst),
            referenciaTotal: formatarMoedaBRL(referenciaTotal),
        },
    };
}

export function exportCsvTexto(linhas, filename) {
    const blob = new Blob(['\uFEFF', linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportRelatorioPecaCsv(os, config) {
    const r = resumoHorasOs(os, config);
    const linhas = [
        'campo;valor',
        `codigo_peca;${r.codigo}`,
        `cliente;${r.cliente}`,
        `molde;${r.molde}`,
        `setor;${r.setorLabel}`,
        `setup_real_h;${r.setupReal.toFixed(2)}`,
        `corte_real_h;${r.corteReal.toFixed(2)}`,
        `afericao_real_h;${r.afericaoReal.toFixed(2)}`,
        `total_real_h;${r.totalReal.toFixed(2)}`,
        `setup_orcado_h;${r.setupEst.toFixed(2)}`,
        `corte_orcado_h;${r.corteEst.toFixed(2)}`,
        `total_orcado_h;${r.totalEst.toFixed(2)}`,
        `pausas_h;${r.pausas.toFixed(2)}`,
        `maquina;${r.maquina}`,
        `operador;${r.operador}`,
        `programa;${r.programa}`,
        `referencia_interna_rs;${(r.referenciaInterna || 0).toFixed(2)}`,
        `concluido_em;${r.formatado.concluidoEm}`,
    ];
    exportCsvTexto(linhas, `horas-${r.codigo.replace(/[^\w-]/g, '_')}.csv`);
}

export function exportRelatorioMoldeCsv(cabecalho, agregado) {
    const linhas = [
        'codigo_peca;setor;setup_h;corte_h;afericao_h;total_h;orcado_h;maquina;operador;status',
        ...agregado.linhas.map((l) => [
            l.codigo,
            l.setorLabel,
            l.setupReal.toFixed(2),
            l.corteReal.toFixed(2),
            l.afericaoReal.toFixed(2),
            l.totalReal.toFixed(2),
            l.totalEst.toFixed(2),
            l.maquina,
            l.operador,
            l.concluida ? 'Concluída' : 'Em aberto',
        ].join(';')),
        '',
        `TOTAL;;;${agregado.totalReal.toFixed(2)};${agregado.totalEst.toFixed(2)};;;`,
        `Referencia interna (R$);${agregado.referenciaTotal.toFixed(2)}`,
    ];
    const nome = (cabecalho?.molde || 'molde').replace(/[^\w-]/g, '_').slice(0, 40);
    exportCsvTexto(linhas, `horas-molde-${nome}.csv`);
}
