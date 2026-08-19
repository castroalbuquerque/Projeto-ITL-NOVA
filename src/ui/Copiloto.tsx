import { useState } from 'react';
import { passageiroPorId } from '../dados';
import {
  ACOES_DO_COPILOTO,
  AVISO_DE_EXEMPLO,
  CASO_ABERTO_CARLOS,
  DOSSIE_CARLOS,
  NOTA_DE_GUARDRAIL_CARLOS,
  PROPOSTA_CARLOS,
} from '../dadosV2';
import { Etiqueta } from './Etiqueta';
import { TextoEmStreaming } from './Streaming';

type Estado = 'proposta' | 'editando' | 'do_zero' | 'aprovado';

/**
 * F2 — copiloto da ouvidoria ativa (seção 4). O copiloto monta o dossiê e
 * propõe o texto; quem decide é a pessoa. Nada é concluído sem clique: a Trava 1
 * da governança vira botão na tela.
 */
export function Copiloto({
  passageiroId,
  aoFechar,
}: {
  passageiroId: string;
  aoFechar: () => void;
}) {
  const p = passageiroPorId(passageiroId);
  const [estado, setEstado] = useState<Estado>('proposta');
  const [texto, setTexto] = useState(PROPOSTA_CARLOS.texto);
  const [rascunho, setRascunho] = useState('');
  const [origem, setOrigem] = useState<'copiloto' | 'editado' | 'atendente'>('copiloto');
  const [horaDaAprovacao, setHoraDaAprovacao] = useState('');

  if (passageiroId !== CASO_ABERTO_CARLOS.passageiroId) {
    return (
      <Moldura titulo={`Caso de ${p.nome}`} aoFechar={aoFechar}>
        <p className="p-4 text-sm text-slate-500">
          A v2 pré-computou o dossiê e a proposta apenas do caso do Carlos (seção 4.2 da spec).
          Os demais casos da fila seguem no fluxo da v1.
        </p>
      </Moldura>
    );
  }

  function aprovar(textoFinal: string, deQuem: 'copiloto' | 'editado' | 'atendente') {
    setTexto(textoFinal);
    setOrigem(deQuem);
    setHoraDaAprovacao(
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h'),
    );
    setEstado('aprovado');
  }

  return (
    <Moldura titulo={`Ouvidoria ativa · caso de ${p.nome}`} aoFechar={aoFechar}>
      <div className="space-y-4 p-4">
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Dossiê montado pelo copiloto
            </h3>
            <Etiqueta p={p} />
          </div>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1 text-sm">
            {DOSSIE_CARLOS.map((l) => (
              <div key={l.campo} className="contents">
                <dt className="text-slate-500">{l.campo}</dt>
                <dd className={l.destaque ? 'font-medium' : ''}>
                  {l.valor}
                  {l.exemplo && <span className="text-slate-400"> · {AVISO_DE_EXEMPLO}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
            {CASO_ABERTO_CARLOS.motivoDaPrioridade} · responder em {CASO_ABERTO_CARLOS.prazoHoras} h
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Proposta de ação
            <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700 normal-case">
              redação por IA · aguardando aprovação
            </span>
          </h3>

          {estado === 'aprovado' ? (
            <div className="max-w-prose rounded-lg rounded-tl-none bg-emerald-50 px-3 py-2 text-sm">
              {texto}
            </div>
          ) : estado === 'proposta' ? (
            <div className="max-w-prose rounded-lg rounded-tl-none bg-violet-50 px-3 py-2 text-sm">
              <TextoEmStreaming texto={PROPOSTA_CARLOS.texto} ativo />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                {estado === 'editando'
                  ? 'Edite o texto antes de aprovar. O que sair é o que estiver aqui.'
                  : 'Proposta recusada. Escreva do zero o texto que vai para o cliente.'}
              </label>
              <textarea
                value={estado === 'editando' ? texto : rascunho}
                onChange={(ev) =>
                  estado === 'editando' ? setTexto(ev.target.value) : setRascunho(ev.target.value)
                }
                rows={7}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder={estado === 'do_zero' ? 'Texto do atendente…' : undefined}
              />
            </div>
          )}

          {/* Freio de permissão sobre a saída do agente (seção 4.2). */}
          <div className="mt-3 border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
            <div className="mb-0.5 font-mono text-[10px] tracking-wide text-amber-700 uppercase">
              guardrail · consentimento
            </div>
            <div className="text-sm text-slate-800">{NOTA_DE_GUARDRAIL_CARLOS}</div>
          </div>

          {estado === 'aprovado' ? (
            <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
              <div className="font-medium">Aprovado pelo atendente às {horaDaAprovacao}</div>
              <div className="text-slate-600">
                {origem === 'copiloto'
                  ? 'texto do copiloto, aprovado sem alteração'
                  : origem === 'editado'
                    ? 'texto do copiloto, alterado pelo atendente antes de aprovar'
                    : 'proposta recusada: texto escrito do zero pelo atendente'}{' '}
                · nada saiu antes deste clique, e nada sai de fato neste protótipo
              </div>
              <button
                onClick={() => {
                  setEstado('proposta');
                  setTexto(PROPOSTA_CARLOS.texto);
                  setRascunho('');
                  setOrigem('copiloto');
                }}
                className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-800"
              >
                Rever o caso do começo
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {estado === 'proposta' && (
                <>
                  <BotaoDoPainel
                    principal
                    rotulo={ACOES_DO_COPILOTO[0].rotulo}
                    onClick={() => aprovar(PROPOSTA_CARLOS.texto, 'copiloto')}
                  />
                  <BotaoDoPainel
                    rotulo={ACOES_DO_COPILOTO[1].rotulo}
                    onClick={() => setEstado('editando')}
                  />
                  <BotaoDoPainel
                    rotulo={ACOES_DO_COPILOTO[2].rotulo}
                    onClick={() => {
                      setRascunho('');
                      setEstado('do_zero');
                    }}
                  />
                </>
              )}

              {estado === 'editando' && (
                <>
                  <BotaoDoPainel
                    principal
                    rotulo="Aprovar texto editado"
                    onClick={() => aprovar(texto, 'editado')}
                  />
                  <BotaoDoPainel
                    rotulo="Cancelar edição"
                    onClick={() => {
                      setTexto(PROPOSTA_CARLOS.texto);
                      setEstado('proposta');
                    }}
                  />
                </>
              )}

              {estado === 'do_zero' && (
                <>
                  <BotaoDoPainel
                    principal
                    rotulo="Aprovar texto do atendente"
                    onClick={() => aprovar(rascunho.trim(), 'atendente')}
                    desabilitado={rascunho.trim().length === 0}
                  />
                  <BotaoDoPainel
                    rotulo="Voltar à proposta do copiloto"
                    onClick={() => setEstado('proposta')}
                  />
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </Moldura>
  );
}

function Moldura({
  titulo,
  aoFechar,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {titulo}
        </span>
        <button
          onClick={aoFechar}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-800"
        >
          Voltar à conversa
        </button>
      </div>
      {children}
    </div>
  );
}

function BotaoDoPainel({
  rotulo,
  onClick,
  principal,
  desabilitado,
}: {
  rotulo: string;
  onClick: () => void;
  principal?: boolean;
  desabilitado?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      className={`rounded border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
        principal
          ? 'border-slate-800 bg-slate-800 text-white hover:bg-slate-700'
          : 'border-slate-300 text-slate-700 hover:border-slate-800'
      }`}
    >
      {rotulo}
    </button>
  );
}
