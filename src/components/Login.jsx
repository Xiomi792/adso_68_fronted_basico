import { useState } from 'react'
import { login } from '../services/loginService.js'

const Login = ({ onSuccess, onRegisterClick }) => {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [mensaje, setMensaje] = useState('')

  const shouldContinue = (message = '') => {
    const normalized = String(message).toLowerCase()
    return !(normalized.includes('error') || normalized.includes('incorrect') || normalized.includes('no existe'))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    const data = await login(usuario, clave)
    setMensaje(data.message)

    if (shouldContinue(data.message)) {
      onSuccess?.()
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Bienvenido</p>
        <h2>Iniciar sesión</h2>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Usuario
          <input
            type="text"
            name="usuario"
            id="usuario"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            name="clave"
            id="clave"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </label>

        <button type="submit" className="primary-button">
          Iniciar sesión
        </button>
      </form>

      <p className="auth-message">{mensaje}</p>

      <button type="button" className="link-button" onClick={onRegisterClick}>
        ¿No tienes cuenta? Regístrate
      </button>
    </div>
  )
}

export { Login }
