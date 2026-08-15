import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AddPage from './pages/AddPage.jsx'
import MobileCollectionsPage from './pages/MobileCollectionsPage.jsx'
import PasswordGate from './features/shared/PasswordGate.jsx'
import { PreviewProvider } from './hooks/usePreviewMode'

const PATH_TO_TAB = {
  '/mobile':   'Library',
  '/library':  'Library',
  '/chat':     'Chat',
  '/search':   'Search',
}

// Routes are matched relative to the deploy base (BASE_URL is '/' unless built
// with VITE_BASE_PATH), so /opennote/mobile resolves the same as /mobile.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const path = window.location.pathname.slice(BASE.length) || '/'
const mobileTab = PATH_TO_TAB[path]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PreviewProvider>
      <PasswordGate>
        {path === '/add'    ? <AddPage />
          : mobileTab       ? <MobileCollectionsPage initialTab={mobileTab} />
          : <App />}
      </PasswordGate>
    </PreviewProvider>
  </StrictMode>,
)
