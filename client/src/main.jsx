import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AddPage from './pages/AddPage.jsx'
import MobileCollectionsPage from './pages/MobileCollectionsPage.jsx'
import PasswordGate from './features/shared/PasswordGate.jsx'

const PATH_TO_TAB = {
  '/mobile':   'Library',
  '/library':  'Library',
  '/chat':     'Chat',
  '/search':   'Search',
}

const path = window.location.pathname
const mobileTab = PATH_TO_TAB[path]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PasswordGate>
      {path === '/add'    ? <AddPage />
        : mobileTab       ? <MobileCollectionsPage initialTab={mobileTab} />
        : <App />}
    </PasswordGate>
  </StrictMode>,
)
