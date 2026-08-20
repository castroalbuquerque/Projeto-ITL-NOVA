// Motor de regras. Função pura: não importa React, não lê estado global,
// não conhece a interface. Se precisar de um componente para rodar, está errado.

import {
  NOVIDADES_POR_LINHA,
  type Canal,
  type FaixaDeFundo,
  type Passageiro,
  type Tom,
  type Viagem,
} from './dados';

// --- constantes de política -------------------------------------------------

export const CUSTO_POR_MENSAGEM = 0.08; // R$, por mensagem efetivamente enviada
export const TETO_POR_OCORRENCIA = 2000; // R$, só alcança benefício extra
export const LIMITE_DE_MENSAGENS = 3; // por passageiro, por viagem
export const DIAS_PARA_WINBACK = 120;
export const MINUTOS_PARA_ATRASO_LONGO = 60;
export const VIAGENS_PARA_MARCO = 5; // em 4 meses
export const PASSAGENS_PARA_PADRAO = 3; // não usadas em 6 meses
export const TARIFA_DE_REFERENCIA = 240; // R$, usada quando não há viagem no gatilho
export const VALOR_SUBIDA_DE_CLASSE = 90; // R$, diferença estimada executivo → leito

// --- tipos ------------------------------------------------------------------

export type Ocorrencia = 'atraso' | 'quebra' | 'mudanca_plataforma' | 'cancelamento';

export type Gatilho =
  | { tipo: 'ocorrencia'; ocorrencia: Ocorrencia; minutosImpacto: number; viagemId: string }
  | { tipo: 'marco'; passageiroId: string }
  | { tipo: 'padrao'; passageiroId: string; passagensNaoUsadas: number }
  | { tipo: 'winback'; passageiroId: string };

export interface Compensacao {
  tipo: string;
  valorEstimado: number;
  foraDoTeto: boolean; // reembolso e lugar em outro horário são direito, não benefício
}

export interface Bloqueio {
  id: string; // 'B0' | 'B1' | 'B2' | 'B3'
  motivo: string;
}

export interface Decisao {
  passageiroId: string;
  nome: string;
  enviar: boolean;
  canais: Canal[];
  tom?: Tom;
  atrasoEnvioMinutos?: number;
  chaveMensagem?: string;
  compensacoes: Compensacao[];
  acoesTerminal: string[]; // preenchido quando o B0 barra
  acaoInterna?: string; // regra 8: registra padrão e abre investigação
  regrasAplicadas: string[];
  regrasBloqueadas: Bloqueio[];
  custoDisparo: number;
}

export interface Resumo {
  pessoasAlcancaveis: number;
  pessoasAvisadas: number;
  semAvisoPorFaltaDeContato: number;
  bloqueiosPorMotivo: Record<string, number>;
  custoDisparos: number;
  custoCompensacoes: number;
  custoTotal: number;
  beneficioExtraPedido: number;
  beneficioExtraPago: number;
  cortesPorTeto: { nome: string; valor: number }[];
}

/** Mensagens já enviadas a cada passageiro nesta viagem. Governa o B2. */
export type Historico = Record<string, number>;

interface Contexto {
  gatilho: Gatilho;
  viagem: Viagem | null;
  passageiro: Passageiro;
}

interface Regra {
  id: string;
  descricao: string;
  comercial: boolean; // true = alvo do B1
  canais: Canal[];
  atrasoEnvioMinutos: number | null;
  tom: Tom | null;
  aplica: (ctx: Contexto) => boolean;
  compensacoes: (ctx: Contexto) => Compensacao[];
  acaoInterna?: string;
}

// --- auxiliares -------------------------------------------------------------

function tarifa(viagem: Viagem | null): number {
  return viagem ? viagem.valorPassagem : TARIFA_DE_REFERENCIA;
}

function credito(viagem: Viagem | null, percentual: number): number {
  return Math.round(tarifa(viagem) * percentual);
}

