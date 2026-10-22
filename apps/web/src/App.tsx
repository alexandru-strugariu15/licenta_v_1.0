import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { useAppStore } from './store/appStore'
import './index.css'

function App() {
  const { isAuthenticated, hasCompletedOnboarding } = useAppStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/auth" replace />
            ) : !hasCompletedOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <AppShell />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
