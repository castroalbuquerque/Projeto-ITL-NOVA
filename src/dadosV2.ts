// Central de Transparência v2 — conteúdo pré-computado dos agentes.
//
// Tudo o que a IA escreveu está aqui, como constante tipada, gerado uma única vez
// fora da apresentação (script `scripts/gerar_conteudo_v2.ts`, registro em
// `conteudo-v2/`). Nenhum componente de interface guarda texto de IA, e nenhuma
// linha deste protótipo chama LLM em runtime: o streaming é efeito visual sobre
// texto estático. Referências a "seção N" apontam para SPEC-central-transparencia-v2.md.

import type { Canal } from './dados';
import { CUSTO_POR_MENSAGEM, type Resumo } from './motor';
import type { PacoteDeFatos, Redacao } from './validador';

/** Aviso padrão da v1 para número ilustrativo (seção 9, ponto 3). */
export const AVISO_DE_EXEMPLO = 'os valores são de exemplo';

// ---------------------------------------------------------------------------
// F1 · Agente Redator (seção 3)
// ---------------------------------------------------------------------------

/**
 * Ocorrência de referência, a mesma da v1: quebra do veículo às 06h12 na linha
 * Capital–Interior, saída das 06h30 remarcada para 07h15 (viagem v-01).
 */
export const OCORRENCIA_DE_REFERENCIA = {
  viagemId: 'v-01',
  ocorrencia: 'quebra' as const,
  deteccao: '06h12',
  partida: '06h30',
  revisada: '07h15',
  linha: 'Capital–Interior',
  plataforma: '07',
};

/** Pacotes de fatos travados, um por passageiro alcançado pela ocorrência. */
export const PACOTES_DE_FATOS: Record<string, PacoteDeFatos> = {
  'p-01': {
    id: 'fatos-mariana-quebra',
    passageiroId: 'p-01',
    nome: 'Mariana',
    segmento: 'Grupo 1 · Clientes Âncora',
    tipoDeFalha: 'falha mecânica no veículo',
    horarioPartida: '06h30',
    horarioRevisado: '07h15',
    compensacoes: [
      { rotulo: 'crédito de 30%', termos: ['30%'] },
      { rotulo: 'assento garantido', termos: ['assento'] },
    ],
    canal: 'whatsapp',
    ofertaComercialLiberada: true,
    maximoDeFrases: 4,
  },
  'p-02': {
    id: 'fatos-carlos-quebra',
    passageiroId: 'p-02',
    nome: 'Carlos',
    segmento: 'Grupo 5 · Feridos pela Operação',
    tipoDeFalha: 'falha mecânica no veículo',
    horarioPartida: '06h30',
    horarioRevisado: '07h15',
    compensacoes: [
      { rotulo: 'reembolso integral', termos: ['reembolso'] },
      { rotulo: 'remarcação sem taxa', termos: ['sem taxa'] },
      { rotulo: 'ligação de atendente', termos: ['atendente'] },
    ],
    canal: 'whatsapp',
    ofertaComercialLiberada: false, // freio de permissão: nenhuma oferta de retorno
    maximoDeFrases: 4,
  },
  'p-05': {
    id: 'fatos-diego-quebra',
    passageiroId: 'p-05',
    nome: 'Diego',
    segmento: 'fora dos conjuntos',
    tipoDeFalha: 'falha mecânica no veículo',
    horarioPartida: '06h30',
    horarioRevisado: '07h15',
    compensacoes: [{ rotulo: 'crédito de 30%', termos: ['30%'] }],
    canal: 'whatsapp',
    ofertaComercialLiberada: false,
    maximoDeFrases: 4,
  },
};

export interface RedacaoPreComputada extends Redacao {
  id: string;
  passageiroId: string;
  fatosId: string;
  /** Registro de proveniência: nenhuma destas saiu durante a apresentação. */
  geradaEm: string;
}

/**
 * As três redações da seção 3.3. A do Diego é a cena obrigatória de falha do
 * guardrail: o agente escreveu 07h05 onde o fato travado diz 07h15, e o validador
 * a descarta antes de qualquer exibição como mensagem enviada.
 */
