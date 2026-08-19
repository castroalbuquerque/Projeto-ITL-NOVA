import { MENSAGENS, passageiroPorId, type Viagem } from '../dados';
import { REGRAS, type Compensacao, type Decisao, type Gatilho } from '../motor';
import { Etiqueta } from './Etiqueta';

// --- horários ---------------------------------------------------------------

function somarMinutos(hhmm: string, minutos: number): string {
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
  if (!v) return '18:00';
  if (g.tipo !== 'ocorrencia') return v.partida;
  if (g.ocorrencia === 'cancelamento') return v.proximaSaida;
  if (g.ocorrencia === 'mudanca_plataforma') return v.partida;
  return somarMinutos(v.partida, g.minutosImpacto);
}

// --- texto ------------------------------------------------------------------

const FRASE_DA_COMPENSACAO: Record<string, string> = {
  'crédito de 15%': 'um crédito de 15% já está na sua conta',
  'crédito de 20%': 'um crédito de 20% fica na sua conta pelo transtorno',
  'crédito de 30%': 'um crédito de 30% entra na sua conta hoje',
  'remarcação livre': 'a remarcação fica livre, sem taxa',
  'subida de classe por 30 dias': 'o assento de poltrona-cama sai pelo preço do executivo',
  'oferta dirigida de 25%': 'a próxima viagem sai com 25% de desconto até domingo',
};

/** Reembolso e lugar não entram aqui: o corpo da mensagem já os anuncia. */
function fraseDeCompensacao(comps: Compensacao[]): string {
  const frases = comps
    .filter((c) => FRASE_DA_COMPENSACAO[c.tipo])
    .map((c) => FRASE_DA_COMPENSACAO[c.tipo]);
  if (frases.length === 0) return '';
  const texto = frases.length === 1 ? frases[0] : `${frases[0]} e ${frases[1]}`;
  return texto + '.';
}

export function renderizar(chave: string, d: Decisao, g: Gatilho, v: Viagem | null): string {
  const modelo = MENSAGENS[chave];
  if (!modelo) return `[sem mensagem para ${chave}]`;
  return modelo
    .replace(/\{nome\}/g, d.nome)
    .replace(/\{linha\}/g, v ? v.linha : 'sua linha')
    .replace(/\{horarioRevisado\}/g, hora(horarioRevisado(g, v)))
    .replace(/\{horarioPartida\}/g, v ? hora(v.partida) : 'sua saída')
    .replace(/\{plataforma\}/g, v ? v.plataforma : '—')
    .replace(/\{compensacao\}/g, fraseDeCompensacao(d.compensacoes))
    .replace(/\s+([.,])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/(^|\. )([a-zà-ú])/g, (_m, antes, letra) => antes + letra.toUpperCase())
    .trim();
}

const ROTULO_DO_GATILHO: Record<string, string> = {
  atraso: 'Atraso longo',
  quebra: 'Quebra de veículo',
  mudanca_plataforma: 'Mudança de plataforma',
  cancelamento: 'Cancelamento',
  marco: 'Marco na relação',
  winback: 'Revisão mensal de sumidos',
  padrao: 'Padrão de não embarque',
};

export function rotuloDoGatilho(g: Gatilho): string {
  return ROTULO_DO_GATILHO[g.tipo === 'ocorrencia' ? g.ocorrencia : g.tipo] ?? g.tipo;
}

// --- componente -------------------------------------------------------------

export interface Evento {
  gatilho: Gatilho;
  viagem: Viagem | null;
  decisoes: Decisao[];
}

export function Conversa({
  eventos,
  selecionadoId,
  aoSelecionar,
}: {
  eventos: Evento[];
  selecionadoId: string | null;
  aoSelecionar: (id: string) => void;
}) {
  if (eventos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
        Escolha uma viagem e dispare um gatilho à esquerda.
        <br />O que o motor decidir aparece aqui.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {eventos.map((e, i) => (
        <section key={i}>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">
              {rotuloDoGatilho(e.gatilho)} · {hora(momentoDoEvento(e.gatilho, e.viagem))}
              {e.viagem ? ` · ${e.viagem.linha}` : ''}
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            {e.decisoes.map((d) => (
              <Bloco
                key={d.passageiroId}
                d={d}
                e={e}
                selecionado={d.passageiroId === selecionadoId}
                aoSelecionar={aoSelecionar}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Bloco({
  d,
  e,
  selecionado,
  aoSelecionar,
}: {
  d: Decisao;
  e: Evento;
  selecionado: boolean;
  aoSelecionar: (id: string) => void;
}) {
  const p = passageiroPorId(d.passageiroId);
  const regras = d.regrasAplicadas
    .map((id) => REGRAS.find((r) => r.id === id)!)
    .filter((r) => r && r.canais.length > 0);

  return (
    <div
      onClick={() => aoSelecionar(d.passageiroId)}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        selecionado ? 'border-slate-800 bg-white' : 'border-slate-200 bg-white hover:border-slate-400'
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{p.nome}</span>
        <Etiqueta p={p} />
      </div>

      {regras.map((r) => {
        const horario = somarMinutos(
          momentoDoEvento(e.gatilho, e.viagem),
          r.atrasoEnvioMinutos ?? 0,
        );
        const ligacao = r.canais.includes('ligacao');
        return (
          <div key={r.id} className="mb-2 last:mb-0">
            <div className="max-w-prose rounded-lg rounded-tl-none bg-emerald-50 px-3 py-2 text-sm text-slate-800">
              {ligacao
                ? 'Ligação de um atendente sobre esta viagem, com o caso já aberto na tela dele.'
                : d.chaveMensagem
                  ? renderizar(d.chaveMensagem, d, e.gatilho, e.viagem)
                  : '—'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {hora(horario)} · {r.canais.join(', ')} · {r.id}
              {r.atrasoEnvioMinutos ? ` · ${r.atrasoEnvioMinutos} min após a ocorrência` : ''}
            </div>
          </div>
        );
      })}

      {/* Ação de terminal: não é conversa. É painel de partidas e instrução ao guichê. */}
      {d.acoesTerminal.map((chave) => (
        <div key={chave} className="mb-2 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 last:mb-0">
          <div className="mb-0.5 font-mono text-[10px] tracking-wide text-amber-700 uppercase">
            {chave.startsWith('painel') ? 'painel de partidas' : 'instrução ao guichê'} · não é
            mensagem
          </div>
          <div className="text-sm text-slate-800">
            {renderizar(chave, d, e.gatilho, e.viagem)}
          </div>
        </div>
      ))}

      {d.acaoInterna && (
        <div className="border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
          <div className="mb-0.5 font-mono text-[10px] tracking-wide text-slate-500 uppercase">
            registro interno · nada sai
          </div>
          <div className="text-sm text-slate-700">{d.acaoInterna}</div>
        </div>
      )}

      {!d.enviar && d.acoesTerminal.length === 0 && !d.acaoInterna && (
        <div className="text-sm text-slate-400">
          Nenhuma mensagem e nenhuma ação. O motor decidiu não agir.
        </div>
      )}
    </div>
  );
}
