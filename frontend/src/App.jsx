import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/ToastContainer'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer />
    </AuthProvider>
  )
}

export default App