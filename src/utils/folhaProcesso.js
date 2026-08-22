export function urlKanbanOs(osId) {
    if (typeof window === 'undefined') return `#os=${osId}`;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return `${window.location.origin}${path}#os=${osId}`;
}

export function parseOsHash(hash) {
    if (!hash) return null;
    const m = String(hash).match(/#os[=/]([a-zA-Z0-9_-]+)/i);
    return m ? m[1] : null;
}

export function compressImageFile(file, maxW = 1400, quality = 0.72) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxW / img.width);
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#111318';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Imagem inválida'));
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
