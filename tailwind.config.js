/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"IBM Plex Sans Condensed"', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'monospace'],
            },
            colors: {
                bg: '#0a0c0f',
                surface: '#111318',
                surface2: '#161a20',
                surface3: '#1c2028',
                edge: '#252932',
                edge2: '#2e3440',
                core: '#d4dbe8',
                muted: '#5a6478',
                dim: '#3a4255',
                kanban: {
                    amber: '#f5a623',
                    'amber-dim': 'rgba(245,166,35,0.12)',
                    steel: '#4a9eff',
                    'steel-dim': 'rgba(74,158,255,0.1)',
                    teal: '#00c9a7',
                    'teal-dim': 'rgba(0,201,167,0.1)',
                    rust: '#e05c3a',
                    'rust-dim': 'rgba(224,92,58,0.12)',
                    violet: '#9b7fe8',
                    'violet-dim': 'rgba(155,127,232,0.1)',
                    green: '#3ddc84',
                    'green-dim': 'rgba(61,220,132,0.1)',
                },
                // Keep status colors for modals and buttons logic
                status: {
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    info: '#3b82f6',
                }
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }
        },
    },
    plugins: [],
}
