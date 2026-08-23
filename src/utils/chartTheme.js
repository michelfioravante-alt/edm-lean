import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
    Title,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
    Title,
);

export const CHART = {
    brand: '#D97D3D',
    brandSoft: 'rgba(217,125,61,0.18)',
    ink: '#E7E9ED',
    muted: '#7B808F',
    faint: '#565B68',
    grid: 'rgba(255,255,255,0.045)',
    surface: '#111318',
    ok: '#4A9D74',
    alert: '#C85558',
    warn: '#C99A4A',
    steel: '#8B90A0',
    series: ['#D97D3D', '#4A9D74', '#7B9EC9', '#C99A4A', '#C85558', '#8A6A4A', '#6B7080'],
};
CHART.ok = CHART.ok;
CHART.alert = CHART.alert;
CHART.brand = CHART.brand;
CHART.steel = CHART.steel;

const FONT = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

ChartJS.defaults.color = CHART.muted;
ChartJS.defaults.font.family = FONT;
ChartJS.defaults.font.size = 11;
ChartJS.defaults.font.weight = '500';
ChartJS.defaults.borderColor = 'transparent';
ChartJS.defaults.animation = {
    duration: 720,
    easing: 'easeOutQuart',
};
ChartJS.defaults.layout.padding = { top: 4, right: 4, bottom: 2, left: 2 };
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;
ChartJS.defaults.plugins.legend.labels.padding = 16;
ChartJS.defaults.plugins.legend.labels.color = CHART.muted;
ChartJS.defaults.plugins.tooltip.enabled = true;
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(18, 21, 28, 0.94)';
ChartJS.defaults.plugins.tooltip.titleColor = CHART.ink;
ChartJS.defaults.plugins.tooltip.bodyColor = '#C5C8D0';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.displayColors = true;
ChartJS.defaults.plugins.tooltip.boxPadding = 4;
ChartJS.defaults.plugins.tooltip.titleFont = { family: FONT, size: 12, weight: '600' };
ChartJS.defaults.plugins.tooltip.bodyFont = { family: MONO, size: 11, weight: '500' };
ChartJS.defaults.elements.bar.borderRadius = 5;
ChartJS.defaults.elements.bar.borderSkipped = false;
ChartJS.defaults.elements.line.tension = 0.38;
ChartJS.defaults.elements.line.borderWidth = 2.25;
ChartJS.defaults.elements.point.radius = 0;
ChartJS.defaults.elements.point.hoverRadius = 5;
ChartJS.defaults.elements.point.hitRadius = 12;
ChartJS.defaults.elements.point.hoverBorderWidth = 2;

export function vGradient(ctx, from, to) {
    const { chart, chartArea } = ctx;
    if (!chartArea) return from;
    const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
}

export function hGradient(ctx, from, to) {
    const { chart, chartArea } = ctx;
    if (!chartArea) return from;
    const g = chart.ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
}

export function areaGradient(ctx, color) {
    const { chart, chartArea } = ctx;
    if (!chartArea) return color;
    const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(17,19,24,0)');
    return g;
}

export function scaleY(tickFn) {
    return {
        beginAtZero: true,
        border: { display: false },
        grid: { color: CHART.grid, drawTicks: false },
        ticks: {
            color: CHART.faint,
            font: { family: MONO, size: 10 },
            padding: 8,
            maxTicksLimit: 5,
            callback: tickFn || ((v) => v),
        },
    };
}

export function scaleX(opts = {}) {
    return {
        border: { display: false },
        grid: { display: false },
        ticks: {
            color: CHART.faint,
            font: { size: 10, weight: '500' },
            maxRotation: opts.maxRotation ?? 0,
            autoSkip: true,
            autoSkipPadding: 8,
            ...opts.ticks,
        },
    };
}

export function barOpts({ horizontal = false, legend = false, tickY, tickX } = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: !!legend, position: 'top', align: 'end' },
        },
        scales: horizontal
            ? { x: scaleY(tickX || tickY), y: scaleX() }
            : { y: scaleY(tickY), x: scaleX() },
    };
}

export function lineOpts({ legend = true, tickY } = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: legend, position: 'top', align: 'end' } },
        scales: { y: scaleY(tickY), x: scaleX({ maxRotation: 32 }) },
    };
}

export function doughnutOpts({ cutout = '74%' } = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        cutout,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 14, color: CHART.muted },
            },
        },
        animation: { animateRotate: true, animateScale: true, duration: 800 },
    };
}
