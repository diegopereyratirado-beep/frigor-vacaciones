import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setSession } from '../api'
import Logo from '../components/Logo'
import { MeatPattern, SteakIcon } from '../components/MeatIcons'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await api.login(username, password)
      setSession(session)
      navigate(session.role === 'admin' ? '/admin' : '/empleado')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <MeatPattern />
      <div className="login-card animate-pop">
        <Logo width={260} />
        <h1>Control de Vacaciones</h1>
        <p className="login-subtitle">Planta fija · 1.25 días por mes trabajado</p>

        <form onSubmit={submit}>
          <label>
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej. carlosmendoza"
              autoFocus
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              required
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
            <span className="btn-icon">
              <SteakIcon size={22} />
            </span>
          </button>
        </form>

        <footer className="login-footer">
          FRIGOR S.A. · Santa Cruz, Bolivia · <strong>#CarneEsFRIGOR</strong>
        </footer>
      </div>
    </div>
  )
}
