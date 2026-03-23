import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(30, 30, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(0, 212, 255, 0.3)',
        },
      }}
    />
  </StrictMode>,
)
