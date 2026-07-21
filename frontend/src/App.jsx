import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/ToastContainer'
import AIAssistantWidget from './layouts/AIAssistantWidget'
import PwaInstallPrompt from './components/PwaInstallPrompt'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer />
      <PwaInstallPrompt />
      {/* <AIAssistantWidget /> */}
    </AuthProvider>
  )
}

export default App