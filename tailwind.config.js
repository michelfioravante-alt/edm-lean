/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"IBM Plex Sans"', 'sans-serif'],
                space: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'monospace'],
            },
            colors: {
                // Exact MES / Industrial Design Tokens
                'bg-base': '#111318',
                'bg-surface': '#181B22',
                'bg-raised': '#1F232B',
                'border-subtle': '#262A33',
                'border-strong': '#333844',
                'text-primary': '#E7E9ED',
                'text-secondary': '#7B808F',
                'text-tertiary': '#565B68',
                'text-mono': '#9DA2AE',
                brand: {
                    DEFAULT: '#D97D3D',
                    dim: '#8A5A38',
                },
                ok: {
                    DEFAULT: '#4A9D74',
                    bg: 'rgba(74, 157, 116, 0.1)',
                },
                alert: {
                    DEFAULT: '#C85558',
                    bg: 'rgba(200, 85, 88, 0.1)',
                },
                warn: {
                    DEFAULT: '#C99A4A',
                    bg: 'rgba(201, 154, 74, 0.12)',
                },
                // Mapped aliases for components
                bg: '#111318',
                surface: '#181B22',
                surface2: '#1F232B',
                surface3: '#262A33',
                edge: '#262A33',
                edge2: '#333844',
                core: '#E7E9ED',
                muted: '#7B808F',
                dim: '#565B68',
                kanban: {
                    amber: '#D97D3D',
                    'amber-dim': 'rgba(217, 125, 61, 0.12)',
                    steel: '#7B808F',
                    'steel-dim': 'rgba(123, 128, 143, 0.12)',
                    teal: '#4A9D74',
                    'teal-dim': 'rgba(74, 157, 116, 0.1)',
                    rust: '#C85558',
                    'rust-dim': 'rgba(200, 85, 88, 0.1)',
                    violet: '#7B808F',
                    'violet-dim': 'rgba(123, 128, 143, 0.1)',
                    green: '#4A9D74',
                    'green-dim': 'rgba(74, 157, 116, 0.1)',
                    blue: '#7B808F',
                    'blue-dim': 'rgba(123, 128, 143, 0.1)',
                },
                status: {
                    success: '#4A9D74',
                    warning: '#C99A4A',
                    danger: '#C85558',
                    info: '#7B808F',
                }
            },
            boxShadow: {
                'card': '0 4px 12px rgba(0, 0, 0, 0.4)',
                'modal': '0 20px 50px rgba(0, 0, 0, 0.7)',
            }
        },
    },
    plugins: [],
}
