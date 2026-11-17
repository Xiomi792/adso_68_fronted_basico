import { useState } from 'react'
import { register } from '../services/registerService.js'

const Register = ({ onSuccess, onLoginClick }) => {
  const [usuarioRegistro, setUsuarioRegistro] = useState('')
  const [claveRegistro, setClaveRegistro] = useState('')
  const [mensajeRegistro, setMensajeRegistro] = useState('')

  const shouldContinue = (message = '') => {
    const normalized = String(message).toLowerCase()
    return !(normalized.includes('error') || normalized.includes('ya existe') || normalized.includes('fallo'))
  }

  const onSubmitRegistro = async (e) => {
    e.preventDefault()

    const data = await register(usuarioRegistro, claveRegistro)
    setMensajeRegistro(data.message)

    if (shouldContinue(data.message)) {
      onSuccess?.()
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Nuevo usuario</p>
        <h2>Registrarse</h2>
      </div>

      <form className="auth-form" onSubmit={onSubmitRegistro}>
        <label>
          Usuario
          <input
            type="text"
            name="usuario"
            id="usuario"
            placeholder="Usuario"
            value={usuarioRegistro}
            onChange={(e) => setUsuarioRegistro(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            name="clave"
            id="clave"
            placeholder="Contraseña"
            value={claveRegistro}
            onChange={(e) => setClaveRegistro(e.target.value)}
          />
        </label>

        <button type="submit" className="primary-button">
          Registrarse
        </button>
      </form>

      <p className="auth-message">{mensajeRegistro}</p>

      <button type="button" className="link-button" onClick={onLoginClick}>
        Ya tengo una cuenta
      </button>
    </div>
  )
}

export { Register }
