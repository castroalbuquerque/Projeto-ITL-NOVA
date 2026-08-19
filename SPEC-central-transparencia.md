# Central de Transparência — spec de construção

Protótipo funcional de comunicação proativa no transporte rodoviário.
Exercício acadêmico. Executar no Claude Code, etapa por etapa.

**Versão 2** — alinhada ao relatório visual de sete páginas (`fluxo-central-transparencia.pdf`).
Sempre que o spec e o PDF divergirem, o PDF está certo: ele foi revisado depois.

---

## 1. O que precisa ser provado

Não é "dá para mandar mensagem no WhatsApp". É: **dado um evento, existe uma lógica explícita
que decide quem é avisado, quando, com que tom e com qual compensação — e essa lógica muda
conforme o perfil do passageiro e conforme existir ou não caminho até ele.**

O ativo do protótipo é o **motor de regras**, visível na tela. A conversa é só a evidência.

## 2. Orçamento de tempo

| Etapa | Tempo |
|---|---|
| 1 · Setup e dados | 40 min |
| 2 · Motor e mensagens | 110 min |
| 3 · Interface | 65 min |
| 4 · Pós-viagem e fechamento | 35 min |
| **Total** | **≈ 4 horas** |

Ficou acima das 3h45 que estimei antes: o cálculo original cobria só o motor, e os
passageiros novos e a etiqueta de grupo pesam nas etapas 1 e 3.
**Se o tempo apertar, corte a Etapa 4 inteira** — as etapas 2 e 3 sozinhas sustentam o argumento,
e o projeto volta para ≈ 3h25.

Segue fora de escopo: envio real, localização por satélite, sistema de clientes real, persistência.

## 3. Stack

Vite + React + TypeScript + Tailwind. Sem backend, sem `.env`, sem chamada à API em runtime,
sem biblioteca de componentes, sem router. Estado em `useState` no `App.tsx`.

```
src/
  dados.ts        11 passageiros, viagens, banco de mensagens
  motor.ts        regras + decidir() + custos
  motor.test.ts   6 asserções
  App.tsx
  ui/             Conversa.tsx, Inspetor.tsx, Metricas.tsx
```

---

## 4. Etapas

Parar ao fim de cada uma. Não adiantar trabalho da seguinte.

### Etapa 1 — Setup e dados (40 min)

1. Scaffold Vite + React + TS + Tailwind. Confirmar que sobe.
2. `dados.ts` com **11 passageiros escritos à mão** (tabela da seção 5). Todos precisam de
   `grupo`, `temContato` e `consentimentoMarketing` preenchidos — são os três campos que o
   motor consulta antes de qualquer coisa.
3. Viagens: uma com Mariana e Carlos, uma cancelada com Ana Paula, Beatriz e Diego,
   uma noturna com Diego e Rosa.

**Pronto quando:** os 11 aparecem no console com grupo, alcance e autorização preenchidos.

### Etapa 2 — Motor e mensagens (110 min) — o núcleo

**2a. Motor** (`motor.ts`):

1. Regras da seção 6 declaradas como **array de objetos**, nunca `if` dentro de componente.
2. Função pura `decidir(gatilho, viagem, passageiros) => Decisao[]`.
   `gatilho` tem três formas: `ocorrencia`, `marco` e `padrao` (seção 6.3). Isso é novo:
   a versão anterior só reagia a falha operacional.
3. Bloqueios B0 a B3 (seção 6.2), **nesta ordem**. O B0 é novo e vem antes de todos.
4. Custo: R$ 0,08 por mensagem enviada + valor da compensação. Canais de terminal custam zero
   em disparo e não contam para o limite de três avisos.
5. `motor.test.ts` com 6 asserções:
   - quebra gera compensação;
   - passageiro sem contato não recebe mensagem nenhuma, mas gera ação de terminal;
   - passageiro com contato e sem autorização recebe aviso de viagem e não recebe convite;
   - teto degrada só o benefício extra, começando pelo menos frequente;
   - reembolso e lugar em outro horário nunca são cortados;
   - marco não dispara para quem já é do grupo 1.

