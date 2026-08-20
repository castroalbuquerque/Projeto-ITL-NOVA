import { passageiroPorId } from '../dados';
import { ROTULO_DE_REDACAO_IA, ROTULO_DE_TEMPLATE, motivoDeDescarte } from '../dadosV2';
import { REGRAS } from '../motor';
import { resolverRedacao, type Resolucao } from '../redacao';
import { linhaDeFatosValidados } from '../validador';
import { renderizar, rotuloDoGatilho, type Evento } from './Conversa';
import { Etiqueta } from './Etiqueta';

const NOME_DO_BLOQUEIO: Record<string, string> = {
  B0: 'B0 · alcance',
  B1: 'B1 · autorização',
  B2: 'B2 · limite',
  B4: 'B4 · caso aberto',
  B3: 'B3 · teto',
};

/**
 * O canhoto da decisão. Para o passageiro selecionado, o que foi aplicado, o
 * que foi barrado e por quê — em cada gatilho disparado, do mais recente ao
 * mais antigo.
 */
export function Inspetor({
  eventos,
  selecionadoId,
  modoIA = false,
}: {
  eventos: Evento[];
  selecionadoId: string | null;
  modoIA?: boolean;
}) {
  if (!selecionadoId) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Escolha um passageiro na conversa para ver o que o motor decidiu sobre ele.
      </div>
    );
  }

  const p = passageiroPorId(selecionadoId);
  const linhas = eventos
    .map((e) => ({ e, d: e.decisoes.find((x) => x.passageiroId === selecionadoId) }))
    .filter((l) => l.d)
    .reverse();

  return (
    <div className="p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="font-medium">{p.nome}</h2>
        <span className="text-xs text-slate-400">{p.idade} anos</span>
      </div>
      <Etiqueta p={p} />

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-y border-slate-200 py-2 text-xs">
        <dt className="text-slate-500">Alcance</dt>
        <dd className={p.temContato ? '' : 'font-medium text-amber-700'}>
          {p.temContato ? 'tem contato' : 'sem contato'}
        </dd>
        <dt className="text-slate-500">Autorização</dt>
        <dd className={p.consentimentoMarketing ? '' : 'font-medium text-amber-700'}>
          {p.consentimentoMarketing ? 'autorizou' : 'não autorizou'}
        </dd>
        <dt className="text-slate-500">Compra em</dt>
        <dd>{p.compraEm}</dd>
        <dt className="text-slate-500">Viagens em 24 meses</dt>
        <dd>{p.viagens24m}</dd>
      </dl>

      {linhas.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">
          Nenhum gatilho disparado ainda alcançou este passageiro.
        </p>
      )}

      {linhas.map(({ e, d }, i) => (
        <section key={i} className="mt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {rotuloDoGatilho(e.gatilho)}
          </h3>

          <div className="mt-2">
            <div className="mb-1 text-xs text-slate-500">Regras aplicadas</div>
            {d!.regrasAplicadas.length === 0 ? (
              <div className="text-xs text-slate-400">nenhuma</div>
            ) : (
              <ul className="space-y-1">
                {d!.regrasAplicadas.map((id) => {
                  const r = REGRAS.find((x) => x.id === id)!;
                  return (
                    <li key={id} className="border-l-2 border-emerald-500 pl-2 text-xs">
                      <span className="font-mono">{r.id}</span> · {r.descricao}
                      <div className="text-slate-500">
                        {r.canais.length > 0 ? r.canais.join(', ') : 'nenhum canal'}
                        {r.atrasoEnvioMinutos !== null && ` · ${r.atrasoEnvioMinutos} min`}
                        {r.tom && ` · tom ${r.tom}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-2">
            <div className="mb-1 text-xs text-slate-500">Regras bloqueadas</div>
            {d!.regrasBloqueadas.length === 0 ? (
              <div className="text-xs text-slate-400">nenhuma</div>
            ) : (
              <ul className="space-y-1">
                {d!.regrasBloqueadas.map((b, j) => (
                  <li key={j} className="border-l-2 border-red-400 pl-2 text-xs">
                    <span className="font-medium">{NOME_DO_BLOQUEIO[b.id] ?? b.id}</span>
                    <div className="text-slate-600">{b.motivo}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {d!.compensacoes.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs text-slate-500">Compensação</div>
              <ul className="space-y-0.5 text-xs">
                {d!.compensacoes.map((c, j) => (
                  <li key={j} className="flex justify-between gap-2">
                    <span>
                      {c.tipo}
                      {c.foraDoTeto && <span className="text-slate-400"> · fora do teto</span>}
                    </span>
                    <span className="tabular-nums">R$ {c.valorEstimado}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <BlocoDeRedacao
            resolucao={resolverRedacao({
              modoIA,
              gatilho: e.gatilho,
              passageiroId: d!.passageiroId,
              canal: 'whatsapp',
              textoTemplate: d!.chaveMensagem
                ? renderizar(d!.chaveMensagem, d!, e.gatilho, e.viagem)
                : '',
            })}
          />

          <div className="mt-2 text-xs text-slate-400">
            disparo: R$ {d!.custoDisparo.toFixed(2)}
            {d!.tom && ` · tom ${d!.tom}`}
            {d!.chaveMensagem && ` · ${d!.chaveMensagem}`}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Bloco novo do canhoto (seção 3.2): quem escreveu a mensagem e o que o
 * validador conferiu — ou, no descarte, o motivo em texto legível.
 */
function BlocoDeRedacao({ resolucao }: { resolucao: Resolucao }) {
  if (!resolucao.disponivel) return null;

  const naoBloqueantes = (resolucao.veredito?.checagens ?? []).filter(
    (c) => !c.bloqueante && !c.ok,
  );

  return (
    <div className="mt-2">
      <div className="mb-1 text-xs text-slate-500">Redação</div>
      {resolucao.descartada ? (
        <div className="border-l-2 border-red-400 pl-2 text-xs">
          <div className="text-red-700">{motivoDeDescarte(resolucao.descartada.motivo)}</div>
          <div className="mt-0.5 text-slate-500">
            Fatos conferidos: {linhaDeFatosValidados(resolucao.veredito!)}
          </div>
        </div>
      ) : resolucao.origem === 'ia' ? (
        <div className="border-l-2 border-violet-500 pl-2 text-xs">
          <div className="font-medium">{ROTULO_DE_REDACAO_IA}</div>
          <div className="text-slate-600">
            Fatos validados: {linhaDeFatosValidados(resolucao.veredito!)}
          </div>
          {naoBloqueantes.map((c) => (
            <div key={c.campo} className="text-slate-400">
              {c.rotulo}: {c.detalhe} · registrado, não bloqueia
            </div>
          ))}
        </div>
      ) : (
        <div className="border-l-2 border-slate-300 pl-2 text-xs">
          <div className="font-medium text-slate-600">{ROTULO_DE_TEMPLATE}</div>
          <div className="text-slate-400">
            há redação de IA pré-computada para esta mensagem; o topo da conversa está em
            Template (v1)
          </div>
        </div>
      )}
    </div>
  );
}
