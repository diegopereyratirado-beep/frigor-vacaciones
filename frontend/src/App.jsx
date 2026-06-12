import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { getSession, clearSession } from './api'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import AdminDashboard from './pages/AdminDashboard'

function Protected({ role, children }) {
  const session = getSession()
  if (!session) return <Navigate to="/" replace />
  if (role && session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/empleado'} replace />
  }
  return children
}

export default function App() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/empleado"
        element={
          <Protected role="empleado">
            <EmployeeDashboard onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminDashboard onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
