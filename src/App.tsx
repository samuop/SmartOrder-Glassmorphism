import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/Admin'
import AuthLayout from './layouts/Auth'

function App() {
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthLayout />} />
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/" element={<Navigate to="/admin/cotizador" replace />} />
      <Route path="*" element={<Navigate to="/admin/cotizador" replace />} />
    </Routes>
  )
}

export default App
