// Horários da ocorrência. Funções puras, fora da interface: o motor, o validador
// e a conversa precisam do mesmo cálculo, e a v2 passou a precisar dele também
// fora do React — o pacote de fatos travados é montado a partir daqui.

import type { Viagem } from './dados';
import type { Gatilho } from './motor';

export function somarMinutos(hhmm: string, minutos: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutos + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Horário para leitura humana: 23h50, não 23:50. */
export function hora(hhmm: string): string {
  return hhmm.replace(':', 'h');
}

/** Quando a ocorrência entra no sistema, em relação à partida. */
const ANTECEDENCIA: Record<string, number> = {
  atraso: 0,
  quebra: -18,
  mudanca_plataforma: -25,
  cancelamento: -20,
};

export function momentoDoEvento(g: Gatilho, v: Viagem | null): string {
  if (g.tipo !== 'ocorrencia' || !v) return '09:00'; // revisão mensal e marcos rodam de manhã
  return somarMinutos(v.partida, ANTECEDENCIA[g.ocorrencia] ?? 0);
}

export function horarioRevisado(g: Gatilho, v: Viagem | null): string {
  // Sem viagem não há horário revisado, e inventar um seria afirmar ao passageiro
  // um fato que não existe em dado nenhum. Nenhuma mensagem sem viagem o usa.
  if (!v) return '';
  if (g.tipo !== 'ocorrencia') return v.partida;
  if (g.ocorrencia === 'cancelamento') return v.proximaSaida;
  if (g.ocorrencia === 'mudanca_plataforma') return v.partida;
  return somarMinutos(v.partida, g.minutosImpacto);
}