**2b. Banco de mensagens** (dentro de `dados.ts`):

O Claude Code **escreve as mensagens ele mesmo, agora**, e as salva como constantes.
Não escrever código de chamada à API.

Matriz a cobrir: 4 ocorrências (atraso longo, quebra, mudança de plataforma, cancelamento)
× 4 tons (informativo, atencioso, reparador, reconquista), mais pré-embarque, win-back,
convite de marco e as variantes de terminal (texto curto para painel e para o guichê).
Chave do tipo `'quebra:reparador'`. Placeholders `{nome}`, `{linha}`, `{horarioRevisado}`, `{compensacao}`.

Redação: até 320 caracteres, sem emoji, sem "pedimos desculpas pelo transtorno", sempre com o
próximo passo concreto e o horário revisado. Reconquista reconhece a ocorrência anterior.
Convite de marco reconhece o ritmo sem pedir nada em troca e oferece subida de classe, não desconto.

**Pronto quando:** os testes passam e `decidir()` roda sem nenhuma UI.

### Etapa 3 — Interface (65 min)

Três colunas: seletor à esquerda, conversa ao centro, inspetor à direita.

1. Seletor: viagem + botões de gatilho — 4 ocorrências, win-back, marco e padrão de não embarque.
2. Conversa: bolhas com horário. Quando não há contato, mostrar a **ação de terminal** com
   aparência distinta de mensagem (é aviso de painel ou instrução ao guichê, não conversa).
3. **Inspetor** — o elemento que sustenta o trabalho. Para o passageiro selecionado: regras
   aplicadas, regras bloqueadas e o motivo de cada bloqueio.
4. **Etiqueta de grupo** em cada passageiro, no formato `Grupo 5 · Feridos pela Operação`,
   com marcador apagado para quem está fora dos conjuntos.
5. Métricas: cobertura (%), custo da ocorrência (R$), mensagens bloqueadas por motivo, e
   **quantos ficaram sem aviso por falta de contato** — este é o número da página 3 do PDF.

**Pronto quando:** a quebra mostra Mariana e Carlos com mensagens diferentes; o atraso noturno
mostra Rosa sem mensagem e com ação de terminal; o win-back mostra Sandra bloqueada duas vezes.

### Etapa 4 — Pós-viagem e fechamento (35 min)

1. Botão "concluir viagem" gera pesquisa de nota 0–10 na conversa.
2. Nota ≤ 6 cria um cartão de caso: passageiro, nota, ocorrência, prazo.
   Quem tem ocorrência aberta entra com prioridade elevada — o caso do Carlos.
3. `README.md`: como rodar, o que é simulado, e a seção 8 copiada íntegra.
4. Roteiro de demo de 4 minutos: quebra (Mariana × Carlos) → cancelamento com teto (Ana Paula,
   Beatriz, Diego) → atraso noturno (Diego × Rosa) → marco (Letícia × Marcos) →
   win-back bloqueado (Sandra) → padrão de não embarque (Wilson, nada sai) → caso na ouvidoria.
5. Botão "resetar".

---

## 5. Os 11 passageiros

