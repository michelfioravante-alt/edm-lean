import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function calculadoraEstatica() {
    return {
        name: 'calculadora-estatica',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                const url = req.url?.split('?')[0];
                if (url === '/calculadora' || url === '/calculadora/') {
                    req.url = '/calculadora.html';
                }
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [react(), calculadoraEstatica()],
    server: {
        host: true,
        port: 5174,
        strictPort: true,
    },
});