function ehOcorrencia(g: Gatilho, tipo: Ocorrencia): boolean {
  return g.tipo === 'ocorrencia' && g.ocorrencia === tipo;
}

// --- as regras, declaradas como dados ---------------------------------------

export const REGRAS: Regra[] = [
  {
    id: 'R1',
    descricao: 'Atraso acima de 60 minutos',
    comercial: false,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 3,
    tom: 'reparador',
    aplica: ({ gatilho: g }) =>
      g.tipo === 'ocorrencia' &&
      g.ocorrencia === 'atraso' &&
      g.minutosImpacto > MINUTOS_PARA_ATRASO_LONGO,
    compensacoes: ({ viagem }) => [
      { tipo: 'crédito de 15%', valorEstimado: credito(viagem, 0.15), foraDoTeto: false },
    ],
  },
  {
    id: 'R2',
    descricao: 'Quebra de veículo',
    comercial: false,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 2,
    tom: 'reparador',
    aplica: ({ gatilho: g }) => ehOcorrencia(g, 'quebra'),
    compensacoes: ({ viagem }) => [
      { tipo: 'crédito de 30%', valorEstimado: credito(viagem, 0.3), foraDoTeto: false },
      { tipo: 'remarcação livre', valorEstimado: 0, foraDoTeto: true },
    ],
  },
  {
    id: 'R3',
    descricao: 'Quebra para grupo 1 ou 2: soma ligação de atendente',
    comercial: false,
    canais: ['ligacao'],
    atrasoEnvioMinutos: 10,
    tom: 'reparador',
    aplica: ({ gatilho: g, passageiro: p }) =>
      ehOcorrencia(g, 'quebra') && (p.grupo === 1 || p.grupo === 2),
    compensacoes: () => [], // idem regra 2, sem somar nada
  },
  {
    id: 'R3b',
    descricao: 'Quebra para grupo 5: atendimento um a um, ligação em 5 minutos',
    comercial: false,
    canais: ['ligacao'],
    atrasoEnvioMinutos: 5,
    tom: 'reparador',
    aplica: ({ gatilho: g, passageiro: p }) => ehOcorrencia(g, 'quebra') && p.grupo === 5,
    compensacoes: () => [], // idem regra 2
  },
  {
    id: 'R4',
    descricao: 'Mudança de plataforma',
    comercial: false,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 0,
    tom: 'informativo',
    aplica: ({ gatilho: g }) => ehOcorrencia(g, 'mudanca_plataforma'),
    compensacoes: () => [],
  },
  {
    id: 'R5',
    descricao: 'Cancelamento',
    comercial: false,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 1,
    tom: 'reparador',
    aplica: ({ gatilho: g }) => ehOcorrencia(g, 'cancelamento'),
    compensacoes: ({ viagem }) => [
      { tipo: 'reembolso integral', valorEstimado: tarifa(viagem), foraDoTeto: true },
      { tipo: 'lugar em outro horário', valorEstimado: 0, foraDoTeto: true },
      { tipo: 'crédito de 20%', valorEstimado: credito(viagem, 0.2), foraDoTeto: false },
    ],
  },
  {
    id: 'R6',
    descricao: 'Win-back: sem viajar há mais de 120 dias',
    comercial: true,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: null,
    tom: 'reconquista',
    aplica: ({ gatilho: g, passageiro: p }) =>
      g.tipo === 'winback' && p.diasDesdeUltimaViagem > DIAS_PARA_WINBACK && p.viagens24m > 0,
    compensacoes: ({ viagem }) => [
      { tipo: 'oferta dirigida de 25%', valorEstimado: credito(viagem, 0.25), foraDoTeto: false },
    ],
  },
  {
    id: 'R6b',
    descricao: 'Win-back de quem sumiu depois de uma falha: resolver o caso aberto',
    comercial: false, // resolver o caso de quem pagou é atendimento, não propaganda
    canais: ['whatsapp'],
    atrasoEnvioMinutos: null,
    tom: 'reparador',
    aplica: ({ gatilho: g, passageiro: p }) =>
      g.tipo === 'winback' &&
      p.diasDesdeUltimaViagem > DIAS_PARA_WINBACK &&
      p.ocorrenciasAbertas > 0,
    compensacoes: () => [], // primeiro resolve; oferta só depois que o caso fechar
  },
  {
    id: 'R7',
    descricao: 'Marco: 5 viagens em 4 meses, gasto em alta, fora do grupo 1',
    comercial: true,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 1440,
    tom: 'informativo',
    aplica: ({ gatilho: g, passageiro: p }) =>
      g.tipo === 'marco' &&
      p.viagens4m >= VIAGENS_PARA_MARCO &&
      p.gastoEmAlta &&
      p.grupo !== 1,
    compensacoes: () => [
      {
        tipo: 'subida de classe por 30 dias',
        valorEstimado: VALOR_SUBIDA_DE_CLASSE,
        foraDoTeto: false,
      },
    ],
  },
  {
    // O convite de retorno também é avaliado na hora da ocorrência, e não só na
    // revisão mensal de sumidos: é quando a empresa mais quer reconquistar quem
    // já foi ferido por ela. Sendo comercial, passa pelos mesmos freios — e é
    // aqui que o Carlos mostra a oferta barrada com o motivo escrito, no mesmo
    // canhoto em que o aviso da viagem dele passa (spec v2, seções 3.3 e 5.2).
    id: 'R9',
    descricao: 'Convite de retorno a quem já sofreu falha nossa (grupo 5), junto ao aviso',
    comercial: true,
    canais: ['whatsapp'],
    atrasoEnvioMinutos: 60,
    tom: 'reconquista',
    aplica: ({ gatilho: g, passageiro: p }) => g.tipo === 'ocorrencia' && p.grupo === 5,
    compensacoes: ({ viagem }) => [
      { tipo: 'desconto de retorno de 20%', valorEstimado: credito(viagem, 0.2), foraDoTeto: false },
    ],
  },
  {
    id: 'R8',
    descricao: 'Padrão: 3 passagens compradas e não usadas em 6 meses',
    comercial: false,
    canais: [], // não envia nada, de propósito
    atrasoEnvioMinutos: null,
    tom: null,
    aplica: ({ gatilho: g }) =>
      g.tipo === 'padrao' && g.passagensNaoUsadas >= PASSAGENS_PARA_PADRAO,
    compensacoes: () => [],
    acaoInterna: 'padrão registrado, caso aberto para investigação',
  },
];

