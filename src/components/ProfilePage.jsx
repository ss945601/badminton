import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL, DAYS } from '../constants'
import './ProfilePage.css'

export default function ProfilePage({ token, setStatus }) {
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ 
    nickname: '', 
    card_number: '', 
    phone: '', 
    id_card_last3: '' 
  })
  const [availability, setAvailability] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  })
  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState([])
  const [leaveForm, setLeaveForm] = useState({ leave_date: '', reason: '' })
  const [editingLeaveId, setEditingLeaveId] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/member/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      
      if (!response.ok) {
        setStatus(result.detail || '載入會員資料失敗')
        setLoading(false)
        return
      }
      
      setProfile(result)
      setProfileForm({
        nickname: result.nickname || '',
        card_number: result.card_number || '',
        phone: result.phone || '',
        id_card_last3: result.id_card_last3 || '',
      })
      setAvailability(result.availability || availability)
      setLoading(false)
    }

    const fetchLeaves = async () => {
      if (!token) return
      
      const response = await fetch(`${API_BASE_URL}/api/member/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      
      if (response.ok) {
        setLeaves(result)
      }
    }

    fetchProfile()
    fetchLeaves()
  }, [token, setStatus])

  const handleProfileSave = async (event) => {
    event.preventDefault()
    const payload = {}
    if (profileForm.nickname) payload.nickname = profileForm.nickname
    if (profileForm.card_number !== undefined) payload.card_number = profileForm.card_number
    if (profileForm.phone) payload.phone = profileForm.phone
    if (profileForm.id_card_last3) payload.id_card_last3 = profileForm.id_card_last3

    const response = await fetch(`${API_BASE_URL}/api/member/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '會員資料更新失敗')
      return
    }

    setStatus(result.message)
    // Refresh profile
    const refreshResponse = await fetch(`${API_BASE_URL}/api/member/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshResult = await refreshResponse.json()
    setProfile(refreshResult)
  }

  const handleAvailabilitySave = async (event) => {
    event.preventDefault()
    const response = await fetch(`${API_BASE_URL}/api/member/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(availability),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '更新打球時間失敗')
      return
    }

    setStatus(result.message)
    // Refresh profile
    const refreshResponse = await fetch(`${API_BASE_URL}/api/member/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshResult = await refreshResponse.json()
    setProfile(refreshResult)
  }

  const handleLeaveCreate = async (event) => {
    event.preventDefault()
    if (!leaveForm.leave_date) {
      setStatus('請選擇請假日期')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/member/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leaveForm),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '新增請假失敗')
      return
    }

    setStatus('請假新增成功')
    setLeaveForm({ leave_date: '', reason: '' })
    
    // Refresh leaves
    const refreshResponse = await fetch(`${API_BASE_URL}/api/member/leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshResult = await refreshResponse.json()
    setLeaves(refreshResult)
  }

  const handleLeaveUpdate = async (leaveId) => {
    const leave = leaves.find(l => l.id === leaveId)
    if (!leave) return

    const response = await fetch(`${API_BASE_URL}/api/member/leaves/${leaveId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        leave_date: leave.leave_date,
        reason: leave.reason 
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '更新請假失敗')
      return
    }

    setStatus('請假更新成功')
    setEditingLeaveId(null)
    
    // Refresh leaves
    const refreshResponse = await fetch(`${API_BASE_URL}/api/member/leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshResult = await refreshResponse.json()
    setLeaves(refreshResult)
  }

  const handleLeaveDelete = async (leaveId) => {
    if (!confirm('確定要刪除此請假紀錄嗎？')) return

    const response = await fetch(`${API_BASE_URL}/api/member/leaves/${leaveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '刪除請假失敗')
      return
    }

    setStatus(result.message)
    
    // Refresh leaves
    const refreshResponse = await fetch(`${API_BASE_URL}/api/member/leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const refreshResult = await refreshResponse.json()
    setLeaves(refreshResult)
  }

  if (!token) {
    return (
      <div className="profile-page">
        <div className="empty-profile">
          <span className="empty-icon">🔒</span>
          <h2>請先登入</h2>
          <p>登入後即可查看與修改會員資料</p>
          <Link to="/login" className="login-btn">前往登入</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">載入中...</div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-hero">
          <div className="hero-icon">👤</div>
          <div>
            <h2>會員資料管理</h2>
            <p>更新你的個人資訊與打球時間</p>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left Column - Profile Info */}
        <div className="profile-main">
          {profile && (
            <div className="profile-card current-info">
              <div className="card-header">
                <h3>📋 目前資料</h3>
                <div className="member-badge">ID: {profile.member_id}</div>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">暱稱</span>
                  <span className="info-value">{profile.nickname}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">電話</span>
                  <span className="info-value">{profile.phone || '未填寫'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">卡號</span>
                  <span className="info-value">{profile.card_number || '未填寫'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">身分證尾碼</span>
                  <span className="info-value">{profile.id_card_last3}</span>
                </div>
              </div>
              <div className="available-days-preview">
                <span className="info-label">可打球日</span>
                <div className="days-preview">
                  {profile.available_days.length > 0 ? (
                    profile.available_days.map((day, index) => (
                      <span key={index} className="day-badge">{day}</span>
                    ))
                  ) : (
                    <span className="no-days">尚未設定</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="profile-card edit-form" onSubmit={handleProfileSave}>
            <h3>✏️ 修改個人資料</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nickname">暱稱</label>
                <input
                  id="nickname"
                  type="text"
                  placeholder="請輸入暱稱"
                  value={profileForm.nickname}
                  onChange={(event) => setProfileForm({ ...profileForm, nickname: event.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">電話</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="請輸入電話"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="card_number">卡號</label>
                <input
                  id="card_number"
                  type="text"
                  placeholder="請輸入卡號"
                  value={profileForm.card_number}
                  onChange={(event) => setProfileForm({ ...profileForm, card_number: event.target.value })}
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
                  value={profileForm.id_card_last3}
                  onChange={(event) => setProfileForm({ ...profileForm, id_card_last3: event.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <button type="submit" className="save-btn">
              <span>💾</span>
              更新資料
            </button>
          </form>
        </div>

        {/* Right Column - Availability */}
        <div className="profile-sidebar">
          <form className="profile-card availability-card" onSubmit={handleAvailabilitySave}>
            <h3>📅 可打球時間</h3>
            <p className="availability-hint">點選可打球的日子</p>
            <div className="days-list">
              {DAYS.map((day) => (
                <label key={day.key} className={`day-toggle ${availability[day.key] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={availability[day.key]}
                    onChange={(event) => setAvailability({ ...availability, [day.key]: event.target.checked })}
                  />
                  <div className="toggle-content">
                    <span className="toggle-icon">{availability[day.key] ? '✓' : ''}</span>
                    <span className="toggle-label">{day.label}</span>
                  </div>
                </label>
              ))}
            </div>
            <button type="submit" className="save-btn save-btn-secondary">
              <span>💾</span>
              儲存時間
            </button>
          </form>
          
          <div className="profile-card leave-management-card">
            <h3>🏖️ 請假管理</h3>
            <form onSubmit={handleLeaveCreate} className="leave-form">
              <div className="form-group">
                <label htmlFor="leave_date">請假日期</label>
                <input
                  id="leave_date"
                  type="date"
                  value={leaveForm.leave_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reason">事由（選填）</label>
                <input
                  id="reason"
                  type="text"
                  placeholder="例如：出差、家庭聚會"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="form-input"
                />
              </div>
              <button type="submit" className="save-btn save-btn-secondary">
                <span>➕</span>
                新增請假
              </button>
            </form>

            {leaves.length > 0 && (
              <div className="leaves-list">
                <h4>我的請假紀錄</h4>
                {leaves.map((leave) => (
                  <div key={leave.id} className="leave-item">
                    {editingLeaveId === leave.id ? (
                      <div className="leave-edit-form">
                        <input
                          type="date"
                          value={leave.leave_date}
                          onChange={(e) => {
                            setLeaves(leaves.map(l => 
                              l.id === leave.id ? { ...l, leave_date: e.target.value } : l
                            ))
                          }}
                          className="form-input-small"
                        />
                        <input
                          type="text"
                          value={leave.reason || ''}
                          onChange={(e) => {
                            setLeaves(leaves.map(l => 
                              l.id === leave.id ? { ...l, reason: e.target.value } : l
                            ))
                          }}
                          placeholder="事由"
                          className="form-input-small"
                        />
                        <div className="leave-actions">
                          <button 
                            type="button"
                            onClick={() => handleLeaveUpdate(leave.id)}
                            className="btn-save-small"
                          >
                            ✓
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEditingLeaveId(null)}
                            className="btn-cancel-small"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="leave-info">
                          <span className="leave-date">
                            📅 {new Date(leave.leave_date + 'T00:00:00').toLocaleDateString('zh-TW', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </span>
                          {leave.reason && <span className="leave-reason">{leave.reason}</span>}
                        </div>
                        <div className="leave-actions">
                          <button 
                            type="button"
                            onClick={() => setEditingLeaveId(leave.id)}
                            className="btn-edit"
                            title="編輯"
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleLeaveDelete(leave.id)}
                            className="btn-delete"
                            title="刪除"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="profile-card tip-card">
            <div className="tip-icon">💡</div>
            <h4>小提示</h4>
            <p>設定好你的打球時間，讓其他球友更容易找到你一起打球！</p>
          </div>
        </div>
      </div>
    </div>
  )
}
