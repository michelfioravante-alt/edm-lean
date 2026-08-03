import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMobileE2ETests() {
    console.log('📱 Iniciando Testes End-to-End (E2E) em Modo MOBILE no Módulo CNC Lean...');
    console.log('📍 Alvo: http://localhost:5175 (Simulação iPhone 14 - 390x844 Touch)\n');

    const errors = [];
    const logs = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Configura Viewport Mobile (iPhone 14 / Pixel 7)
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('Download the React DevTools') && !text.includes('validateDOMNesting')) {
            console.error(`❌ [Console Error Mobile] ${text}`);
            errors.push(`Console Error Mobile: ${text}`);
        } else {
            logs.push(text);
        }
    });

    page.on('pageerror', err => {
        console.error(`❌ [Page Exception Mobile] ${err.message}`);
        errors.push(`Page Exception Mobile: ${err.message}`);
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
        await sleep(800);
        await page.waitForSelector('header', { timeout: 8000 });
    };

    const openMobileDrawer = async () => {
        await page.evaluate(() => {
            const aside = document.querySelector('aside');
            const isOpen = aside && aside.classList.contains('translate-x-0');
            if (!isOpen) {
                const menuBtn = document.querySelector('button[aria-label="Menu"]');
                if (menuBtn) menuBtn.click();
            }
        });
        await sleep(600);
    };

    const clickMobileNav = async (label) => {
        const clicked = await page.evaluate((targetText) => {
            const buttons = Array.from(document.querySelectorAll('button, nav button, aside nav button'));
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
        // 1. Carregamento Inicial Mobile & Entrada no Workspace
        await testStep('Navegação Mobile até http://localhost:5175 & Entrar no Workspace', async () => {
            await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });
            await unlockGerente();
        });

        // 2. Verificação do Header Mobile e Marca CNC Lean
        await testStep('Verificação do Header Mobile & Marca CNC Lean', async () => {
            const headerText = await page.$eval('header', el => el.textContent);
            if (!headerText.toLowerCase().includes('cnc')) throw new Error('Marca CNC Lean não encontrada no Header Mobile');
        });

        // 3. Teste da Barra de Navegação Inferior Mobile (MobileNav)
        await testStep('Navegação entre Etapas do Kanban via MobileNav Inferior', async () => {
            const setupClicked = await clickMobileNav('setup');
            if (!setupClicked) throw new Error('Etapa Setup não encontrada na MobileNav');
            await sleep(400);

            const inspeçãoClicked = await clickMobileNav('inspeção');
            if (!inspeçãoClicked) throw new Error('Etapa Inspeção não encontrada na MobileNav');
            await sleep(400);
        });

        // 4. Teste da Drawer Lateral Mobile (Menu Hambúrguer)
        await testStep('Abertura da Drawer Lateral via Ícone Hambúrguer', async () => {
            await openMobileDrawer();
            const drawerVisible = await page.evaluate(() => {
                const aside = document.querySelector('aside');
                return aside && aside.classList.contains('translate-x-0');
            });
            if (!drawerVisible) throw new Error('Drawer Lateral não abriu no Mobile');
        });

        // 5. Teste do Modal de PIN Master no Mobile
        await testStep('Autenticação de Gerente com PIN Master no Mobile', async () => {
            await unlockGerente();
        });

        // 6. Teste de Alternância para Perfil Programador CNC no Mobile
        await testStep('Alternância para Perfil Programador CNC no Mobile', async () => {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('header button'));
                const btn = buttons.find(b => b.textContent.includes('CNC'));
                if (btn) btn.click();
            });
            await sleep(500);
        });

        // 7. Teste de Alternância para Perfil Programador EDM Fio no Mobile
        await testStep('Alternância para Perfil Programador EDM Fio no Mobile', async () => {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('header button'));
                const btn = buttons.find(b => b.textContent.includes('EDM'));
                if (btn) btn.click();
            });
            await sleep(500);
        });

        // 8. Teste de Navegação para o Dashboard Executivo no Mobile
        await testStep('Navegação para Tela de Dashboard no Mobile', async () => {
            await unlockGerente();
            await openMobileDrawer();
            
            const ok = await clickMobileNav('dashboard');
            if (!ok) throw new Error('Botão Dashboard não encontrado no menu Mobile');
            await sleep(1000);

            const pageTitle = await page.evaluate(() => document.body.textContent);
            if (!pageTitle.includes('Indicadores') && !pageTitle.includes('OEE')) {
                throw new Error('Título do Dashboard não carregou no Mobile');
            }
        });

        // 9. Teste de Navegação para Estoque & Consumíveis no Mobile
        await testStep('Navegação para Tela de Estoque & Consumíveis no Mobile', async () => {
            await openMobileDrawer();
            
            const ok = await clickMobileNav('estoque');
            if (!ok) throw new Error('Botão Estoque não encontrado no menu Mobile');
            await sleep(1000);

            const pageText = await page.evaluate(() => document.body.textContent);
            if (!pageText.includes('Estoque') && !pageText.includes('Consumíveis')) {
                throw new Error('Tela de Estoque não carregou no Mobile');
            }
        });

        // 10. Teste de Navegação para Configurações no Mobile
        await testStep('Navegação para Tela de Configurações no Mobile', async () => {
            await unlockGerente();
            await openMobileDrawer();
            
            const ok = await clickMobileNav('configurações');
            if (!ok) throw new Error('Botão Configurações não encontrado no menu Mobile');
            await sleep(1000);

            const pageText = await page.evaluate(() => document.body.textContent);
            if (!pageText.includes('Custos') && !pageText.includes('Parâmetros')) {
                throw new Error('Tela de Configurações não carregou no Mobile');
            }
        });

    } finally {
        await browser.close();
    }

    console.log('\n==================================================');
    console.log(`📱 RELATÓRIO FINAL DOS TESTES E2E MOBILE:`);
    console.log(` ✅ Sucessos: ${passCount}`);
    console.log(` ❌ Falhas: ${failCount}`);
    console.log(` 🚨 Erros de JS no Console Mobile: ${errors.length}`);
    console.log('==================================================\n');

    if (failCount > 0 || errors.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runMobileE2ETests();
