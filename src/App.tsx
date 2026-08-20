import { useMemo, useState } from 'react';
import { PASSAGEIROS, VIAGENS, passageiroPorId, type Viagem } from './dados';
import { AVISO_DE_EXEMPLO, CASO_ABERTO_CARLOS, LOTE, resumoDoLote } from './dadosV2';
import { decidir, resumoDaOcorrencia, type Gatilho, type Historico } from './motor';
import { Conversa, hora, rotuloDoGatilho, type Evento } from './ui/Conversa';
import { Etiqueta } from './ui/Etiqueta';
import { QuadroDeHonestidade } from './ui/Honestidade';
import { Inspetor } from './ui/Inspetor';
import { Metricas } from './ui/Metricas';
import { Copiloto } from './ui/Copiloto';
import { PainelDoLote } from './ui/Lote';
import { FilaDeCasos, Pesquisa, casosDe, type Caso } from './ui/PosViagem';

const OCORRENCIAS = [
  { id: 'atraso', rotulo: 'Atraso longo', minutos: 80 },
  { id: 'quebra', rotulo: 'Quebra de veículo', minutos: 45 },
  { id: 'mudanca_plataforma', rotulo: 'Mudança de plataforma', minutos: 0 },
  { id: 'cancelamento', rotulo: 'Cancelamento', minutos: 120 },
] as const;

const GATILHOS_DE_PESSOA = [
  { tipo: 'winback', rotulo: 'Win-back' },
  { tipo: 'marco', rotulo: 'Marco' },
  { tipo: 'padrao', rotulo: 'Padrão de não embarque' },
] as const;

