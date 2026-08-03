export function formatarMoedaBRL(valor) {
    if (isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
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
