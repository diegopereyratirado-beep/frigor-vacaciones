import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import Logo from './Logo'

export default function Navbar({ nombre, rol, onLogout }) {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const unread = notifs.filter((n) => !n.leida).length

  const load = () => api.notifications().then(setNotifs).catch(() => {})

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      api.markAllRead().then(load).catch(() => {})
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Logo width={130} tagline={false} />
        <div className="navbar-title">
          <strong>Control de Vacaciones</strong>
          <span>#CarneEsFRIGOR</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="bell-wrap" ref={panelRef}>
          <button className={`bell ${unread ? 'bell-alert' : ''}`} onClick={toggle} title="Notificaciones">
            🔔
            {unread > 0 && <span className="bell-badge">{unread}</span>}
          </button>
          {open && (
            <div className="notif-panel">
              <h4>Notificaciones</h4>
              {notifs.length === 0 && <p className="notif-empty">Sin notificaciones</p>}
              {notifs.map((n) => (
                <div key={n.id} className={`notif-item notif-${n.tipo}`}>
                  <p>{n.mensaje}</p>
                  <time>{new Date(n.created_at).toLocaleString('es-BO')}</time>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-name">{nombre}</span>
          <span className="user-role">{rol === 'admin' ? 'RR.HH. · Admin' : 'Empleado'}</span>
        </div>
        <button className="btn btn-outline" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  )
}
