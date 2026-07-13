import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/ToastContainer'
import AIAssistantWidget from './layouts/AIAssistantWidget'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer />
      <AIAssistantWidget />
    </AuthProvider>
  )
}

export default App