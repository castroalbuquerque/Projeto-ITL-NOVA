// Quem escreveu a mensagem que está na tela: o template da v1 ou o agente redator.
//
// Função pura, fora da interface, para o canhoto e a conversa contarem a mesma
// história a partir do mesmo cálculo. O validador roda aqui, antes de qualquer
// exibição: redação reprovada nunca aparece como mensagem enviada.

import { OCORRENCIA_DE_REFERENCIA, PACOTES_DE_FATOS, REDACOES_IA } from './dadosV2';
import type { Canal } from './dados';
import type { Gatilho } from './motor';
import { validarRedacao, type Veredito } from './validador';

export interface Resolucao {
  origem: 'template' | 'ia';
  /** O que vai para a tela como mensagem efetivamente enviada. */
  texto: string;
  /** Havia redação de IA pré-computada para esta mensagem. */
  disponivel: boolean;
  veredito: Veredito | null;
  descartada: { texto: string; motivo: string } | null;
}

/** A redação de IA cobre a ocorrência de referência da spec, no canal de mensagem. */
export function temRedacaoDeIA(gatilho: Gatilho, passageiroId: string, canal: Canal): boolean {
  return (
    gatilho.tipo === 'ocorrencia' &&
    gatilho.ocorrencia === OCORRENCIA_DE_REFERENCIA.ocorrencia &&
    gatilho.viagemId === OCORRENCIA_DE_REFERENCIA.viagemId &&
    canal === 'whatsapp' &&
    REDACOES_IA[passageiroId] !== undefined
  );
}

export function resolverRedacao(opts: {
  modoIA: boolean;
  gatilho: Gatilho;
  passageiroId: string;
  canal: Canal;
  textoTemplate: string;
}): Resolucao {
  const { modoIA, gatilho, passageiroId, canal, textoTemplate } = opts;
  const disponivel = temRedacaoDeIA(gatilho, passageiroId, canal);

  const template: Resolucao = {
    origem: 'template',
    texto: textoTemplate,
    disponivel,
    veredito: null,
    descartada: null,
  };

  if (!modoIA || !disponivel) return template;

  const redacao = REDACOES_IA[passageiroId];
  const veredito = validarRedacao(PACOTES_DE_FATOS[passageiroId], redacao);

  if (!veredito.valido) {
    return {
      ...template,
      veredito,
      descartada: { texto: redacao.texto, motivo: veredito.motivo! },
    };
  }

  return { origem: 'ia', texto: redacao.texto, disponivel, veredito, descartada: null };
}