export default function App() {
  const [viagemId, setViagemId] = useState<string>(VIAGENS[0].id);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [alvoId, setAlvoId] = useState<string>('p-09');
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [modoIA, setModoIA] = useState(false);
  const [casoAberto, setCasoAberto] = useState<string | null>(null);
  const [loteAberto, setLoteAberto] = useState(false);
  const [loteAprovado, setLoteAprovado] = useState(false);
  const [notas, setNotas] = useState<Record<string, number>>({});

  const viagem = VIAGENS.find((v) => v.id === viagemId)!;

  /** Mensagens já enviadas por passageiro nesta viagem — é o que alimenta o B2. */
  const historico = useMemo<Historico>(() => {
    const h: Historico = {};
    for (const e of eventos) {
      if (e.viagem?.id !== viagemId) continue;
      for (const d of e.decisoes) h[d.passageiroId] = (h[d.passageiroId] ?? 0) + d.canais.length;
    }
    return h;
  }, [eventos, viagemId]);

  function dispararOcorrencia(o: (typeof OCORRENCIAS)[number]) {
    const gatilho: Gatilho = {
      tipo: 'ocorrencia',
      ocorrencia: o.id,
      minutosImpacto: o.minutos,
      viagemId,
    };
    const decisoes = decidir(gatilho, viagem, PASSAGEIROS, historico);
    setEventos((atuais) => [...atuais, { gatilho, viagem, decisoes }]);
    if (!selecionadoId) setSelecionadoId(decisoes[0]?.passageiroId ?? null);
  }

  function dispararPessoal(tipo: 'winback' | 'marco' | 'padrao') {
    const p = passageiroPorId(alvoId);
    const gatilho: Gatilho =
      tipo === 'padrao'
        ? { tipo, passageiroId: p.id, passagensNaoUsadas: p.passagensNaoUsadas }
        : { tipo, passageiroId: p.id };
    const decisoes = decidir(gatilho, null, PASSAGEIROS, {});
    setEventos((atuais) => [...atuais, { gatilho, viagem: null, decisoes }]);
    setSelecionadoId(p.id);
  }

  /** Última ocorrência disparada em cada viagem: é o que rotula o caso na fila. */
  const ocorrenciaPorViagem = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of eventos) {
      if (e.viagem && e.gatilho.tipo === 'ocorrencia') m[e.viagem.id] = rotuloDoGatilho(e.gatilho);
    }
    return m;
  }, [eventos]);

  /**
   * A reclamação do Carlos, aberta há seis meses e nunca respondida, já está na
   * fila antes de qualquer pesquisa: é a regra da v1 de que caso antigo sem
   * solução fura a fila (seção 4.3 da spec v2).
   */
  const casos = useMemo<Caso[]>(
    () => [
      {
        passageiroId: CASO_ABERTO_CARLOS.passageiroId,
        titulo: CASO_ABERTO_CARLOS.titulo,
        ocorrencia: CASO_ABERTO_CARLOS.ocorrencia,
        prazoHoras: CASO_ABERTO_CARLOS.prazoHoras,
        prioridade: CASO_ABERTO_CARLOS.prioridade,
      },
      ...casosDe(notas, ocorrenciaPorViagem),
    ],
    [notas, ocorrenciaPorViagem],
  );

  const ultimo = eventos[eventos.length - 1];
  const resumo = ultimo
    ? resumoDaOcorrencia(
        ultimo.gatilho,
        ultimo.viagem,
        PASSAGEIROS,
        ultimo.gatilho.tipo === 'ocorrencia' ? historicoAntesDe(eventos, ultimo, viagemId) : {},
      )
    : null;

  // Lote aprovado alimenta a tela de números da v1 com os números do lote.
  const doLote = loteAprovado ? resumoDoLote() : null;
  const resumoNaTela = doLote?.resumo ?? resumo;
  const pessoasNaTela = doLote?.pessoas ?? ultimo?.decisoes.length ?? 0;

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-800">
      <header className="flex flex-wrap items-baseline gap-3 border-b border-slate-300 bg-white px-4 py-2">
        <h1 className="font-semibold">Central de Transparência</h1>
        <span className="text-xs text-slate-500">
          protótipo · dados inventados · nenhuma mensagem é enviada de fato · textos de IA gerados
          antes da apresentação
        </span>
        <span className="ml-auto">
          <QuadroDeHonestidade />
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[17rem_1fr_22rem]">
        {/* ---------- seletor ---------- */}
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-slate-300 bg-white">
          <section className="px-4 py-3">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Viagem
            </h2>
            <div className="space-y-1">
              {VIAGENS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViagemId(v.id)}
                  className={`w-full rounded border px-2 py-1.5 text-left text-xs ${
                    v.id === viagemId
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="font-medium">{v.linha}</div>
                  <div className={v.id === viagemId ? 'text-slate-300' : 'text-slate-500'}>
                    {hora(v.partida)} · plataforma {v.plataforma} · {nomes(v)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 px-4 py-3">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Ocorrência na viagem
            </h2>
            <div className="space-y-1">
              {OCORRENCIAS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => dispararOcorrencia(o)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:border-slate-800 hover:bg-slate-50"
                >
                  {o.rotulo}
                  {o.minutos > 0 && <span className="text-slate-400"> · {o.minutos} min</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 px-4 py-3">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Orquestrador (v2)
            </h2>
            <button
              onClick={() => {
                setLoteAberto(true);
                setCasoAberto(null);
              }}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:border-slate-800 hover:bg-slate-50"
            >
              Painel do lote
              <span className="text-slate-400"> · {LOTE.passageiros} passageiros</span>
            </button>
          </section>

          <section className="border-t border-slate-200 px-4 py-3">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Gatilho de pessoa
            </h2>
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
            >
              {PASSAGEIROS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.grupo === null ? 'fora dos conjuntos' : `grupo ${p.grupo}`}
                </option>
              ))}
            </select>
            <div className="mb-2">
              <Etiqueta p={passageiroPorId(alvoId)} />
            </div>
            <div className="space-y-1">
              {GATILHOS_DE_PESSOA.map((g) => (
                <button
                  key={g.tipo}
                  onClick={() => dispararPessoal(g.tipo)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:border-slate-800 hover:bg-slate-50"
                >
                  {g.rotulo}
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 px-4 py-3">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Depois da viagem
            </h2>
            <button
              onClick={() =>
                setConcluidas((atuais) =>
                  atuais.includes(viagemId) ? atuais : [...atuais, viagemId],
                )
              }
              disabled={concluidas.includes(viagemId)}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:border-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
            >
              {concluidas.includes(viagemId) ? 'Viagem concluída' : 'Concluir viagem'}
            </button>
          </section>

          {(eventos.length > 0 || concluidas.length > 0) && (
            <section className="border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => {
                  setEventos([]);
                  setConcluidas([]);
                  setNotas({});
                  setSelecionadoId(null);
                  setLoteAprovado(false);
                }}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:border-slate-800"
              >
                Resetar
              </button>
            </section>
          )}
        </aside>

        {/* ---------- conversa ---------- */}
        <main className="min-h-0 overflow-y-auto bg-slate-50">
          {loteAberto ? (
            <PainelDoLote
              aprovado={loteAprovado}
              aoAprovar={() => setLoteAprovado(true)}
              aoFechar={() => setLoteAberto(false)}
            />
          ) : casoAberto ? (
            <Copiloto passageiroId={casoAberto} aoFechar={() => setCasoAberto(null)} />
          ) : (
            <>
              <SeletorDeRedacao modoIA={modoIA} aoTrocar={setModoIA} />
              <Conversa
                eventos={eventos}
                selecionadoId={selecionadoId}
                aoSelecionar={setSelecionadoId}
                modoIA={modoIA}
              />
              {concluidas.map((id) => {
                const v = VIAGENS.find((x) => x.id === id)!;
                return (
                  <Pesquisa
                    key={id}
                    viagem={v}
                    alvos={v.passageiroIds.map(passageiroPorId)}
                    notas={notas}
                    aoResponder={(passageiroId, nota) =>
                      setNotas((atuais) => ({ ...atuais, [`${id}:${passageiroId}`]: nota }))
                    }
                  />
                );
              })}
            </>
          )}
        </main>

        {/* ---------- inspetor e números ---------- */}
        <aside className="flex min-h-0 flex-col overflow-y-auto border-l border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-4 py-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              O canhoto da decisão
            </span>
            {ultimo && (
              <span className="ml-2 text-xs text-slate-400">
                último: {rotuloDoGatilho(ultimo.gatilho)}
              </span>
            )}
          </div>
          {/* Sem flex-1: o canhoto cresce com o conteúdo e a coluna inteira rola.
              Com altura fixa ele transbordava por cima dos números da ocorrência
              assim que o lote aprovado e o bloco de redação entraram na tela. */}
          <div className="shrink-0">
            <Inspetor eventos={eventos} selecionadoId={selecionadoId} modoIA={modoIA} />
          </div>
          {doLote && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
              Preenchida pelo lote aprovado no orquestrador · {LOTE.redacoesDescartadas} redação
              descartada pelo validador virou template · {AVISO_DE_EXEMPLO}
            </div>
          )}
          {resumoNaTela && <Metricas resumo={resumoNaTela} pessoas={pessoasNaTela} />}
          <FilaDeCasos casos={casos} aoAbrir={setCasoAberto} />
        </aside>
      </div>
    </div>
  );
}

/** Toggle da seção 3.2: a mesma ocorrência, escrita pelo template ou pelo agente. */
function SeletorDeRedacao({
  modoIA,
  aoTrocar,
}: {
  modoIA: boolean;
  aoTrocar: (v: boolean) => void;
}) {
  const opcoes = [
    { ia: false, rotulo: 'Template (v1)' },
    { ia: true, rotulo: 'Redação por IA (v2)' },
  ];
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Quem escreve
      </span>
      <div className="flex overflow-hidden rounded border border-slate-300">
        {opcoes.map((o) => (
          <button
            key={o.rotulo}
            onClick={() => aoTrocar(o.ia)}
            className={`px-2.5 py-1 text-xs ${
              o.ia === modoIA
                ? o.ia
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">
        {modoIA
          ? 'texto gerado por IA antes da apresentação e embutido aqui; o efeito de digitação é reproduzido'
          : 'texto dos modelos escritos à mão na v1'}
      </span>
    </div>
  );
}

function nomes(v: Viagem): string {
  return v.passageiroIds.map((id) => passageiroPorId(id).nome).join(', ');
}

/** Histórico como estava antes do último evento, para o resumo não contar a si mesmo. */
function historicoAntesDe(eventos: Evento[], ultimo: Evento, viagemId: string): Historico {
  const h: Historico = {};
  for (const e of eventos) {
    if (e === ultimo) break;
    if (e.viagem?.id !== viagemId) continue;
    for (const d of e.decisoes) h[d.passageiroId] = (h[d.passageiroId] ?? 0) + d.canais.length;
  }
  return h;
}
