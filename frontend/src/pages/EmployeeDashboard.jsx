import { useEffect, useState } from 'react'
import { api, getSession } from '../api'
import Navbar from '../components/Navbar'
import { MeatPattern, SteakIcon, BoneIcon, SausageIcon } from '../components/MeatIcons'

const ESTADO_LABEL = {
  pendiente: '⏳ Pendiente',
  aprobada: '✅ Aprobada',
  rechazada: '❌ Rechazada',
}

export default function EmployeeDashboard({ onLogout }) {
  const session = getSession()
  const [dash, setDash] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '', motivo: '' })
  const [msg, setMsg] = useState(null)
  const [sending, setSending] = useState(false)

  const load = () => {
    api.myDashboard().then(setDash).catch(() => {})
    api.myRequests().then(setRequests).catch(() => {})
  }

  useEffect(load, [])

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setSending(true)
    try {
      await api.createRequest(form)
      setMsg({ type: 'ok', text: 'Solicitud enviada. RR.HH. la revisará pronto. 🥩' })
      setForm({ fecha_inicio: '', fecha_fin: '', motivo: '' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="dashboard">
      <MeatPattern />
      <Navbar nombre={session?.nombre_completo} rol="empleado" onLogout={onLogout} />

      <main className="container">
        {dash && (
          <>
            <section className="hero animate-pop">
              <div>
                <h2>¡Hola, {dash.nombre_completo.split(' ')[0]}! 👋</h2>
                <p>
                  Área <strong>{dash.area}</strong> · En FRIGOR desde el{' '}
                  <strong>{new Date(dash.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-BO')}</strong>{' '}
                  ({dash.meses_trabajados} meses)
                </p>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card stat-red animate-up" style={{ animationDelay: '0ms' }}>
                <SteakIcon size={34} />
                <span className="stat-value">{dash.saldo}</span>
                <span className="stat-label">Días disponibles</span>
              </div>
              <div className="stat-card animate-up" style={{ animationDelay: '80ms' }}>
                <BoneIcon size={34} />
                <span className="stat-value">{dash.dias_acumulados}</span>
                <span className="stat-label">Días acumulados</span>
                <small>{dash.meses_trabajados} meses × 1.25</small>
              </div>
              <div className="stat-card animate-up" style={{ animationDelay: '160ms' }}>
                <SausageIcon size={34} />
                <span className="stat-value">{dash.dias_usados}</span>
                <span className="stat-label">Días usados</span>
              </div>
            </section>
          </>
        )}

        <div className="two-cols">
          <section className="card animate-up" style={{ animationDelay: '240ms' }}>
            <h3>🏖️ Solicitar vacaciones</h3>
            <form onSubmit={submit} className="request-form">
              <label>
                Desde
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  required
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  required
                />
              </label>
              <label>
                Motivo (opcional)
                <textarea
                  rows={2}
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Viaje familiar, descanso…"
                />
              </label>
              {msg && (
                <div className={`alert ${msg.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>
                  {msg.text}
                </div>
              )}
              <button className="btn btn-primary" disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </form>
          </section>

          <section className="card animate-up" style={{ animationDelay: '320ms' }}>
            <h3>📜 Mi historial</h3>
            {requests.length === 0 && <p className="muted">Aún no tienes solicitudes.</p>}
            <ul className="history">
              {requests.map((r) => (
                <li key={r.id} className={`history-item estado-${r.estado}`}>
                  <div>
                    <strong>
                      {new Date(r.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO')} —{' '}
                      {new Date(r.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO')}
                    </strong>
                    <span className="history-days">{r.dias_solicitados} días</span>
                  </div>
                  {r.motivo && <p className="muted">{r.motivo}</p>}
                  {r.comentario_admin && (
                    <p className="muted">RR.HH.: {r.comentario_admin}</p>
                  )}
                  <span className={`badge badge-${r.estado}`}>{ESTADO_LABEL[r.estado]}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
