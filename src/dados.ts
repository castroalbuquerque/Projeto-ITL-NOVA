// Central de Transparência — dados do exercício.
// Base inventada à mão. Nada aqui vem de sistema real: 11 passageiros, 3 viagens.
// Referências a "p.N" apontam para as páginas do relatório fluxo-central-transparencia.pdf.

export type Grupo = 1 | 2 | 3 | 4 | 5 | 6 | null; // null = fora dos conjuntos

export type Canal =
  | 'whatsapp'
  | 'sms'
  | 'push'
  | 'ligacao'
  | 'bilhete_impresso'
  | 'guiche'
  | 'painel_terminal';

export type Tom = 'informativo' | 'atencioso' | 'reparador' | 'reconquista';

export interface Passageiro {
  id: string;
  nome: string;
  idade: number;
  grupo: Grupo;
  grupoRotulo: string; // 'Clientes Âncora' … | 'fora dos conjuntos'
  viagens24m: number;
  viagens4m: number; // gatilho marco: 5 viagens em 4 meses
  diasDesdeUltimaViagem: number;
  compraEm: 'aplicativo' | 'site' | 'guiche' | 'agencia' | 'telefone';
  temContato: boolean; // governa o B0 — existe caminho até a pessoa
  consentimentoMarketing: boolean; // governa o B1 — ela autorizou ser procurada
  ocorrenciasAbertas: number;
  passagensNaoUsadas: number; // gatilho padrão
  gastoEmAlta: boolean; // gatilho marco
}

/** Faixa de frequência dos passageiros anônimos que também estão a bordo. */
export interface FaixaDeFundo {
  faixa: 'semanal' | 'mensal' | 'raro';
  pessoas: number;
  viagens24mTipico: number; // usado para ordenar o corte do B3, do menos frequente ao mais
}

export interface Viagem {
  id: string;
  linha: string;
  origem: string;
  destino: string;
  quilometros: number;
  partida: string; // 'HH:MM'
  proximaSaida: string; // 'HH:MM' — para onde o passageiro é realocado num cancelamento
  plataforma: string;
  noturna: boolean;
  valorPassagem: number; // R$
  passageiroIds: string[];
  cargaDeFundo: FaixaDeFundo[]; // passageiros sem nome, contam para o teto do B3
}

export const ROTULOS_DE_GRUPO: Record<Exclude<Grupo, null>, string> = {
  1: 'Clientes Âncora',
  2: 'Regulares em Ascensão',
  3: 'Adormecidos Alcançáveis',
  4: 'Adormecidos Invisíveis',
  5: 'Feridos pela Operação',
  6: 'Pagantes Ausentes',
};

export const FORA_DOS_CONJUNTOS = 'fora dos conjuntos';

