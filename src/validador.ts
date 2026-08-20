// Validador programático das redações de IA (spec v2, seção 3.1).
//
// O agente redator recebe um pacote de fatos travados e escreve o texto ao redor
// deles. Antes de qualquer exibição, esta função confere se os fatos aparecem
// corretos na redação. Divergiu, a redação é descartada e o sistema cai para o
// template da v1 — com o motivo registrado no canhoto.
//
// Módulo irmão do motor: função pura, sem React, sem estado, sem rede.

import type { Canal } from './dados';

// --- tipos ------------------------------------------------------------------

export type CampoDeFato = 'nome' | 'horário' | 'valor' | 'canal' | 'oferta' | 'tamanho';

/** Compensação decidida pela regra. O agente escolhe como dizer, nunca quanto. */
export interface CompensacaoTravada {
  rotulo: string; // 'crédito de 30%'
  termos: string[]; // termos que precisam aparecer literalmente na redação
}

/** O que o agente não pode alterar. Entra no prompt e sai na conferência. */
export interface PacoteDeFatos {
  id: string;
  passageiroId: string;
  nome: string;
  segmento: string;
  tipoDeFalha: string;
  horarioPartida: string; // '06h30'
  horarioRevisado: string; // '07h15'
  compensacoes: CompensacaoTravada[];
  canal: Canal;
  ofertaComercialLiberada: boolean; // freio de permissão aplicado à saída do agente
  maximoDeFrases: number; // instrução do prompt, não fato travado
}

export interface Redacao {
  texto: string;
  canal: Canal;
}

export interface Checagem {
  campo: CampoDeFato;
  rotulo: string;
  ok: boolean;
  /** Só o que é bloqueante descarta a redação. O resto fica registrado. */
  bloqueante: boolean;
  detalhe: string;
}

export interface Veredito {
  valido: boolean;
  checagens: Checagem[];
  /** Preenchido só quando a redação é descartada. Vai inteiro para o canhoto. */
  motivo: string | null;
}

/**
 * Termos que caracterizam oferta comercial. Quem não autorizou não pode receber
 * nenhum deles — nem quando é a IA que escreve. É o freio de permissão (B1)
 * atravessando a saída do agente, como pede a seção 1 da spec.
 */
export const TERMOS_DE_OFERTA = [
  'desconto',
  'promoção',
  'oferta',
  'cupom',
  'cashback',
  'brinde',
  'condição especial',
];

const HORARIO = /\b\d{1,2}h\d{2}\b/g;

// --- auxiliares -------------------------------------------------------------

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function contem(texto: string, termo: string): boolean {
  return normalizar(texto).includes(normalizar(termo));
}