| id | Nome | Grupo | Perfil | Contato | Autorizou | Aparece em |
|---|---|---|---|---|---|---|
| p-01 | Mariana | 1 · Clientes Âncora | 28a, quinzenal, família. Cauda alta do grupo | sim | sim | PDF p.1 |
| p-02 | Carlos | 5 · Feridos pela Operação | 45a, **só três viagens**, a segunda com quebra sem aviso, sumiu há 6 meses | sim | não | PDF p.1 |
| p-03 | Ana Paula | 1 · Clientes Âncora | 38a, semanal a trabalho, cliente há 6 anos | sim | sim | PDF p.2 |
| p-04 | Beatriz | nenhum | 31a, uma ou duas viagens por ano | sim | não | PDF p.2 |
| p-05 | Diego | nenhum | 24a, primeira viagem, comprou na véspera | sim | não | PDF p.2, p.3 |
| p-06 | Rosa | 1 · Clientes Âncora | 66a, viaja com frequência, compra no guichê | **não** | não | PDF p.3 |
| p-07 | Jorge | 3 · Adormecidos Alcançáveis | 33a, sumiu há 7 meses, compra pelo aplicativo | sim | sim | PDF p.4 |
| p-08 | Sandra | 4 · Adormecidos Invisíveis | 58a, sumiu há 8 meses, comprava no guichê | **não** | não | PDF p.4 |
| p-09 | Letícia | 2 · Regulares em Ascensão | 35a, mensal, gasto subindo, compra pelo aplicativo | sim | sim | PDF p.5 |
| p-10 | Marcos | 2 · Regulares em Ascensão | 49a, mesmo ritmo de Letícia, compra sempre no guichê | **não** | sim | PDF p.5 |
| p-11 | Wilson | 6 · Pagantes Ausentes | 41a, 6 passagens no semestre, embarcou em 2 | sim | não | PDF p.6 |

Rótulos dos grupos: 1 Clientes Âncora, 2 Regulares em Ascensão, 3 Adormecidos Alcançáveis,
4 Adormecidos Invisíveis, 5 Feridos pela Operação, 6 Pagantes Ausentes.

**Marcos existe por um motivo:** ele tem autorização e não tem contato, o único caso que separa
os dois eixos de forma inequívoca. Sem ele, alguém vai concluir que autorização e alcance são a
mesma coisa — e são a mesma coisa em todos os outros dez.

## 6. Regras

### 6.1 Regras de ação

| # | Gatilho | Condição | Canal | Prazo | Tom | Compensação |
|---|---|---|---|---|---|---|
| 1 | ocorrência | Atraso > 60 min | whatsapp | 3 min | reparador | crédito 15% |
| 2 | ocorrência | Quebra de veículo | whatsapp | 2 min | reparador | crédito 30% + remarcação livre |
| 3 | ocorrência | Quebra + grupo 1 ou 2 | + ligação | 10 min | reparador | idem regra 2 |
| 4 | ocorrência | Mudança de plataforma | whatsapp | imediato | informativo | nenhuma |
| 5 | ocorrência | Cancelamento | whatsapp | 1 min | reparador | reembolso integral + lugar em outro horário + crédito 20% |
| 6 | win-back | Sem viagem há > 120 dias | whatsapp | — | reconquista | oferta dirigida |
| 7 | marco | 5 viagens em 4 meses **e** gasto em alta **e** grupo ≠ 1 | whatsapp | 24 h | informativo | subida de classe por 30 dias |
| 8 | padrão | 3 passagens não usadas em 6 meses | **nenhum** | — | — | nenhuma |

A regra 8 é a mais importante do conjunto e não envia nada: registra o padrão e abre caso de
investigação. Existe para provar que o motor sabe decidir não agir.

### 6.2 Bloqueios, nesta ordem

- **B0 · alcance.** Sem `temContato`, nenhuma mensagem sai — nem transacional. Degrada para
  canais de terminal: `bilhete_impresso`, `guiche`, `painel_terminal`. Registrar como bloqueio,
  não como envio.
- **B1 · autorização.** Sem `consentimentoMarketing`, bloqueia só o que é comercial (regras 6 e 7).
  Aviso sobre a viagem comprada sempre passa.
- **B2 · limite.** Máximo 3 mensagens por passageiro por viagem. Ações de terminal não contam.
- **B3 · teto.** Benefício extra limitado a R$ 2.000 por ocorrência. **Reembolso e lugar em outro
  horário ficam fora do teto** — são direito de quem pagou. Ao estourar, cortar o benefício extra
  começando pelo **menos frequente**, e registrar cada corte com nome e valor.