// --- tom e chave de mensagem ------------------------------------------------

/**
 * A regra define o tom padrão; quem tem ocorrência aberta recebe reconquista,
 * que é o tom que reconhece a falha anterior. É o que separa a mensagem da
 * Mariana da mensagem do Carlos na mesma quebra.
 */
function tomFinal(tomDaRegra: Tom, p: Passageiro, g: Gatilho): Tom {
  // Só numa ocorrência o tom sobe para reconquista: é ali que a mensagem precisa
  // reconhecer a falha anterior antes de falar da falha de agora. Fora disso, cada
  // regra já nasce com o tom certo.
  if (g.tipo !== 'ocorrencia') return tomDaRegra;
  return p.ocorrenciasAbertas > 0 && tomDaRegra === 'reparador' ? 'reconquista' : tomDaRegra;
}

function chaveDeMensagem(g: Gatilho, tom: Tom, p: Passageiro): string | undefined {
  if (g.tipo === 'ocorrencia') return `${g.ocorrencia}:${tom}`;
  if (g.tipo === 'marco') return 'marco:informativo';
  if (g.tipo !== 'winback') return undefined;
  if (tom === 'reparador') return 'winback:reparador';
  // Sem saber o que mudou na linha dele, o convite não tem motivo concreto a dar.
  const novidade = p.linhaHabitual ? NOVIDADES_POR_LINHA[p.linhaHabitual] : undefined;
  return novidade ? 'winback:reconquista' : 'winback:reconquista_sem_novidade';
}

