import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

declare global {
  interface Window { __SNAKE_CONFIG__?: { apiBaseUrl?: string } }
}

async function bootstrap() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (res.ok) {
      const cfg = await res.json()
      window.__SNAKE_CONFIG__ = cfg
    }
  } catch {}
  createRoot(document.getElementById('root')!).render(
    <App />
  )
}

bootstrap()
