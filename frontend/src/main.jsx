import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { BelongingsProvider } from './context/BelongingsContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <BelongingsProvider>
          <App />
        </BelongingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)