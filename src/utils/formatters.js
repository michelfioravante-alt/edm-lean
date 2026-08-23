export function formatarMoedaBRL(valor) {
    if (valor == null || valor === '' || isNaN(Number(valor))) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor));
}

/** Digitação de reais: 1250000 → "12.500,00". */
export function formatarMoedaDigitacao(raw) {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function parseMoedaBr(str) {
    if (str == null || str === '') return null;
    if (typeof str === 'number' && Number.isFinite(str)) return str;
    const n = parseFloat(String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
}

export function formatarDataBR(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(data);
}

export function formatarPercentual(valor, decimais = 1) {
    if (isNaN(valor)) return '0%';
    return `${Number(valor).toFixed(decimais)}%`;
}

export function formatarHoras(horasDecimais) {
    if (isNaN(horasDecimais)) return '0h 0m';
    const horas = Math.floor(horasDecimais);
    const minutos = Math.round((horasDecimais - horas) * 60);
    return `${horas}h ${minutos}m`;
}