export const PASSAGEIROS: Passageiro[] = [
  {
    // p.1 — cauda alta do grupo 1: a cada quinze dias dá mais de cinquenta viagens em dois anos.
    id: 'p-01',
    nome: 'Mariana',
    idade: 28,
    grupo: 1,
    grupoRotulo: ROTULOS_DE_GRUPO[1],
    viagens24m: 52,
    viagens4m: 8,
    diasDesdeUltimaViagem: 14,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: true,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.1 — só três viagens, a segunda terminou em quebra sem aviso, sumiu há seis meses.
    // A ocorrência aberta é a daquela viagem: nunca foi resolvida.
    id: 'p-02',
    nome: 'Carlos',
    idade: 45,
    grupo: 5,
    grupoRotulo: ROTULOS_DE_GRUPO[5],
    viagens24m: 3,
    viagens4m: 0,
    diasDesdeUltimaViagem: 180,
    compraEm: 'site',
    temContato: true,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 1,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.2 — semanal a trabalho, cliente há seis anos.
    // gastoEmAlta e 16 viagens em 4 meses de propósito: ela cumpre todos os requisitos
    // do marco e só é barrada por ser do grupo 1. Sem isso, o teste do marco passaria por acaso.
    id: 'p-03',
    nome: 'Ana Paula',
    idade: 38,
    grupo: 1,
    grupoRotulo: ROTULOS_DE_GRUPO[1],
    viagens24m: 88,
    viagens4m: 16,
    diasDesdeUltimaViagem: 5,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: true,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: true,
  },
  {
    // p.2 — uma ou duas viagens por ano; viaja pouco demais para ser classificada com segurança.
    id: 'p-04',
    nome: 'Beatriz',
    idade: 31,
    grupo: null,
    grupoRotulo: FORA_DOS_CONJUNTOS,
    viagens24m: 3,
    viagens4m: 0,
    diasDesdeUltimaViagem: 210,
    compraEm: 'site',
    temContato: true,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.2 e p.3 — primeira viagem, comprou na véspera. Sem histórico nenhum.
    // diasDesdeUltimaViagem = 0 porque não existe viagem anterior; com viagens24m = 0,
    // o win-back não deve alcançá-lo.
    id: 'p-05',
    nome: 'Diego',
    idade: 24,
    grupo: null,
    grupoRotulo: FORA_DOS_CONJUNTOS,
    viagens24m: 0,
    viagens4m: 0,
    diasDesdeUltimaViagem: 0,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.3 — grupo 1 e fora do alcance digital ao mesmo tempo. É o caso que o quadro da p.7
    // usa para mostrar que o conjunto não decide se a mensagem sai.
    id: 'p-06',
    nome: 'Rosa',
    idade: 66,
    grupo: 1,
    grupoRotulo: ROTULOS_DE_GRUPO[1],
    viagens24m: 30,
    viagens4m: 5,
    diasDesdeUltimaViagem: 12,
    compraEm: 'guiche',
    temContato: false,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.4 — sumiu há sete meses, compra pelo aplicativo, autorizou. Alcançável de verdade.
    id: 'p-07',
    nome: 'Jorge',
    idade: 33,
    grupo: 3,
    grupoRotulo: ROTULOS_DE_GRUPO[3],
    viagens24m: 9,
    viagens4m: 0,
    diasDesdeUltimaViagem: 210,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: true,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.4 — sumiu há oito meses, comprava no guichê, nunca autorizou.
    // Os dois bloqueios de uma vez: não há caminho e não há autorização.
    id: 'p-08',
    nome: 'Sandra',
    idade: 58,
    grupo: 4,
    grupoRotulo: ROTULOS_DE_GRUPO[4],
    viagens24m: 11,
    viagens4m: 0,
    diasDesdeUltimaViagem: 240,
    compraEm: 'guiche',
    temContato: false,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: false,
  },
  {
    // p.5 — quinta viagem em quatro meses, gasto do trimestre acima do ritmo anterior.
    id: 'p-09',
    nome: 'Letícia',
    idade: 35,
    grupo: 2,
    grupoRotulo: ROTULOS_DE_GRUPO[2],
    viagens24m: 22,
    viagens4m: 5,
    diasDesdeUltimaViagem: 20,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: true,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: true,
  },
  {
    // p.5 — mesmo marco da Letícia, autorização dada, e nenhum contato cadastrado.
    // É o único passageiro em que autorização e alcance apontam para lados diferentes.
    id: 'p-10',
    nome: 'Marcos',
    idade: 49,
    grupo: 2,
    grupoRotulo: ROTULOS_DE_GRUPO[2],
    viagens24m: 21,
    viagens4m: 5,
    diasDesdeUltimaViagem: 22,
    compraEm: 'guiche',
    temContato: false,
    consentimentoMarketing: true,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 0,
    gastoEmAlta: true,
  },
  {
    // p.6 — seis passagens no semestre, embarcou em duas. Quatro não usadas.
    id: 'p-11',
    nome: 'Wilson',
    idade: 41,
    grupo: 6,
    grupoRotulo: ROTULOS_DE_GRUPO[6],
    viagens24m: 6,
    viagens4m: 2,
    diasDesdeUltimaViagem: 30,
    compraEm: 'aplicativo',
    temContato: true,
    consentimentoMarketing: false,
    ocorrenciasAbertas: 0,
    passagensNaoUsadas: 4,
    gastoEmAlta: false,
  },
];

