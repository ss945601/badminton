import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import StatusBanner from './components/StatusBanner'
import HomePage from './components/HomePage'
import RegisterPage from './components/RegisterPage'
import LoginPage from './components/LoginPage'
import MembersPage from './components/MembersPage'
import MessagesPage from './components/MessagesPage'
import ProfilePage from './components/ProfilePage'
import AdminPage from './components/AdminPage'
import { getStoredToken, clearStoredToken } from './utils/auth'
import './App.css'

function App() {
  const [token, setToken] = useState(getStoredToken)
  const [status, setStatus] = useState('')

  const handleLogout = () => {
    clearStoredToken()
    setToken('')
    setStatus('已登出')
  }

  return (
    <div className="app">
      <Header token={token} onLogout={handleLogout} />
      
      <StatusBanner status={status} onClear={() => setStatus('')} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage token={token} />} />
          <Route path="/register" element={<RegisterPage setStatus={setStatus} />} />
          <Route
            path="/login"
            element={<LoginPage token={token} setToken={setToken} setStatus={setStatus} />}
          />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/messages" element={<MessagesPage token={token} setStatus={setStatus} />} />
          <Route
            path="/profile"
            element={<ProfilePage token={token} setStatus={setStatus} />}
          />
          <Route
            path="/admin"
            element={<AdminPage token={token} setStatus={setStatus} />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
