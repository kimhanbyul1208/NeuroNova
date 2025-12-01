import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@egjs/react-view3d/css/view3d-bundle.min.css";
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
