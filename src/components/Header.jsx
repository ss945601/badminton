import { NavLink } from 'react-router-dom'
import './Header.css'

export default function Header({ token, onLogout }) {
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
