import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PublicMenu } from './components/PublicMenu'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.replace(/\/$/, '') === '/cardapio' ? <PublicMenu /> : <App />}
  </StrictMode>,
)