export const VIAGENS: Viagem[] = [
  {
    // p.1 — a quebra das 06h12. Saída revisada 07h15 = partida + 45 min.
    id: 'v-01',
    linha: 'Capital–Interior',
    origem: 'Terminal Rodoviário da Capital',
    destino: 'Interior',
    quilometros: 290,
    partida: '06:30',
    proximaSaida: '09:00',
    plataforma: '07',
    noturna: false,
    valorPassagem: 155,
    passageiroIds: ['p-01', 'p-02'],
    cargaDeFundo: [],
  },
  {
    // p.2 — cancelamento das 06h00 com 42 pessoas a bordo e realocação na saída das 08h00.
    // 3 nominados + 39 de fundo. As faixas reproduzem a tabela da p.2 (9 semanais,
    // 18 mensais, 15 raros), descontando os nominados: Ana Paula é uma das 9 semanais,
    // Beatriz e Diego estão entre os 15 raros.
    id: 'v-02',
    linha: 'Capital–Sul',
    origem: 'Terminal Rodoviário da Capital',
    destino: 'Sul',
    quilometros: 780,
    partida: '06:00',
    proximaSaida: '08:00',
    plataforma: '03',
    noturna: false,
    valorPassagem: 310,
    passageiroIds: ['p-03', 'p-04', 'p-05'],
    cargaDeFundo: [
      { faixa: 'semanal', pessoas: 8, viagens24mTipico: 80 },
      { faixa: 'mensal', pessoas: 18, viagens24mTipico: 22 },
      { faixa: 'raro', pessoas: 13, viagens24mTipico: 4 },
    ],
  },
  {
    // p.3 — noturna de 640 km. Atraso de 1h20 leva a saída para 23h50 = partida + 80 min.
    id: 'v-03',
    linha: 'Capital–Nordeste',
    origem: 'Terminal Rodoviário da Capital',
    destino: 'Nordeste',
    quilometros: 640,
    partida: '22:30',
    proximaSaida: '06:00',
    plataforma: '12',
    noturna: true,
    valorPassagem: 260,
    passageiroIds: ['p-05', 'p-06'],
    cargaDeFundo: [],
  },
];

export function passageiroPorId(id: string): Passageiro {
  const achado = PASSAGEIROS.find((p) => p.id === id);
  if (!achado) throw new Error(`passageiro desconhecido: ${id}`);
  return achado;
}

export function viagemPorId(id: string): Viagem {
  const achada = VIAGENS.find((v) => v.id === id);
  if (!achada) throw new Error(`viagem desconhecida: ${id}`);
  return achada;
}

export function etiquetaDeGrupo(p: Passageiro): string {
  return p.grupo === null ? FORA_DOS_CONJUNTOS : `Grupo ${p.grupo} · ${p.grupoRotulo}`;
}

/** Linhas para conferência no console: grupo, alcance e autorização de cada um dos 11. */
export function conferenciaDeCadastro() {
  return PASSAGEIROS.map((p) => ({
    id: p.id,
    nome: p.nome,
    grupo: etiquetaDeGrupo(p),
    alcance: p.temContato ? 'tem contato' : 'sem contato',
    autorizacao: p.consentimentoMarketing ? 'autorizou' : 'não autorizou',
    viagens24m: p.viagens24m,
    viagens4m: p.viagens4m,
    diasDesdeUltimaViagem: p.diasDesdeUltimaViagem,
    passagensNaoUsadas: p.passagensNaoUsadas,
    gastoEmAlta: p.gastoEmAlta,
    ocorrenciasAbertas: p.ocorrenciasAbertas,
  }));
}
