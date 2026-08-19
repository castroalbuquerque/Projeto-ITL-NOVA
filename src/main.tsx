import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { conferenciaDeCadastro, PASSAGEIROS, VIAGENS } from './dados.ts'

// Etapa 1: conferência de cadastro no console.
console.log(`${PASSAGEIROS.length} passageiros, ${VIAGENS.length} viagens`)
console.table(conferenciaDeCadastro())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
