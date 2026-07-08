import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import './AdminPage.css'

export default function AdminPage({ token, setStatus }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [cardLocks, setCardLocks] = useState([])
  const [showLockForm, setShowLockForm] = useState(false)
  const [lockFormData, setLockFormData] = useState({
    start_time: '',
    end_time: '',
    reason: ''
  })
  const [editingLock, setEditingLock] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('請先登入')
      return
    }
    fetchMembers()
  }, [token])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`)
      const result = await response.json()
      setMembers(result.members || [])
    } catch (error) {
      setStatus('載入會員列表失敗')
    } finally {
      setLoading(false)
    }
  }

  const fetchCardLocks = async (memberId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/card-locks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const locks = await response.json()
      setCardLocks(locks || [])
    } catch (error) {
      setStatus('載入鎖卡記錄失敗')
    }
  }

  const handleSelectMember = (member) => {
    setSelectedMember(member)
    fetchCardLocks(member.member_id)
    setShowLockForm(false)
    setEditingLock(null)
  }

  const handleToggleAdmin = async (memberId, currentIsAdmin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: !currentIsAdmin })
      })

      if (!response.ok) {
        throw new Error('更新失敗')
      }

      setStatus(`已${!currentIsAdmin ? '授予' : '撤銷'}管理員權限`)
      fetchMembers()
      if (selectedMember?.member_id === memberId) {
        setSelectedMember({ ...selectedMember, is_admin: !currentIsAdmin })
      }
    } catch (error) {
      setStatus('更新管理員權限失敗')
    }
  }

  const handleCreateLock = async (e) => {
    e.preventDefault()
    if (!selectedMember) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${selectedMember.member_id}/card-locks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lockFormData)
      })

      if (!response.ok) {
        throw new Error('新增失敗')
      }

      setStatus('鎖卡記錄新增成功')
      setShowLockForm(false)
      setLockFormData({ start_time: '', end_time: '', reason: '' })
      fetchCardLocks(selectedMember.member_id)
    } catch (error) {
      setStatus('新增鎖卡記錄失敗')
    }
  }

  const handleUpdateLock = async (e) => {
    e.preventDefault()
    if (!selectedMember || !editingLock) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${selectedMember.member_id}/card-locks/${editingLock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lockFormData)
      })

      if (!response.ok) {
        throw new Error('更新失敗')
      }

      setStatus('鎖卡記錄更新成功')
      setEditingLock(null)
      setShowLockForm(false)
      setLockFormData({ start_time: '', end_time: '', reason: '' })
      fetchCardLocks(selectedMember.member_id)
    } catch (error) {
      setStatus('更新鎖卡記錄失敗')
    }
  }

  const handleDeleteLock = async (lockId) => {
    if (!selectedMember) return
    if (!confirm('確定要刪除此鎖卡記錄嗎？')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${selectedMember.member_id}/card-locks/${lockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('刪除失敗')
      }

      setStatus('鎖卡記錄已刪除')
      fetchCardLocks(selectedMember.member_id)
    } catch (error) {
      setStatus('刪除鎖卡記錄失敗')
    }
  }

  const handleEditLock = (lock) => {
    setEditingLock(lock)
    setLockFormData({
      start_time: new Date(lock.start_time).toISOString().slice(0, 16),
      end_time: new Date(lock.end_time).toISOString().slice(0, 16),
      reason: lock.reason || ''
    })
    setShowLockForm(true)
  }

  const handleCancelForm = () => {
    setShowLockForm(false)
    setEditingLock(null)
    setLockFormData({ start_time: '', end_time: '', reason: '' })
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isLockActive = (lock) => {
    const now = new Date()
    const start = new Date(lock.start_time)
    const end = new Date(lock.end_time)
    return now >= start && now <= end
  }

  if (!token) {
    return (
      <div className="admin-page">
        <div className="error-state">請先登入以訪問管理者頁面</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-state">載入中...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>🔧 管理者頁面</h2>
        <p>管理會員權限與鎖卡記錄</p>
      </div>

      <div className="admin-content">
        <div className="members-panel">
          <h3>會員列表</h3>
          <div className="members-list-admin">
            {members.map((member) => (
              <button
                key={member.member_id}
                className={`member-item ${selectedMember?.member_id === member.member_id ? 'selected' : ''}`}
                onClick={() => handleSelectMember(member)}
              >
                <div className="member-item-info">
                  <span className="member-name">{member.nickname}</span>
                  {member.is_admin && <span className="admin-badge">管理員</span>}
                </div>
                <span className="member-id">ID: {member.member_id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="details-panel">
          {selectedMember ? (
            <>
              <div className="member-details-section">
                <h3>{selectedMember.nickname} 的資訊</h3>
                <div className="member-details-info">
                  <p><strong>ID：</strong>{selectedMember.member_id}</p>
                  <p><strong>卡號：</strong>{selectedMember.card_number || '未填'}</p>
                  <p><strong>尾碼：</strong>{selectedMember.id_card_last3}</p>
                  <p><strong>可打球日：</strong>{selectedMember.available_days.join('、') || '尚未設定'}</p>
                </div>
                <button
                  className={`btn-toggle-admin ${selectedMember.is_admin ? 'btn-revoke' : 'btn-grant'}`}
                  onClick={() => handleToggleAdmin(selectedMember.member_id, selectedMember.is_admin)}
                >
                  {selectedMember.is_admin ? '撤銷管理員權限' : '授予管理員權限'}
                </button>
              </div>

              <div className="card-locks-section">
                <div className="section-header">
                  <h3>鎖卡記錄</h3>
                  <button
                    className="btn-add-lock"
                    onClick={() => {
                      setShowLockForm(true)
                      setEditingLock(null)
                      setLockFormData({ start_time: '', end_time: '', reason: '' })
                    }}
                  >
                    + 新增鎖卡
                  </button>
                </div>

                {showLockForm && (
                  <form className="lock-form" onSubmit={editingLock ? handleUpdateLock : handleCreateLock}>
                    <h4>{editingLock ? '編輯鎖卡記錄' : '新增鎖卡記錄'}</h4>
                    <div className="form-group">
                      <label>開始時間</label>
                      <input
                        type="datetime-local"
                        value={lockFormData.start_time}
                        onChange={(e) => setLockFormData({ ...lockFormData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>結束時間</label>
                      <input
                        type="datetime-local"
                        value={lockFormData.end_time}
                        onChange={(e) => setLockFormData({ ...lockFormData, end_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>原因（選填）</label>
                      <textarea
                        value={lockFormData.reason}
                        onChange={(e) => setLockFormData({ ...lockFormData, reason: e.target.value })}
                        placeholder="鎖卡原因"
                        rows="3"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-submit">
                        {editingLock ? '更新' : '新增'}
                      </button>
                      <button type="button" className="btn-cancel" onClick={handleCancelForm}>
                        取消
                      </button>
                    </div>
                  </form>
                )}

                <div className="locks-list">
                  {cardLocks.length === 0 ? (
                    <p className="no-locks">目前沒有鎖卡記錄</p>
                  ) : (
                    cardLocks.map((lock) => (
                      <div key={lock.id} className={`lock-item ${isLockActive(lock) ? 'active-lock' : ''}`}>
                        <div className="lock-info">
                          {isLockActive(lock) && <span className="active-badge">進行中</span>}
                          <p><strong>開始：</strong>{formatDateTime(lock.start_time)}</p>
                          <p><strong>結束：</strong>{formatDateTime(lock.end_time)}</p>
                          {lock.reason && <p><strong>原因：</strong>{lock.reason}</p>}
                        </div>
                        <div className="lock-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditLock(lock)}
                          >
                            編輯
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteLock(lock.id)}
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>👈 請選擇一個會員以查看詳細資訊</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
