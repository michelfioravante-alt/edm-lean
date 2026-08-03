# Fluxo CNC — Rascunho para validação

Este documento é um **ponto de partida**. Ajuste com quem opera o centro de usinagem antes de congelar regras no sistema.

## Diferenças vs. Eletroerosão a Fio

| Aspecto | EDM (fio) | CNC (centro de usinagem) |
|---------|-----------|---------------------------|
| Ferramenta principal | Fio + guides | Múltiplas ferramentas por OP |
| Setup | Threading, programação CAM | Montagem de ferramenta, offset, zero peça |
| Paradas frequentes | Quebra de fio, flushing | Quebra de insert, troca de ferramenta, ajuste offset |
| Consumíveis | Fio, filtros, resina | Inserts, coolant, filtros |
| Tempo de ciclo | Por perímetro/rendimento | Por tempo de programa (minutos de spindle) |

## Fluxo proposto no Kanban

```
[A fazer] → [Setup] → [Em Usinagem] → [Inspeção] → [Concluído]
```

### A fazer
- OP recebida do PCP ou programação
- Desenho / programa CAM disponível
- Material separado

### Setup
- Seleção e montagem de ferramentas no magazine ou setup manual
- Prova de offset / zero peça
- Simulação ou dry run (se aplicável)

### Em Usinagem
- Ciclo automático
- Registro de pausas: troca de ferramenta, quebra, falta material, etc.
- Vida útil de ferramenta decrementada (futuro: integração automática)

### Inspeção
- Medição dimensional
- Aprovação ou refugo
- Devolução para usinagem se necessário

## Motivos de pausa (CNC)

Já configurados em `src/constants/cncProcess.js`:

- Troca de Ferramenta
- **Quebra de Ferramenta**
- Troca de Insert
- Ajuste de Offset / Zero
- (demais iguais ao Andon industrial)

## Importação de folha de processo CAM

Na **Nova OS**, arraste folha `.html` ou `.xlsx` do NX Shop Documentation
(ou Mastercam, PowerMill, WorkNC).

Antes de tudo, o parser varre a folha inteira atrás de pares rótulo/valor:
**nome da peça**, **número do programa**, **tempo total**, **tempo de setup**,
**cliente**, **programador** e **máquina**.
Quando existe um "Tempo total" declarado, ele vence a soma das operações.

Cliente e programador só preenchem o formulário quando o nome bate com um
cadastro existente; caso contrário aparecem apenas na pré-visualização, porque um
nome fora do cadastro deixaria o campo em branco sem explicação. Máquina é sempre
só informativa — ela é escolhida na etapa de Set-up.

Esses pares são lidos nos dois arranjos que aparecem na prática: vertical
(`Nome da peça | CAV-8842`) e horizontal — uma linha de rótulos sobre uma linha
de valores, como no bloco `Arquivo | O.S. | Cliente | Máquina` das folhas UG/CAM.
Para a peça, rótulos precisos (`Nome da peça`) vencem os genéricos; `Desenho` e
`Arquivo` só entram como último recurso, e valores que parecem caminho de arquivo
são descartados.

Depois, para operações e ferramentas, há dois modos de leitura:

**1. Por colunas** — quando existe uma linha de cabeçalho reconhecível
(`Operation | Tool | Cycle Time`). Lê cada coluna pelo nome.
Colunas de RPM, avanço, diâmetro e profundidade são ignoradas de propósito, e um
número sem unidade só vira tempo se a coluna tiver sido identificada como tempo.
Sem isso, "S4500" era lido como 4500 minutos.

Duas particularidades desse modo, ambas vindas de folhas reais:

- Quando a folha tem uma coluna só para o **número** da ferramenta (`T Num.`) e
  outra para a **ferramenta** em si (`FERR.`), a numérica vira o código (`1` → `T01`)
  e a outra vira o nome. Sem essa distinção o código saía como `TOPO-10`.
- Células de tempo com dois números (`14.26 / 842.76`, cabeçalho
  `TEMPO min / TOTAL`) usam o **primeiro** valor como tempo da operação.

**2. Por blocos** — quando não há cabeçalho, caso das folhas em que cada operação
ocupa várias linhas com `rowspan`/`colspan` (SolidCAM/Altova). Usa durações em
`h:mm:ss` como âncora, pega o nome da operação nas células vizinhas e reconhece
ferramentas numeradas do tipo `1-Cabecote-Spindle`.

Se nenhum dos dois modos achar nada, o parser **não adivinha**: avisa e oferece o
mapeador manual de colunas.

### Folhas de exemplo

| Arquivo | Formato |
|---------|---------|
| `docs/exemplos/shop-doc-exemplo.html` | grade com cabeçalho (modo 1) |
| `docs/exemplos/folha-real.html` | SolidCAM/Altova, blocos (modo 2) |
| `docs/exemplos/folha-real-2.html` | UG/CAM NX 7.5, grade com cabeçalho (modo 1) |

Toda folha nova da oficina deve ser jogada em `docs/exemplos` — ela vira caso de
regressão automaticamente. Para rodar o parser sobre todas elas, sem navegador:

```bash
npm run testar-parser
```

E, para desenhar regras para uma folha que ainda não é lida direito, dá para ver
as linhas cruas como o parser as enxerga:

```bash
node scripts/testar-parser.mjs --dump folha-real-2.html
```

Com esse retrato em mãos, ajuste `META_CAMPOS` ou `PADROES_CABECALHO` em
`src/utils/nxShopDocParser.js` e rode o teste de novo para conferir que as outras
folhas continuam iguais.

---

1. **Visitar o chão de fábrica** — anotar colunas reais do quadro/planilha atual
2. **Listar ferramentas típicas** — tipos, vida útil média, como registram quebra hoje
3. **Validar se Inspeção é coluna separada** ou fica dentro de Concluído
4. **Definir se uma OP = uma peça ou um lote** (split já existe no sistema)
5. Iterar labels em `cncProcess.js` e testar no localhost

## Perguntas para responder com a operação

- Quantas ferramentas diferentes uma OP usa em média?
- Quem registra quebra — operador ou setup?
- Existe magazine automático (tool changer) ou troca manual?
- O tempo de usinagem vem do CAM (minutos) ou é estimado manualmente?
- Inspeção é 100% das peças ou amostragem?

Respostas a essas perguntas definem os próximos campos e telas a adicionar.
