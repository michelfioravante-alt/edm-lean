/** FAQ estruturada do Assistente de Fábrica (opções pré-definidas, sem IA). */

export const FAQ_TOPICOS = [
    {
        id: 'criar_os',
        titulo: 'Criar e liberar peça',
        resposta:
            'Peça avulsa: Nova O.S. no Início, Carteira ou Kanban. Molde (várias peças da mesma ferramenta): só na aba Moldes — as peças entram na fila e o gestor libera para o setor. Só então aparecem no Kanban.',
        irPara: 'moldes',
        cta: 'Abrir Moldes',
    },
    {
        id: 'fluxo_kanban',
        titulo: 'Setup, usinagem, inspeção',
        resposta:
            'CNC/EDM: A programar → Setup (máquina + operador) → Em corte → Inspeção → Concluído. CNC não conclui direto da usinagem. Serviço externo usa colunas próprias (A enviar → No terceiro → Retorno) e pode concluir sem inspeção interna.',
        irPara: 'kanban',
        cta: 'Abrir Kanban',
    },
    {
        id: 'terminal',
        titulo: 'Terminal no tablet (/join)',
        resposta:
            'No tablet do chão, abra o link /join da ferramentaria e digite o PIN (master ou convite). Não usa e-mail. Em Configurações → Equipe você copia o link e gerencia PINs.',
        irPara: 'configuracoes',
        cta: 'Equipe & acessos',
    },
    {
        id: 'pin',
        titulo: 'PIN master e convites',
        resposta:
            'O PIN master (padrão 1234) abre a visão de gestor e o terminal. Troque no primeiro uso. Convites criam PIN individual por papel/setor — entregue em mãos à equipe.',
        irPara: 'configuracoes',
        cta: 'Abrir configurações',
    },
    {
        id: 'molde',
        titulo: 'O que é um molde?',
        resposta:
            'Molde = conjunto de peças atreladas à mesma ferramenta/job (código do molde). Cada peça vira um cartão; ficam na fila até liberar. Em Registros, Repetir abre uma Nova O.S. de peça avulsa pré-preenchida — não recria o molde inteiro.',
        irPara: 'moldes',
        cta: 'Ver Moldes',
    },
    {
        id: 'estoque',
        titulo: 'Estoque e ferramental',
        resposta:
            'Estoque: saldo por setor. CNC/Torno (fresas, insertos) podem ser serializados em Ferramental com vida útil. EDM fio (fio, resina, filtro) fica só no Estoque e nas trocas do kanban — não vai para Ferramental. Quantidade só muda por movimentação.',
        irPara: 'estoque',
        cta: 'Abrir estoque',
    },
    {
        id: 'rede',
        titulo: 'Rede, TI e lista branca',
        resposta:
            'É SaaS no navegador (Chrome/Edge). Libere saída HTTPS (443) para edmlean.com.br e *.supabase.co (REST + WebSocket). Relógio do Windows certo; não limpe cookies a cada turno.',
        irPara: null,
        cta: null,
    },
    {
        id: 'setup',
        titulo: 'Continuar configuração da fábrica',
        resposta:
            'Máquinas, operadores, PIN e link do terminal — o mínimo para o chão funcionar. Turnos e custos podem ficar para depois.',
        acao: 'abrir_setup',
        cta: 'Abrir configuração guiada',
    },
];

export const SETORES_SETUP = [
    { id: 'CNC', rotulo: 'Centro de usinagem CNC' },
    { id: 'EDM_FIO', rotulo: 'Eletroerosão a fio (EDM)' },
];