function acoesDeTerminal(g: Gatilho): string[] {
  if (g.tipo !== 'ocorrencia') return [];
  return [`painel:${g.ocorrencia}`, `guiche:${g.ocorrencia}`];
}

// --- avaliação --------------------------------------------------------------

function passageirosDoGatilho(
  g: Gatilho,
  viagem: Viagem | null,
  passageiros: Passageiro[],
): Passageiro[] {
  if (g.tipo === 'ocorrencia') {
    const ids = viagem ? viagem.passageiroIds : [];
    return passageiros.filter((p) => ids.includes(p.id));
  }
  return passageiros.filter((p) => p.id === g.passageiroId);
}

function avaliarPassageiro(ctx: Contexto, historico: Historico): Decisao {
  const { gatilho, passageiro: p } = ctx;

  const d: Decisao = {
    passageiroId: p.id,
    nome: p.nome,
    enviar: false,
    canais: [],
    compensacoes: [],
    acoesTerminal: [],
    regrasAplicadas: [],
    regrasBloqueadas: [],
    custoDisparo: 0,
  };

  const candidatas = REGRAS.filter((r) => r.aplica(ctx));
  if (candidatas.length === 0) return d;

  let jaEnviadas = historico[p.id] ?? 0;

  for (const regra of candidatas) {
    // Bloqueios na ordem B0 → B1 → B2. Registramos todos os que se aplicam,
    // não só o primeiro: a Sandra é barrada por alcance e por autorização, e as
    // duas respostas são diferentes — uma pergunta se há caminho, a outra se pode.
    const bloqueios: Bloqueio[] = [];

    // B0 · alcance. Sem contato, nenhuma mensagem sai, nem transacional.
    if (regra.canais.length > 0 && !p.temContato) {
      bloqueios.push({
        id: 'B0',
        motivo: `${regra.id}: sem contato cadastrado, nenhuma mensagem pode sair`,
      });
    }

    // B1 · autorização. Só alcança o que é comercial.
    if (regra.comercial && !p.consentimentoMarketing) {
      bloqueios.push({
        id: 'B1',
        motivo: `${regra.id}: sem autorização para mensagem comercial`,
      });
    }

    // B4 · caso aberto. Convite comercial só depois de resolver o que ficou em
    // aberto. O número é identidade, não posição: ele corre logo depois do B1.
    if (regra.comercial && p.ocorrenciasAbertas > 0) {
      bloqueios.push({
        id: 'B4',
        motivo: `${regra.id}: há caso aberto, convite comercial só depois de resolvê-lo`,
      });
    }

    // B2 · limite. Ações de terminal não contam, e só faz sentido perguntar
    // quantas mensagens já saíram se alguma pudesse sair.
    if (
      bloqueios.length === 0 &&
      regra.canais.length > 0 &&
      jaEnviadas + regra.canais.length > LIMITE_DE_MENSAGENS
    ) {
      bloqueios.push({
        id: 'B2',
        motivo: `${regra.id}: limite de ${LIMITE_DE_MENSAGENS} mensagens por viagem já alcançado`,
      });
    }

    if (bloqueios.length > 0) {
      d.regrasBloqueadas.push(...bloqueios);
      if (bloqueios.some((b) => b.id === 'B0')) {
        for (const acao of acoesDeTerminal(gatilho)) {
          if (!d.acoesTerminal.includes(acao)) d.acoesTerminal.push(acao);
        }
        if (gatilho.tipo === 'marco' || gatilho.tipo === 'winback') {
          // p.4 e p.5: não há terminal onde anunciar isso. Vira lista à parte,
          // e o contato passa a depender de decisão de uma pessoa.
          d.acaoInterna =
            'registrado em lista à parte: contato fora do digital depende de decisão de uma pessoa';
        }
      }
      continue;
    }

    d.regrasAplicadas.push(regra.id);

    if (regra.canais.length > 0) {
      d.enviar = true;
      d.canais.push(...regra.canais);
      jaEnviadas += regra.canais.length;
      d.custoDisparo += regra.canais.length * CUSTO_POR_MENSAGEM;
      if (regra.tom) {
        const tom = tomFinal(regra.tom, p, gatilho);
        d.tom = tom;
        d.chaveMensagem = chaveDeMensagem(gatilho, tom, p);
      }
      if (regra.atrasoEnvioMinutos !== null) {
        d.atrasoEnvioMinutos =
          d.atrasoEnvioMinutos === undefined
            ? regra.atrasoEnvioMinutos
            : Math.min(d.atrasoEnvioMinutos, regra.atrasoEnvioMinutos);
      }
    }

    if (regra.acaoInterna) d.acaoInterna = regra.acaoInterna;
    d.compensacoes.push(...regra.compensacoes(ctx));
  }

  // Sem contato: a compensação só existe se houver como entregá-la ou anunciá-la.
  if (!p.temContato) d.compensacoes = [];

  d.custoDisparo = Math.round(d.custoDisparo * 100) / 100;
  return d;
}

