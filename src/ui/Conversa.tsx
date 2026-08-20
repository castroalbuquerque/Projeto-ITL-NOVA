import { MENSAGENS, NOVIDADES_POR_LINHA, passageiroPorId, type Viagem } from '../dados';
import { hora, horarioRevisado, momentoDoEvento, somarMinutos } from '../horarios';
import { motivoDeDescarte } from '../dadosV2';
import { REGRAS, type Compensacao, type Decisao, type Gatilho } from '../motor';
import { resolverRedacao } from '../redacao';
import { Etiqueta } from './Etiqueta';
import { TextoEmStreaming } from './Streaming';

// --- horários ---------------------------------------------------------------

// O cálculo mora em src/horarios.ts, fora da interface. Reexportado aqui porque
// a conversa é onde o resto do protótipo sempre foi buscá-lo.
export { hora, momentoDoEvento, horarioRevisado } from '../horarios';

// --- texto ------------------------------------------------------------------

const FRASE_DA_COMPENSACAO: Record<string, string> = {
  'crédito de 15%': 'um crédito de 15% já está na sua conta',
  'crédito de 20%': 'um crédito de 20% fica na sua conta pelo transtorno',
  'crédito de 30%': 'um crédito de 30% entra na sua conta hoje',
  'remarcação livre': 'a remarcação fica livre, sem taxa',
  'remarcação sem taxa': 'a remarcação é sem taxa',
  'reembolso da viagem anterior': 'o reembolso daquela viagem que quebrou já está liberado',
  'subida de classe por 30 dias': 'o assento de poltrona-cama sai pelo preço do executivo',
  'oferta dirigida de 25%': 'a próxima viagem sai com 25% de desconto até domingo',
  'desconto de retorno de 20%': 'a próxima viagem sai com 20% de desconto',
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
  const p = passageiroPorId(d.passageiroId);
  const linha = v ? v.linha : p.linhaHabitual;
  return modelo
    .replace(/\{nome\}/g, d.nome)
    .replace(/\{linha\}/g, linha ?? 'sua linha')
    .replace(/\{novidade\}/g, (linha && NOVIDADES_POR_LINHA[linha]) ?? '')
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
  modoIA = false,
  confirmados = {},
  aoConfirmar,
}: {
  eventos: Evento[];
  selecionadoId: string | null;
  aoSelecionar: (id: string) => void;
  /** Ligado, o texto vem do agente redator; desligado, do template da v1. */
  modoIA?: boolean;
  /** Envios já confirmados, por `evento:passageiro:regra`, com a hora do clique. */
  confirmados?: Record<string, string>;
  aoConfirmar?: (chave: string) => void;
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
                indiceDoEvento={i}
                modoIA={modoIA}
                confirmados={confirmados}
                aoConfirmar={aoConfirmar}
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
  indiceDoEvento,
  modoIA,
  confirmados,
  aoConfirmar,
  selecionado,
  aoSelecionar,
}: {
  d: Decisao;
  e: Evento;
  indiceDoEvento: number;
  modoIA: boolean;
  confirmados: Record<string, string>;
  aoConfirmar?: (chave: string) => void;
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
        const textoTemplate = d.chaveMensagem
          ? renderizar(d.chaveMensagem, d, e.gatilho, e.viagem)
          : '—';
        const chave = `${indiceDoEvento}:${d.passageiroId}:${r.id}`;
        const confirmado = confirmados[chave];
        const redacao = resolverRedacao({
          modoIA,
          gatilho: e.gatilho,
          passageiroId: d.passageiroId,
          canal: r.canais[0],
          textoTemplate,
        });
        return (
          <div key={r.id} className="mb-2 last:mb-0">
            {/* Redação reprovada pelo validador: aparece riscada, e nunca como enviada. */}
            {redacao.descartada && (
              <div className="mb-1 max-w-prose rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-2">
                <TextoEmStreaming
                  texto={redacao.descartada.texto}
                  ativo={modoIA}
                  rotulo="redação por IA · não foi enviada"
                  className="text-sm text-slate-400 line-through"
                />
                <div className="mt-1.5 border-l-2 border-red-400 pl-2 text-xs text-red-700">
                  {motivoDeDescarte(redacao.descartada.motivo)}
                </div>
              </div>
            )}

            <div className="max-w-prose rounded-lg rounded-tl-none bg-emerald-50 px-3 py-2 text-sm text-slate-800">
              {ligacao ? (
                'Ligação de um atendente sobre esta viagem, com o caso já aberto na tela dele.'
              ) : redacao.origem === 'ia' ? (
                <TextoEmStreaming texto={redacao.texto} ativo={modoIA} />
              ) : (
                redacao.texto
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-400">
              <span>
                {hora(horario)} · {r.canais.join(', ')} · {r.id}
                {r.atrasoEnvioMinutos ? ` · ${r.atrasoEnvioMinutos} min após a ocorrência` : ''}
              </span>
              {!ligacao && <Confirmacao chave={chave} confirmado={confirmado} aoConfirmar={aoConfirmar} />}
              {!ligacao && redacao.disponivel && (
                <span
                  className={
                    redacao.origem === 'ia'
                      ? 'rounded bg-violet-100 px-1.5 py-0.5 text-violet-700'
                      : 'rounded bg-slate-100 px-1.5 py-0.5 text-slate-500'
                  }
                >
                  {redacao.origem === 'ia'
                    ? 'redação por IA'
                    : redacao.descartada
                      ? 'template padrão, após descarte'
                      : 'template da v1'}
                </span>
              )}
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

/**
 * A Trava 1 na mensagem: enquanto ninguém clica, o texto é rascunho e nada foi
 * concedido — nem o benefício que ele anuncia. É o botão que transforma a
 * decisão do motor em mensagem, e o custo em custo.
 */
function Confirmacao({
  chave,
  confirmado,
  aoConfirmar,
}: {
  chave: string;
  confirmado?: string;
  aoConfirmar?: (chave: string) => void;
}) {
  if (!aoConfirmar) return null;
  if (confirmado) {
    return (
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
        envio confirmado às {confirmado}
      </span>
    );
  }
  return (
    <>
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
        rascunho · nada saiu ainda
      </span>
      <button
        onClick={(ev) => {
          ev.stopPropagation();
          aoConfirmar(chave);
        }}
        className="rounded border border-slate-800 px-2 py-0.5 text-slate-800 hover:bg-slate-800 hover:text-white"
      >
        Confirmar envio
      </button>
    </>
  );
}
