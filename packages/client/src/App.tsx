import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from '#/hooks/useAuth'
import GamePage from '#/pages/GamePage'
import HomePage from '#/pages/HomePage'
import LoginPage from '#/pages/LoginPage'
import OAuthCallbackPage from '#/pages/OAuthCallbackPage'

function App() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 w-full">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameUri" element={<GamePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
          </Routes>
        </AuthProvider>
      </div>
    </div>
  )
}

export default App