/** Frases do texto. Reticências não separam frase; ponto final, sim. */
export function frasesDe(texto: string): string[] {
  return texto
    .replace(/\.{3}/g, '…')
    .split(/[.!?]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

// --- as checagens, uma por fato travado -------------------------------------

function checarNome(f: PacoteDeFatos, r: Redacao): Checagem {
  const ok = contem(r.texto, f.nome);
  return {
    campo: 'nome',
    rotulo: 'nome',
    ok,
    bloqueante: true,
    detalhe: ok ? f.nome : `nome travado (${f.nome}) não aparece na redação`,
  };
}

function checarHorario(f: PacoteDeFatos, r: Redacao): Checagem {
  const encontrados: string[] = r.texto.match(HORARIO) ?? [];
  const previstos = [f.horarioPartida, f.horarioRevisado];
  const intrusos = encontrados.filter((h) => !previstos.includes(h));
  const temRevisado = encontrados.includes(f.horarioRevisado);

  if (!temRevisado) {
    const divergente = intrusos[0];
    return {
      campo: 'horário',
      rotulo: 'horário',
      ok: false,
      bloqueante: true,
      detalhe: divergente
        ? `horário divergente do fato travado (${divergente} ≠ ${f.horarioRevisado})`
        : `horário revisado (${f.horarioRevisado}) não aparece na redação`,
    };
  }

  if (intrusos.length > 0) {
    return {
      campo: 'horário',
      rotulo: 'horário',
      ok: false,
      bloqueante: true,
      detalhe: `horário fora do pacote de fatos (${intrusos.join(', ')})`,
    };
  }

  return {
    campo: 'horário',
    rotulo: 'horário',
    ok: true,
    bloqueante: true,
    detalhe: `${f.horarioPartida} → ${f.horarioRevisado}`,
  };
}

function checarValor(f: PacoteDeFatos, r: Redacao): Checagem {
  const faltando = f.compensacoes.filter((c) => !c.termos.every((t) => contem(r.texto, t)));
  const ok = faltando.length === 0;
  return {
    campo: 'valor',
    rotulo: 'valor',
    ok,
    bloqueante: true,
    detalhe: ok
      ? f.compensacoes.map((c) => c.rotulo).join(' · ') || 'sem compensação a anunciar'
      : `compensação decidida pela regra não aparece na redação: ${faltando
          .map((c) => c.rotulo)
          .join(', ')}`,
  };
}

function checarCanal(f: PacoteDeFatos, r: Redacao): Checagem {
  const ok = r.canal === f.canal;
  return {
    campo: 'canal',
    rotulo: 'canal',
    ok,
    bloqueante: true,
    detalhe: ok ? f.canal : `canal divergente do fato travado (${r.canal} ≠ ${f.canal})`,
  };
}

function checarOferta(f: PacoteDeFatos, r: Redacao): Checagem {
  if (f.ofertaComercialLiberada) {
    return {
      campo: 'oferta',
      rotulo: 'oferta comercial',
      ok: true,
      bloqueante: true,
      detalhe: 'cliente autorizou comunicação de oferta',
    };
  }
  const achados = TERMOS_DE_OFERTA.filter((t) => contem(r.texto, t));
  const ok = achados.length === 0;
  return {
    campo: 'oferta',
    rotulo: 'oferta comercial',
    ok,
    bloqueante: true,
    detalhe: ok
      ? 'sem oferta comercial, como manda o freio de permissão'
      : `oferta comercial em redação sem consentimento (${achados.join(', ')})`,
  };
}

/**
 * Tamanho é instrução do prompt (seção 3.4), não fato travado (seção 3.1):
 * fica registrado no canhoto e não descarta a redação sozinho.
 */
function checarTamanho(f: PacoteDeFatos, r: Redacao): Checagem {
  const frases = frasesDe(r.texto).length;
  const ok = frases <= f.maximoDeFrases;
  return {
    campo: 'tamanho',
    rotulo: 'tamanho',
    ok,
    bloqueante: false,
    detalhe: ok
      ? `${frases} frases, dentro do limite de ${f.maximoDeFrases}`
      : `${frases} frases, acima do limite de ${f.maximoDeFrases} do prompt`,
  };
}

// --- entrada pública --------------------------------------------------------

/** Confere a redação contra o pacote de fatos travados. */
export function validarRedacao(fatos: PacoteDeFatos, redacao: Redacao): Veredito {
  const checagens = [
    checarNome(fatos, redacao),
    checarHorario(fatos, redacao),
    checarValor(fatos, redacao),
    checarCanal(fatos, redacao),
    checarOferta(fatos, redacao),
    checarTamanho(fatos, redacao),
  ];

  const reprovada = checagens.find((c) => c.bloqueante && !c.ok);
  return {
    valido: !reprovada,
    checagens,
    motivo: reprovada ? reprovada.detalhe : null,
  };
}

/** A linha do canhoto: `horário ✓ · valor ✓ · nome ✓ · canal ✓`. */
export const ORDEM_NO_CANHOTO: CampoDeFato[] = ['horário', 'valor', 'nome', 'canal'];

export function linhaDeFatosValidados(v: Veredito): string {
  return ORDEM_NO_CANHOTO.map((campo) => {
    const c = v.checagens.find((x) => x.campo === campo)!;
    return `${c.rotulo} ${c.ok ? '✓' : '✗'}`;
  }).join(' · ');
}
