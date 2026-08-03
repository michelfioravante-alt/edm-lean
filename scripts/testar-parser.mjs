/**
 * Roda o parser de folhas CAM sobre todos os arquivos de docs/exemplos.
 *
 *   node scripts/testar-parser.mjs
 *
 * Cada folha nova que aparecer na oficina deve ser colocada em docs/exemplos
 * para virar caso de regressão.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

// --dump <arquivo>: imprime as linhas cruas de cada tabela, para desenhar regras novas.
const alvoDump = process.argv.includes('--dump') ? process.argv[process.argv.indexOf('--dump') + 1] : null;

const { window } = new JSDOM('');
globalThis.DOMParser = window.DOMParser;
globalThis.File = window.File;

const { parseNxShopDoc } = await import('../src/utils/nxShopDocParser.js');

const exemplos = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'exemplos');
const arquivos = (await readdir(exemplos)).filter((n) => ['.html', '.htm', '.xlsx', '.xls'].includes(extname(n).toLowerCase()));

if (arquivos.length === 0) {
    console.log('Nenhuma folha em docs/exemplos.');
    process.exit(0);
}

for (const nome of arquivos) {
    const conteudo = await readFile(join(exemplos, nome));
    const file = new window.File([conteudo], nome);

    console.log(`\n${'='.repeat(70)}\n${nome}\n${'='.repeat(70)}`);

    if (alvoDump && nome === alvoDump) {
        const doc = new window.DOMParser().parseFromString(conteudo.toString('utf8'), 'text/html');
        [...doc.querySelectorAll('table')].forEach((tabela, i) => {
            const linhas = [...tabela.querySelectorAll('tr')]
                .map((tr) => [...tr.querySelectorAll('th,td')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()))
                .filter((l) => l.some(Boolean));
            if (linhas.length === 0) return;
            console.log(`\n-- tabela ${i} (${linhas.length} linhas)`);
            linhas.slice(0, 12).forEach((l) => console.log('   ', JSON.stringify(l)));
        });
        continue;
    }

    try {
        const r = await parseNxShopDoc(file);
        console.log(`Peça      : ${r.codigoPeca || '(não identificada)'}`);
        console.log(`Programa  : ${r.numeroPrograma || '(não identificado)'}`);
        console.log(`Usinagem  : ${r.tempoUsinagemMinutos} min`);
        console.log(`Setup     : ${r.tempoSetupMinutos} min`);
        console.log(`Confiança : ${r.confianca}`);
        console.log(`Ferramentas (${r.ferramentas.length}):`);
        r.ferramentas.forEach((f) => console.log(`  ${f.codigoT.padEnd(14)} ${f.nome}`));
        console.log(`Operações (${r.operacoes.length}):`);
        r.operacoes.forEach((o) => console.log(`  ${String(o.tempoMinutos).padStart(5)} min  ${o.nome}`));
        if (r.avisos.length) {
            console.log('Avisos:');
            r.avisos.forEach((a) => console.log(`  - ${a}`));
        }
    } catch (err) {
        console.log(`ERRO: ${err.message}`);
    }
}
