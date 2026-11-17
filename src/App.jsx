import { useState } from 'react'
import './App.css'
import { InventoryCafe } from './components/InventoryCafe.jsx'
import { Login } from './components/Login.jsx'
import { Register } from './components/Register.jsx'

function App() {
  const [view, setView] = useState('login')

  const renderView = () => {
    if (view === 'register') {
      return <Register onSuccess={() => setView('inventario')} onLoginClick={() => setView('login')} />
    }

    if (view === 'inventario') {
      return <InventoryCafe onBack={() => setView('login')} />
    }

    return <Login onSuccess={() => setView('inventario')} onRegisterClick={() => setView('register')} />
  }

  return <div className="app-shell">{renderView()}</div>
}

export default App
