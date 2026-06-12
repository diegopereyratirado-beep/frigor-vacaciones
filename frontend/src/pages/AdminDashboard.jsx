import { useEffect, useRef, useState } from 'react'
import { api, getSession } from '../api'
import Navbar from '../components/Navbar'
import { MeatPattern } from '../components/MeatIcons'

export default function AdminDashboard({ onLogout }) {
  const session = getSession()
  const [tab, setTab] = useState('solicitudes')
  const [employees, setEmployees] = useState([])
  const [areas, setAreas] = useState([])
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [requests, setRequests] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('pendiente')
  const [msg, setMsg] = useState(null)
  const [nuevo, setNuevo] = useState({
    nombre: '',
    apellido: '',
    area: 'Producción',
    fecha_ingreso: '',
    dias_usados: 0,
  })
  const [credenciales, setCredenciales] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef(null)

  const loadEmployees = () => api.employees(q, area).then(setEmployees).catch(() => {})
  const loadRequests = () =>
    api.allRequests(filtroEstado || undefined).then(setRequests).catch(() => {})

  useEffect(() => {
    api.areas().then(setAreas).catch(() => {})
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [q, area])

  useEffect(() => {
    loadRequests()
  }, [filtroEstado])

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const [resolviendo, setResolviendo] = useState(null) // { req, accion }
  const [comentario, setComentario] = useState('')

  const abrirResolucion = (req, accion) => {
    setComentario('')
    setResolviendo({ req, accion })
  }

  const confirmarResolucion = async () => {
    const { req, accion } = resolviendo
    try {
      if (accion === 'approve') await api.approve(req.id, comentario || null)
      else await api.reject(req.id, comentario || null)
      flash('ok', accion === 'approve' ? 'Solicitud aprobada ✅' : 'Solicitud rechazada ❌')
      setResolviendo(null)
      loadRequests()
      loadEmployees()
    } catch (err) {
      flash('error', err.message)
      setResolviendo(null)
    }
  }

  const crearEmpleado = async (e) => {
    e.preventDefault()
    try {
      const res = await api.createEmployee(nuevo)
      setCredenciales(res)
      setNuevo({ nombre: '', apellido: '', area: 'Producción', fecha_ingreso: '', dias_usados: 0 })
      loadEmployees()
      flash('ok', `Empleado creado. Usuario: ${res.username}`)
    } catch (err) {
      flash('error', err.message)
    }
  }

  const importar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await api.importExcel(file)
      setImportResult(res)
      loadEmployees()
      flash('ok', `${res.importados} empleados importados`)
    } catch (err) {
      flash('error', err.message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const pendientes = requests.filter((r) => r.estado === 'pendiente').length

  return (
    <div className="dashboard">
      <MeatPattern />
      <Navbar nombre="RR.HH. FRIGOR" rol="admin" onLogout={onLogout} />

      <main className="container">
        {msg && (
          <div className={`alert sticky ${msg.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>
            {msg.text}
          </div>
        )}

        <nav className="tabs">
          <button
            className={tab === 'solicitudes' ? 'tab active' : 'tab'}
            onClick={() => setTab('solicitudes')}
          >
            📋 Solicitudes {pendientes > 0 && <span className="tab-badge">{pendientes}</span>}
          </button>
          <button
            className={tab === 'empleados' ? 'tab active' : 'tab'}
            onClick={() => setTab('empleados')}
          >
            👥 Empleados
          </button>
          <button
            className={tab === 'agregar' ? 'tab active' : 'tab'}
            onClick={() => setTab('agregar')}
          >
            ➕ Agregar / Importar
          </button>
        </nav>

        {tab === 'solicitudes' && (
          <section className="card animate-pop">
            <div className="card-head">
              <h3>Solicitudes de vacaciones</h3>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todas</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
            {requests.length === 0 && <p className="muted">No hay solicitudes.</p>}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Área</th>
                    <th>Fechas</th>
                    <th>Días</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.empleado}</td>
                      <td>{r.area}</td>
                      <td>
                        {new Date(r.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO')} —{' '}
                        {new Date(r.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO')}
                      </td>
                      <td>{r.dias_solicitados}</td>
                      <td className="muted">{r.motivo || '—'}</td>
                      <td>
                        <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                      </td>
                      <td>
                        {r.estado === 'pendiente' && (
                          <div className="row-actions">
                            <button
                              className="btn btn-ok btn-sm"
                              onClick={() => abrirResolucion(r, 'approve')}
                            >
                              Aprobar
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => abrirResolucion(r, 'reject')}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'empleados' && (
          <section className="card animate-pop">
            <div className="card-head">
              <h3>Empleados de planta</h3>
              <div className="filters">
                <input
                  placeholder="🔍 Buscar por nombre…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Todas las áreas</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Área</th>
                    <th>Ingreso</th>
                    <th>Meses</th>
                    <th>Acumulados</th>
                    <th>Usados</th>
                    <th>Saldo</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>
                          {e.nombre} {e.apellido}
                        </strong>
                        {e.solicitudes_pendientes > 0 && (
                          <span className="dot-alert" title="Tiene solicitudes pendientes" />
                        )}
                      </td>
                      <td>
                        <span className="chip">{e.area}</span>
                      </td>
                      <td>{new Date(e.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-BO')}</td>
                      <td>{e.meses_trabajados}</td>
                      <td>{e.dias_acumulados}</td>
                      <td>{e.dias_usados}</td>
                      <td>
                        <strong className={e.saldo < 5 ? 'saldo-bajo' : 'saldo-ok'}>
                          {e.saldo}
                        </strong>
                      </td>
                      <td className="muted">{e.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'agregar' && (
          <div className="two-cols">
            <section className="card animate-pop">
              <h3>➕ Agregar empleado</h3>
              <form onSubmit={crearEmpleado} className="request-form">
                <div className="form-row">
                  <label>
                    Nombre
                    <input
                      value={nuevo.nombre}
                      onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Apellido
                    <input
                      value={nuevo.apellido}
                      onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Área
                    <select
                      value={nuevo.area}
                      onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })}
                    >
                      {areas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha de ingreso
                    <input
                      type="date"
                      value={nuevo.fecha_ingreso}
                      onChange={(e) => setNuevo({ ...nuevo, fecha_ingreso: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <label>
                  Días ya usados
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={nuevo.dias_usados}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, dias_usados: parseFloat(e.target.value) || 0 })
                    }
                  />
                </label>
                <button className="btn btn-primary">Crear empleado</button>
              </form>

              {credenciales && (
                <div className="alert alert-ok credentials">
                  <strong>Credenciales generadas:</strong>
                  <br />
                  Usuario: <code>{credenciales.username}</code> · Contraseña:{' '}
                  <code>{credenciales.password_inicial}</code>
                </div>
              )}
            </section>

            <section className="card animate-pop">
              <h3>📥 Importar desde Excel</h3>
              <p className="muted">
                Archivo <strong>.xlsx</strong> con columnas: <code>Nombre</code>,{' '}
                <code>Área</code>, <code>FechaIngreso</code> (AAAA-MM-DD),{' '}
                <code>DíasUsados</code>.
              </p>
              <input ref={fileRef} type="file" accept=".xlsx" onChange={importar} />

              {importResult && (
                <div className="import-result">
                  <p>
                    ✅ <strong>{importResult.importados}</strong> empleados importados
                  </p>
                  {importResult.errores.length > 0 && (
                    <details>
                      <summary>⚠️ {importResult.errores.length} errores</summary>
                      <ul>
                        {importResult.errores.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {importResult.credenciales.length > 0 && (
                    <details open>
                      <summary>🔑 Credenciales generadas</summary>
                      <ul>
                        {importResult.credenciales.map((c, i) => (
                          <li key={i}>
                            {c.empleado}: <code>{c.usuario}</code> / <code>{c['contraseña']}</code>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {resolviendo && (
        <div className="modal-overlay" onClick={() => setResolviendo(null)}>
          <div className="modal animate-pop" onClick={(e) => e.stopPropagation()}>
            <h3>
              {resolviendo.accion === 'approve' ? '✅ Aprobar solicitud' : '❌ Rechazar solicitud'}
            </h3>
            <p className="muted">
              {resolviendo.req.empleado} · {resolviendo.req.dias_solicitados} días (
              {new Date(resolviendo.req.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO')} —{' '}
              {new Date(resolviendo.req.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO')})
            </p>
            <label>
              {resolviendo.accion === 'approve'
                ? 'Comentario para el empleado (opcional)'
                : 'Motivo del rechazo (opcional)'}
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setResolviendo(null)}>
                Cancelar
              </button>
              <button
                className={`btn ${resolviendo.accion === 'approve' ? 'btn-ok' : 'btn-danger'}`}
                onClick={confirmarResolucion}
              >
                {resolviendo.accion === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
