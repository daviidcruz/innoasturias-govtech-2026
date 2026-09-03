import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Los estados ocultos de los revelados sólo se aplican si hay JS: sin él la
// página se lee entera.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')).render(<App />)
