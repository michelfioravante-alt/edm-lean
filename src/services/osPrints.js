import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const OS_PRINTS_BUCKET = 'os-prints';

const VALIDADE_URL_S = 3600;
const URL_PUBLICA_ANTIGA = `/object/public/${OS_PRINTS_BUCKET}/`;
const urlsAssinadas = new Map();

export function printObjectPath(empresaId, osId) {
    return `${empresaId}/${osId}.jpg`;
}

function caminhoNoBucket(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('data:') || value.startsWith('blob:')) return null;
    const i = value.indexOf(URL_PUBLICA_ANTIGA);
    if (i >= 0) return decodeURIComponent(value.slice(i + URL_PUBLICA_ANTIGA.length).split('?')[0]);
    if (/^https?:\/\//.test(value)) return null;
    return value.split('?')[0];
}

function assinar(path) {
    const atual = urlsAssinadas.get(path);
    if (atual && atual.expira > Date.now()) return atual.promessa;
    const promessa = supabase.storage
        .from(OS_PRINTS_BUCKET)
        .createSignedUrl(path, VALIDADE_URL_S)
        .then(({ data, error }) => {
            if (error) throw error;
            return data.signedUrl;
        });
    urlsAssinadas.set(path, { promessa, expira: Date.now() + (VALIDADE_URL_S - 300) * 1000 });
    promessa.catch(() => urlsAssinadas.delete(path));
    return promessa;
}

/** O bucket é privado: devolve uma URL assinada (temporária) para o print da O.S. */
export function useFolhaImagemSrc(value) {
    const path = caminhoNoBucket(value);
    const [src, setSrc] = useState(path ? null : value || null);

    useEffect(() => {
        if (!path) {
            setSrc(value || null);
            return undefined;
        }
        let ativo = true;
        assinar(path)
            .then((url) => ativo && setSrc(url))
            .catch(() => ativo && setSrc(null));
        return () => { ativo = false; };
    }, [path, value]);

    return src;
}

/** Grava o print e devolve o caminho no bucket (o `?v=` força nova URL assinada após trocar a imagem). */
export async function uploadOsPrint(empresaId, osId, blob) {
    if (!blob) return null;
    const path = printObjectPath(empresaId, osId);
    const { error } = await supabase.storage.from(OS_PRINTS_BUCKET).upload(path, blob, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600',
    });
    if (error) throw error;
    urlsAssinadas.delete(path);
    return `${path}?v=${Date.now()}`;
}
