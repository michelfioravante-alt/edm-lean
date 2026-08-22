import { supabase } from './supabase';
import { isLocalMode } from '../local/mode';

export const OS_PRINTS_BUCKET = 'os-prints';

export function printObjectPath(empresaId, osId) {
    return `${empresaId}/${osId}.jpg`;
}

export function resolveFolhaImagemSrc(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }
    if (isLocalMode() || !supabase) return value;
    const { data } = supabase.storage.from(OS_PRINTS_BUCKET).getPublicUrl(value);
    return data?.publicUrl || value;
}

export async function uploadOsPrint(empresaId, osId, blob) {
    if (!blob || isLocalMode() || !supabase) return null;
    const path = printObjectPath(empresaId, osId);
    const { error } = await supabase.storage.from(OS_PRINTS_BUCKET).upload(path, blob, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600',
    });
    if (error) throw error;
    const { data } = supabase.storage.from(OS_PRINTS_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
}

export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
        reader.readAsDataURL(blob);
    });
}
