import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/test.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <h1>PIZZA LEGENDS RPG</h1>
    <App />
    <p>[INSERT DESCRIPTION HERE]</p>

    <div className='test-pizza-container'>
      <img className='pizza' src= './src/assets/characters/pizzas/s002.png' />
      <div className='overlay' ></div>
    </div>
  </StrictMode>
)
