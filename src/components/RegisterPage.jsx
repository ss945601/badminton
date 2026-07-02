import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../constants'
import './AuthPages.css'

export default function RegisterPage({ setStatus }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    nickname: '',
    id_card_last3: '',
    card_number: '',
    phone: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '註冊失敗')
      return
    }

    setStatus(`註冊成功，會員 ID：${result.member_id}`)
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>📝 註冊會員</h2>
          <p>加入 Latticework 羽球社，開始你的羽球之旅</p>
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
            <label htmlFor="nickname">暱稱</label>
            <input
              id="nickname"
              type="text"
              placeholder="請輸入暱稱"
              value={form.nickname}
              onChange={(event) => setForm({ ...form, nickname: event.target.value })}
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

          <div className="form-group">
            <label htmlFor="card_number">卡號（選填）</label>
            <input
              id="card_number"
              type="text"
              placeholder="請輸入卡號"
              value={form.card_number}
              onChange={(event) => setForm({ ...form, card_number: event.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">電話</label>
            <input
              id="phone"
              type="tel"
              placeholder="請輸入電話"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="form-submit-btn">
            建立帳號
          </button>
        </form>

        <div className="auth-footer">
          已經是會員了？
          <a href="/login" className="auth-link">立即登入</a>
        </div>
      </div>
    </div>
  )
}
