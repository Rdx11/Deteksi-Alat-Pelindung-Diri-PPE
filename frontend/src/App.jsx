/**
 * Main App Component dengan routing
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DetectImagePage from './pages/DetectImagePage'
import DetectVideoPage from './pages/DetectVideoPage'
import DetectLivePage from './pages/DetectLivePage'
import SessionsPage from './pages/SessionsPage'
import AlertsPage from './pages/AlertsPage'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="detect/image" element={<DetectImagePage />} />
        <Route path="detect/video" element={<DetectVideoPage />} />
        <Route path="detect/live" element={<DetectLivePage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
  )
}

export default App