// --- B3 · teto --------------------------------------------------------------

export interface Candidato {
  nome: string;
  frequencia: number; // viagens em 24 meses; é o que ordena o corte
  valor: number;
  chave?: string; // 'passageiroId#índice da compensação', vazio para quem não tem nome
}

export interface ResultadoDoTeto {
  pedido: number;
  pago: number;
  cortes: { nome: string; valor: number }[];
  cortados: Set<string>;
}

/**
 * A ordem de corte do B3, isolada como função pura: corta começando pelo menos
 * frequente e só alcança o que está dentro do teto — reembolso e lugar em outro
 * horário não entram na lista de candidatos e por isso nunca são cortados.
 *
 * Vive aqui, e não no painel do lote da v2, porque quem corta é o sistema de
 * regras, nunca o agente (seção 5.3 da spec v2).
 */
export function ordemDeCorte(
  candidatos: Candidato[],
  teto: number = TETO_POR_OCORRENCIA,
): ResultadoDoTeto {
  const pedido = candidatos.reduce((s, c) => s + c.valor, 0);
  if (pedido <= teto) return { pedido, pago: pedido, cortes: [], cortados: new Set() };

  const ordem = [...candidatos].sort(
    (a, b) => a.frequencia - b.frequencia || a.nome.localeCompare(b.nome),
  );

  let pago = pedido;
  const cortes: { nome: string; valor: number }[] = [];
  const cortados = new Set<string>();

  for (const c of ordem) {
    if (pago <= teto) break;
    pago -= c.valor;
    cortes.push({ nome: c.nome, valor: c.valor });
    if (c.chave) cortados.add(c.chave);
  }

  return { pedido, pago, cortes, cortados };
}

function candidatosDeFundo(faixas: FaixaDeFundo[], valorPorPessoa: number): Candidato[] {
  const lista: Candidato[] = [];
  for (const f of faixas) {
    for (let i = 0; i < f.pessoas; i++) {
      lista.push({
        nome: `passageiro ${f.faixa} ${i + 1}`,
        frequencia: f.viagens24mTipico,
        valor: valorPorPessoa,
      });
    }
  }
  return lista;
}

