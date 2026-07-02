import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../constants'
import { setStoredToken } from '../utils/auth'
import './AuthPages.css'

export default function LoginPage({ token, setToken, setStatus }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', id_card_last3: '' })

  useEffect(() => {
    if (token) {
      navigate('/profile')
    }
  }, [token, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '登入失敗')
      return
    }

    setStoredToken(result.access_token)
    setToken(result.access_token)
    setStatus('登入成功')
    navigate('/profile')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>🔐 會員登入</h2>
          <p>登入以管理你的羽球資料</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">帳號</label>
            <input
              id="username"
              type="text"
              placeholder="請輸入帳號"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="id_card">身分證後三碼</label>
            <input
              id="id_card"
              type="text"
              placeholder="請輸入身分證後三碼"
              maxLength="3"
              value={form.id_card_last3}
              onChange={(event) => setForm({ ...form, id_card_last3: event.target.value })}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="form-submit-btn">
            登入
          </button>
        </form>

        <div className="auth-footer">
          還不是會員？
          <a href="/register" className="auth-link">立即註冊</a>
        </div>
      </div>
    </div>
  )
}