B0 e B1 respondem perguntas diferentes e não devem ser fundidos: alcance decide se qualquer
mensagem sai, autorização decide só se pode haver mensagem comercial.

### 6.3 Os três gatilhos

```ts
type Gatilho =
  | { tipo: 'ocorrencia'; ocorrencia: 'atraso'|'quebra'|'mudanca_plataforma'|'cancelamento';
      minutosImpacto: number; viagemId: string }
  | { tipo: 'marco'; passageiroId: string }
  | { tipo: 'padrao'; passageiroId: string; passagensNaoUsadas: number };
```

## 7. Tipos

```ts
type Grupo = 1|2|3|4|5|6|null;                 // null = fora dos conjuntos
type Canal = 'whatsapp'|'sms'|'push'|'ligacao'
           | 'bilhete_impresso'|'guiche'|'painel_terminal';
type Tom   = 'informativo'|'atencioso'|'reparador'|'reconquista';

interface Passageiro {
  id: string;
  nome: string;
  idade: number;
  grupo: Grupo;
  grupoRotulo: string;                          // 'Clientes Âncora' | 'fora dos conjuntos'
  viagens24m: number;
  diasDesdeUltimaViagem: number;
  compraEm: 'aplicativo'|'site'|'guiche'|'agencia'|'telefone';
  temContato: boolean;                          // NOVO — governa o B0
  consentimentoMarketing: boolean;              // governa o B1
  ocorrenciasAbertas: number;
  passagensNaoUsadas: number;                   // NOVO — gatilho padrão
  gastoEmAlta: boolean;                         // NOVO — gatilho marco
}

interface Decisao {
  passageiroId: string;
  enviar: boolean;
  canal?: Canal;
  tom?: Tom;
  atrasoEnvioMinutos?: number;
  compensacao?: { tipo: string; valorEstimado: number; forapDoTeto: boolean };
  acaoTerminal?: string;                        // NOVO — quando o B0 barra
  regrasAplicadas: string[];
  regrasBloqueadas: { id: string; motivo: string }[];
}
```

## 8. Hipóteses não validadas — copiar no README

1. Comunicação proativa reduzir evasão é **hipótese**, não resultado. Boa parte do churn em
   rodoviário é preço, malha e tempo porta a porta.
2. Validar exigiria piloto A/B numa linha, com grupo de controle sem régua, medindo recompra
   em 90 dias — não pesquisa de satisfação.
3. Régua agressiva gera opt-out. Daí o B2.
4. Compensação pode custar mais que o LTV preservado. Daí o B3.
5. LGPD: mensagem transacional tem base legal na execução do contrato; win-back e convite de
   marco são marketing e exigem consentimento. Daí o B1.
6. **O campo de autorização não existe na base de dados do exercício.** Foi criado por nós.
   O alcance de canal, esse sim, está nos dados.
7. **Os seis grupos são convenção, não descoberta.** Três métodos foram testados e nenhum
   encontrou grupos naturais; o método de densidade classificou o grupo 6 inteiro como caso
   isolado. Servem para priorizar, não para afirmar que existem seis tipos de passageiro.
8. **O perfil do Carlos foi corrigido** em relação ao documento original do projeto: quem está
   no grupo 5 viaja pouco. Quem viaja sempre e sofre falha quase nunca vai embora.
9. Dados sintéticos escritos à mão e mensagens pré-geradas. Nada aqui é evidência empírica.

## 9. Como conduzir

1. Uma etapa por vez, parar no "pronto quando".
2. Motor puro antes de qualquer pixel — se `decidir()` precisar de React para rodar, o desenho
   está errado.
3. Sem abstração antes da terceira repetição.
4. Se estourar o tempo, cortar a Etapa 4 inteira. Não cortar o B0 nem a regra 8: são as duas
   coisas que o relatório visual promete e que nenhum protótipo de comunicação costuma ter.