export const REDACOES_IA: Record<string, RedacaoPreComputada> = {
  'p-01': {
    id: 'redacao-mariana-quebra',
    passageiroId: 'p-01',
    fatosId: 'fatos-mariana-quebra',
    geradaEm: '2026-08-19',
    canal: 'whatsapp',
    texto:
      'Bom dia, Mariana. O ônibus das 06h30 teve uma falha mecânica e já estamos trocando o veículo — a nova saída é às 07h15, mesma plataforma. Seu assento de sempre está garantido, e como você viaja com a gente toda quinzena, um crédito de 30% já foi para a sua conta, sem precisar pedir. Se preferir remarcar, é sem taxa e sem fila: basta responder esta mensagem.',
  },
  'p-02': {
    id: 'redacao-carlos-quebra',
    passageiroId: 'p-02',
    fatosId: 'fatos-carlos-quebra',
    geradaEm: '2026-08-19',
    canal: 'whatsapp',
    texto:
      'Carlos, aqui é a [Empresa]. O veículo das 06h30 teve falha mecânica e a nova saída é às 07h15. Sabemos que na sua última viagem conosco você ficou sem nenhuma informação numa situação como esta — e isso não vai se repetir. Seu reembolso integral já está disponível, a remarcação é sem taxa, e um atendente com o seu histórico em mãos vai ligar em até cinco minutos. Você não vai precisar explicar nada duas vezes.',
  },
  'p-05': {
    id: 'redacao-diego-quebra',
    passageiroId: 'p-05',
    fatosId: 'fatos-diego-quebra',
    geradaEm: '2026-08-19',
    canal: 'whatsapp',
    texto:
      'Diego, a saída das 06h30 foi remarcada para 07h05 por falha mecânica no veículo. Seu assento continua garantido na mesma plataforma e um crédito de 30% já entrou na sua conta.',
  },
};

/** Rótulo do bloco novo do canhoto (seção 3.2). */
export const ROTULO_DE_REDACAO_IA = 'Redação: gerada por IA';
export const ROTULO_DE_TEMPLATE = 'Redação: template da v1';

export function motivoDeDescarte(motivo: string): string {
  return `Redação por IA descartada — ${motivo}. Enviado template padrão.`;
}

// ---------------------------------------------------------------------------
// F2 · Copiloto da Ouvidoria Ativa (seção 4)
// ---------------------------------------------------------------------------

export interface LinhaDeDossie {
  campo: string;
  valor: string;
  /** Marca o valor como ilustrativo, no padrão da v1. */
  exemplo?: boolean;
  destaque?: boolean;
}

/** Dossiê montado pelo copiloto (seção 4.2). Dados fictícios da base sintética. */
export const DOSSIE_CARLOS: LinhaDeDossie[] = [
  { campo: 'Cliente', valor: 'Carlos, 45 anos · perfil corporativo' },
  { campo: 'Segmento', valor: 'Grupo 5 — Feridos pela Operação' },
  { campo: 'Histórico', valor: '3 viagens · 2ª terminou em quebra sem aviso · sem contato há 6 meses' },
  { campo: 'Gasto histórico', valor: 'R$ 612', exemplo: true },
  { campo: 'Reclamação anterior', valor: 'Aberta e não respondida — motivo da prioridade na fila', destaque: true },
  { campo: 'Consentimento', valor: 'Aviso operacional: sim · Oferta comercial: não', destaque: true },
  {
    campo: 'Teto disponível (regra)',
    valor: 'Reembolso pendente + remarcação sem taxa + 1 cortesia até R$ 90',
    exemplo: true,
  },
];

/** Proposta de ação do copiloto. Aguarda clique humano — nada sai antes disso. */
export const PROPOSTA_CARLOS = {
  id: 'proposta-carlos-ouvidoria',
  canal: 'whatsapp' as Canal,
  geradaEm: '2026-08-19',
  texto:
    'Carlos, meu nome é [Atendente] e estou com o seu caso em mãos. Em [mês], o seu ônibus quebrou na estrada e você ficou sem qualquer aviso nosso — e depois ainda registrou uma reclamação que nunca foi respondida. Isso foi uma falha nossa, duas vezes. Quero corrigir o que der: seu reembolso daquela viagem está liberado agora, e se você decidir nos dar outra chance, a próxima remarcação é sem taxa e sem burocracia, direto comigo neste número. Sem robô, sem fila.',
};

export const NOTA_DE_GUARDRAIL_CARLOS =
  'Oferta comercial (desconto de retorno) omitida — cliente não autorizou comunicação de oferta. Se o cliente responder, o consentimento pode ser coletado na conversa.';

/** O caso já está na fila antes de qualquer pesquisa: a reclamação nunca respondida. */
export const CASO_ABERTO_CARLOS = {
  passageiroId: 'p-02',
  titulo: 'Reclamação de 6 meses sem resposta',
  ocorrencia: 'Quebra de veículo · Capital–Interior',
  prazoHoras: 24,
  prioridade: 'elevada' as const,
  motivoDaPrioridade: 'reclamação antiga sem solução fura a fila',
};

export const ACOES_DO_COPILOTO = [
  { id: 'aprovar', rotulo: 'Aprovar' },
  { id: 'editar', rotulo: 'Editar' },
  { id: 'recusar', rotulo: 'Recusar e escrever do zero' },
] as const;

