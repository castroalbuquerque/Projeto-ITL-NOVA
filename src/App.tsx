import { PASSAGEIROS, VIAGENS, etiquetaDeGrupo, passageiroPorId } from './dados'

// Etapa 1 — só a conferência dos dados. A interface de três colunas é a Etapa 3.
function App() {
  return (
    <main className="mx-auto max-w-4xl p-8 font-sans text-slate-800">
      <h1 className="text-2xl font-semibold">Central de Transparência</h1>
      <p className="mt-1 text-sm text-slate-500">
        Etapa 1 — {PASSAGEIROS.length} passageiros e {VIAGENS.length} viagens carregados.
        Conferência completa no console.
      </p>

      <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        {PASSAGEIROS.map((p) => (
          <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
            <span className="w-28 font-medium">{p.nome}</span>
            <span className="w-64 text-sm text-slate-500">{etiquetaDeGrupo(p)}</span>
            <span className="text-sm">{p.temContato ? 'tem contato' : 'sem contato'}</span>
            <span className="text-sm text-slate-500">
              {p.consentimentoMarketing ? 'autorizou' : 'não autorizou'}
            </span>
          </li>
        ))}
      </ul>

      <ul className="mt-6 space-y-1 text-sm text-slate-600">
        {VIAGENS.map((v) => (
          <li key={v.id}>
            <span className="font-medium text-slate-800">{v.linha}</span> · {v.partida} ·
            plataforma {v.plataforma} · R$ {v.valorPassagem} ·{' '}
            {v.passageiroIds.map((id) => passageiroPorId(id).nome).join(', ')}
            {v.cargaDeFundo.length > 0 &&
              ` + ${v.cargaDeFundo.reduce((s, f) => s + f.pessoas, 0)} de fundo`}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