function aplicarTeto(
  decisoes: Decisao[],
  viagem: Viagem | null,
  frequencias: Record<string, number>,
): { pedido: number; pago: number; cortes: { nome: string; valor: number }[] } {
  const candidatos: Candidato[] = [];

  for (const d of decisoes) {
    d.compensacoes.forEach((c, i) => {
      if (!c.foraDoTeto && c.valorEstimado > 0) {
        candidatos.push({
          nome: d.nome,
          frequencia: frequencias[d.passageiroId] ?? 0,
          valor: c.valorEstimado,
          chave: `${d.passageiroId}#${i}`,
        });
      }
    });
  }

  // Os passageiros sem nome da mesma ocorrência também consomem o teto.
  const extraTipico = candidatos.length > 0 ? candidatos[0].valor : 0;
  if (viagem && extraTipico > 0) {
    candidatos.push(...candidatosDeFundo(viagem.cargaDeFundo, extraTipico));
  }

  const { pedido, pago, cortes, cortados } = ordemDeCorte(candidatos);
  if (cortes.length === 0) return { pedido, pago, cortes };

  for (const d of decisoes) {
    const sobreviventes: Compensacao[] = [];
    d.compensacoes.forEach((c, i) => {
      if (cortados.has(`${d.passageiroId}#${i}`)) {
        d.regrasBloqueadas.push({
          id: 'B3',
          motivo: `${c.tipo} de R$ ${c.valorEstimado} cortado: a ocorrência estourou o teto de R$ ${TETO_POR_OCORRENCIA}`,
        });
      } else {
        sobreviventes.push(c);
      }
    });
    d.compensacoes = sobreviventes;
  }

  return { pedido, pago, cortes };
}

// --- entrada pública --------------------------------------------------------

function avaliar(
  gatilho: Gatilho,
  viagem: Viagem | null,
  passageiros: Passageiro[],
  historico: Historico = {},
): { decisoes: Decisao[]; resumo: Resumo } {
  const alvos = passageirosDoGatilho(gatilho, viagem, passageiros);

  const frequencias: Record<string, number> = {};
  for (const p of alvos) frequencias[p.id] = p.viagens24m;

  const decisoes = alvos.map((p) =>
    avaliarPassageiro({ gatilho, viagem, passageiro: p }, historico),
  );
  const teto = aplicarTeto(decisoes, viagem, frequencias);

  const bloqueiosPorMotivo: Record<string, number> = {};
  for (const d of decisoes) {
    for (const b of d.regrasBloqueadas) {
      bloqueiosPorMotivo[b.id] = (bloqueiosPorMotivo[b.id] ?? 0) + 1;
    }
  }

  const custoDisparos = decisoes.reduce((s, d) => s + d.custoDisparo, 0);
  const custoCompensacoes = decisoes.reduce(
    (s, d) => s + d.compensacoes.reduce((t, c) => t + c.valorEstimado, 0),
    0,
  );

  const resumo: Resumo = {
    pessoasAlcancaveis: alvos.filter((p) => p.temContato).length,
    pessoasAvisadas: decisoes.filter((d) => d.enviar).length,
    semAvisoPorFaltaDeContato: decisoes.filter((d) =>
      d.regrasBloqueadas.some((b) => b.id === 'B0'),
    ).length,
    bloqueiosPorMotivo,
    custoDisparos: Math.round(custoDisparos * 100) / 100,
    custoCompensacoes,
    custoTotal: Math.round((custoDisparos + custoCompensacoes) * 100) / 100,
    beneficioExtraPedido: teto.pedido,
    beneficioExtraPago: teto.pago,
    cortesPorTeto: teto.cortes,
  };

  return { decisoes, resumo };
}

/** Decide o que fazer com cada passageiro alcançado pelo gatilho. */
export function decidir(
  gatilho: Gatilho,
  viagem: Viagem | null,
  passageiros: Passageiro[],
  historico: Historico = {},
): Decisao[] {
  return avaliar(gatilho, viagem, passageiros, historico).decisoes;
}

/** Números da ocorrência: cobertura, custo, bloqueios e cortes pelo teto. */
export function resumoDaOcorrencia(
  gatilho: Gatilho,
  viagem: Viagem | null,
  passageiros: Passageiro[],
  historico: Historico = {},
): Resumo {
  return avaliar(gatilho, viagem, passageiros, historico).resumo;
}