export type AcaoDoCopiloto = (typeof ACOES_DO_COPILOTO)[number]['id'];

// ---------------------------------------------------------------------------
// F3 · Orquestrador de ocorrência (seção 5)
// ---------------------------------------------------------------------------

export interface IndicadorDoLote {
  rotulo: string;
  valor: string;
  detalhe?: string;
  exemplo?: boolean;
}

export interface PainelDoLote {
  id: string;
  titulo: string;
  passageiros: number;
  comContato: number;
  semContato: number;
  barradasPorFreio: number;
  redacoesDescartadas: number;
  custoCompensacao: number;
  teto: number;
  tempoAteOPrimeiroAviso: string;
  indicadores: IndicadorDoLote[];
}

/** Painel do lote da seção 5.2. Os números alimentam a tela de números da v1. */
export const LOTE: PainelDoLote = {
  id: 'lote-quebra-0612',
  titulo: 'Quebra 06h12 · Capital–Interior · veículo com 42 passageiros',
  passageiros: 42,
  comContato: 31,
  semContato: 11,
  barradasPorFreio: 1,
  redacoesDescartadas: 1,
  custoCompensacao: 1840,
  teto: 2000,
  tempoAteOPrimeiroAviso: '2 min',
  indicadores: [
    { rotulo: 'Passageiros afetados', valor: '42', exemplo: true },
    { rotulo: 'Com contato cadastrado → mensagem pronta', valor: '31' },
    { rotulo: 'Sem contato → equipe do terminal + painel acionados', valor: '11' },
    {
      rotulo: 'Mensagens barradas por freio',
      valor: '1',
      detalhe: 'oferta ao Carlos — sem consentimento',
    },
    {
      rotulo: 'Redações descartadas pelo validador → template',
      valor: '1',
      detalhe: 'horário divergente',
    },
    { rotulo: 'Custo de compensação do lote', valor: 'R$ 1.840', exemplo: true },
    { rotulo: 'Teto da ocorrência', valor: 'R$ 2.000' },
    { rotulo: 'Tempo estimado da falha ao 1º aviso', valor: '2 min' },
  ],
};

/** Sequência que na v1 era implícita e o orquestrador apresenta como um lote. */
export const PASSOS_DO_ORQUESTRADOR = [
  'afetados identificados',
  'regras aplicadas',
  'freios checados',
  'mensagens redigidas (F1)',
  'custo total calculado contra o teto',
  'resumo para aprovação',
];

/**
 * Variação opcional com estouro de teto (seção 5.3). Os candidatos entram no
 * motor da v1 e é ele — não o agente — quem decide a ordem de corte: começa por
 * quem viaja menos, e reembolso e reacomodação nunca entram na conta.
 */
export const LOTE_COM_ESTOURO = {
  id: 'lote-quebra-0612-estouro',
  titulo: 'Variação: a mesma quebra com o benefício extra estourando o teto',
  teto: 2000,
  foraDoTeto: ['reembolso integral', 'lugar em outro horário', 'remarcação sem taxa'],
  candidatos: [
    { nome: 'Mariana', frequencia: 52, valor: 47 },
    { nome: 'Carlos', frequencia: 3, valor: 47 },
    { nome: 'Diego', frequencia: 0, valor: 47 },
    ...Array.from({ length: 9 }, (_, i) => ({
      nome: `passageiro semanal ${i + 1}`,
      frequencia: 80,
      valor: 62,
    })),
    ...Array.from({ length: 16 }, (_, i) => ({
      nome: `passageiro mensal ${i + 1}`,
      frequencia: 22,
      valor: 62,
    })),
    ...Array.from({ length: 14 }, (_, i) => ({
      nome: `passageiro raro ${i + 1}`,
      frequencia: 4,
      valor: 62,
    })),
  ],
};

/**
 * Os mesmos números do painel, no formato da tela "Os números da ocorrência" da
 * v1: aprovar o lote preenche a tela que o comitê já conhece (seção 5.2).
 *
 * O aviso de Carlos sai normalmente — quem foi barrada pelo freio de permissão
 * é a oferta comercial de retorno, não a mensagem sobre a viagem que ele pagou.
 */
