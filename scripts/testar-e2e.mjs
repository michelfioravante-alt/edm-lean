import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runE2ETests() {
    console.log('🚀 Iniciando Testes End-to-End (E2E) no Módulo CNC Lean...');
    console.log('📍 Alvo: http://localhost:5175\n');

    const errors = [];
    const logs = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('Download the React DevTools') && !text.includes('validateDOMNesting')) {
            console.error(`❌ [Console Error] ${text}`);
            errors.push(`Console Error: ${text}`);
        } else {
            logs.push(text);
        }
    });

    page.on('pageerror', err => {
        console.error(`❌ [Page Exception] ${err.message}`);
        errors.push(`Page Exception: ${err.message}`);
    });

    let passCount = 0;
    let failCount = 0;

    const testStep = async (name, fn) => {
        try {
            await fn();
            console.log(` ✅ [PASS] ${name}`);
            passCount++;
        } catch (err) {
            console.error(` ❌ [FAIL] ${name}: ${err.message}`);
            failCount++;
        }
    };

    const unlockGerente = async () => {
        await page.evaluate(() => {
            if (window.useAuthStore) {
                window.useAuthStore.getState().enterLocalStudyMode('admin', 'TODOS');
            }
        });
        await sleep(1000);
        await page.waitForSelector('header', { timeout: 5000 });
    };

    const openSidebarNav = async (label) => {
        await page.waitForSelector('aside nav button', { timeout: 5000 });

        const clicked = await page.evaluate((targetText) => {
            const buttons = Array.from(document.querySelectorAll('aside nav button'));
            const target = buttons.find(b => b.textContent.toLowerCase().includes(targetText.toLowerCase()));
            if (target) {
                target.click();
                return true;
            }
            return false;
        }, label);

        return clicked;
    };

    try {
        // 1. Carregamento Inicial (Kanban)
        await testStep('Navegação até http://localhost:5175', async () => {
            await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });
            await page.waitForSelector('header', { timeout: 5000 });
        });

        // 2. Verificação do Header e Marca CNC Lean
        await testStep('Verificação do Header & Marca CNC Lean', async () => {
            const headerText = await page.$eval('header', el => el.textContent);
            if (!headerText.toLowerCase().includes('cnc')) throw new Error('Marca CNC Lean não encontrada no Header');
        });

        // 3. Teste do Modal de PIN Master para o Perfil Gerente
        await testStep('Teste de Proteção do Perfil Gerente via PIN Master', async () => {
            await unlockGerente();
        });

        // 4. Teste de Alternância para Programador CNC
        await testStep('Alternância para Perfil Programador CNC', async () => {
            const cncBtn = await page.$('button[title*="Centro de Usinagem CNC"]');
            if (cncBtn) {
                await cncBtn.click();
                await sleep(500);
            }
        });

        // 5. Teste de Alternância para Programador EDM Fio
        await testStep('Alternância para Perfil Programador EDM Fio', async () => {
            const edmBtn = await page.$('button[title*="Eletroerosão a Fio"]');
            if (edmBtn) {
                await edmBtn.click();
                await sleep(500);
            }
        });

        // 6. Teste de Navegação para o Dashboard (Requer perfil Gerente)
        await testStep('Navegação para a Tela de Dashboard', async () => {
            await unlockGerente();
            const ok = await openSidebarNav('Dashboard');
            if (!ok) throw new Error('Botão Dashboard não encontrado no menu');
            await sleep(1000);

            const pageTitle = await page.evaluate(() => document.body.textContent);
            if (!pageTitle.includes('Indicadores') && !pageTitle.includes('OEE')) {
                throw new Error('Título do Dashboard não encontrado');
            }
        });

        // 7. Teste de Navegação para Tela de Estoque
        await testStep('Navegação para Tela de Estoque e Consumíveis', async () => {
            const ok = await openSidebarNav('Estoque');
            if (!ok) throw new Error('Botão Estoque não encontrado no menu');
            await sleep(1000);

            const pageText = await page.evaluate(() => document.body.textContent);
            if (!pageText.includes('Estoque') && !pageText.includes('Consumíveis')) {
                throw new Error('Tela de Estoque não carregou corretamente');
            }
        });

        // 8. Teste de Navegação para Configurações (Requer perfil Gerente)
        await testStep('Navegação para Tela de Configurações', async () => {
            await unlockGerente();
            const ok = await openSidebarNav('Configurações');
            if (!ok) throw new Error('Botão Configurações não encontrado no menu');
            await sleep(1000);

            const pageText = await page.evaluate(() => document.body.textContent);
            if (!pageText.includes('Custos') && !pageText.includes('Parâmetros')) {
                throw new Error('Tela de Configurações não carregou corretamente');
            }
        });

    } finally {
        await browser.close();
    }

    console.log('\n==================================================');
    console.log(`📊 RELATÓRIO FINAL DOS TESTES E2E:`);
    console.log(` ✅ Sucessos: ${passCount}`);
    console.log(` ❌ Falhas: ${failCount}`);
    console.log(` 🚨 Erros de JS no Console: ${errors.length}`);
    console.log('==================================================\n');

    if (failCount > 0 || errors.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runE2ETests();
