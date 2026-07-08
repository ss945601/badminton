import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { API_BASE_URL } from '../constants'
import './Header.css'

export default function Header({ token, onLogout }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (token) {
      fetchUserProfile()
    } else {
      setIsAdmin(false)
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/member/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.is_admin || false)
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error)
    }
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand">
          <div className="logo-icon">🏸</div>
          <div className="brand-text">
            <span className="brand-subtitle">Latticework</span>
            <h1 className="brand-title">羽球社</h1>
          </div>
        </div>
        
        <nav className="main-nav" aria-label="主導覽">
          <NavLink to="/" end className="nav-link">
            <span className="nav-icon">🏠</span>
            首頁
          </NavLink>
          <NavLink to="/members" className="nav-link">
            <span className="nav-icon">👥</span>
            會員總覽
          </NavLink>
          <NavLink to="/messages" className="nav-link">
            <span className="nav-icon">💬</span>
            留言板
          </NavLink>
          {!token ? (
            <>
              <NavLink to="/register" className="nav-link nav-link-primary">
                註冊
              </NavLink>
              <NavLink to="/login" className="nav-link nav-link-secondary">
                登入
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/profile" className="nav-link">
                <span className="nav-icon">⚙️</span>
                會員資料
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="nav-link nav-link-admin">
                  <span className="nav-icon">🔧</span>
                  管理者
                </NavLink>
              )}
              <button className="nav-link nav-link-logout" onClick={onLogout}>
                登出
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