export function resumoDoLote(lote: PainelDoLote = LOTE): { resumo: Resumo; pessoas: number } {
  const custoDisparos = Math.round(lote.comContato * CUSTO_POR_MENSAGEM * 100) / 100;
  return {
    pessoas: lote.passageiros,
    resumo: {
      pessoasAlcancaveis: lote.comContato,
      pessoasAvisadas: lote.comContato,
      semAvisoPorFaltaDeContato: lote.semContato,
      bloqueiosPorMotivo: { B0: lote.semContato, B1: lote.barradasPorFreio },
      custoDisparos,
      custoCompensacoes: lote.custoCompensacao,
      custoTotal: Math.round((custoDisparos + lote.custoCompensacao) * 100) / 100,
      beneficioExtraPedido: lote.custoCompensacao,
      beneficioExtraPago: lote.custoCompensacao,
      cortesPorTeto: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Seção 7 · O que é real e o que é simulado
// ---------------------------------------------------------------------------

export const QUADRO_DE_HONESTIDADE = [
  {
    titulo: 'O que é real',
    texto:
      'A lógica de decisão (regras, freios, ordem de corte) funciona de verdade e pode ser conferida passo a passo. Os textos marcados como "redação por IA" foram efetivamente gerados por inteligência artificial a partir dessas regras — gerados antes da apresentação e embutidos aqui, não ao vivo.',
  },
  {
    titulo: 'O que é simulado',
    texto:
      'Passageiros, viagens, ocorrências e valores são inventados; nenhuma mensagem é enviada de fato; o efeito de "digitação" é reproduzido, não gerado na hora.',
  },
  {
    titulo: 'O que ainda é aposta',
    texto:
      'Que personalização por IA reduza evasão é hipótese, como todo o programa. Validar exige piloto em linha real com grupo de controle — e, para a IA, medir taxa de erro de redação, custo por disparo e latência em escala, o que seis mensagens de demonstração não provam.',
  },
];

// ---------------------------------------------------------------------------
// Streaming simulado (seção 6.2): 40 a 60 ms por palavra, sem sorteio, para a
// demonstração sair igual todas as vezes.
// ---------------------------------------------------------------------------

export const MS_POR_PALAVRA_MIN = 40;
export const MS_POR_PALAVRA_MAX = 60;
export const ROTULO_DE_GERACAO = 'gerando…';

export function msDaPalavra(indice: number): number {
  const faixa = MS_POR_PALAVRA_MAX - MS_POR_PALAVRA_MIN;
  return MS_POR_PALAVRA_MIN + ((indice * 7) % (faixa + 1));
}

// ---------------------------------------------------------------------------
// Prompts da pré-computação (seção 3.4). Ficam versionados e não aparecem na demo.
// O texto integral, o pacote de fatos e as saídas bruta e aprovada estão em
// `conteudo-v2/`; o script `scripts/gerar_conteudo_v2.ts` regenera tudo.
// ---------------------------------------------------------------------------

export const PROMPT_REDATOR = `Papel: você é o redator de mensagens operacionais de uma empresa de ônibus interestadual.
Escreve o texto ao redor de fatos que não pode alterar.

Pacote de fatos travados (JSON): {{FATOS}}

Regras de redação:
1. Nenhum fato pode ser inventado, arredondado ou omitido: nome, horário de partida, horário
   revisado e compensação aparecem exatamente como estão no pacote.
2. Máximo de 4 frases. Sem emoji. Sem "pedimos desculpas pelo transtorno".
3. Sempre termine com o próximo passo concreto que a pessoa pode dar.
4. Tom por segmento:
   - Grupo 1 (Âncora): reconhecer a frequência de quem viaja sempre, sem bajulação.
   - Grupo 5 (Feridos pela Operação): reconhecer explicitamente a falha anterior e nenhuma
     oferta comercial, em nenhuma forma.
   - Fora dos conjuntos: informativo e direto, sem histórico a invocar.
5. Se o campo ofertaComercialLiberada for false, é proibido citar desconto, promoção, oferta,
   cupom, cashback, brinde ou condição especial.

Saída: apenas o texto da mensagem, sem aspas e sem comentários.`;

export const PROMPT_COPILOTO = `Papel: você é o copiloto de um atendente da ouvidoria ativa. Não fala com o cliente:
escreve uma proposta que o atendente vai aprovar, editar ou recusar.

Dossiê do caso (JSON): {{DOSSIE}}
Teto de compensação disponível, decidido pela regra (JSON): {{TETO}}

Regras:
1. O benefício vem da regra. Você escolhe apenas a forma de apresentá-lo, nunca o valor.
2. Reconheça a falha concreta que consta do dossiê, com o que aconteceu, sem generalizar.
3. Se o consentimento de oferta comercial for "não", nenhuma oferta pode aparecer no texto —
   registre a omissão como nota de guardrail em vez de escrevê-la na mensagem.
4. Máximo de 6 frases, em primeira pessoa do atendente.
5. Nada de promessa que a regra não sustente: prazos, isenções e valores só os do dossiê.

Saída: apenas o texto da proposta, sem aspas e sem comentários.`;
