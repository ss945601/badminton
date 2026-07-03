import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import './MessagesPage.css'

export default function MessagesPage({ token, setStatus }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const isOwner = (messageItem) => {
    if (!token) {
      return false
    }

    if (messageItem.member_id === undefined || messageItem.member_id === null) {
      return false
    }

    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      console.log(Number(decoded.sub), Number(messageItem.member_id))
      return Number(decoded.sub) === Number(messageItem.member_id)
    } catch {
      return false
    }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages`)
        const data = await response.json()
        setMessages(data)
      } catch {
        setStatus('留言載入失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [setStatus])

  const refreshMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/api/messages`)
    const data = await response.json()
    setMessages(data)
  }

  const handleMessageSubmit = async (event) => {
    event.preventDefault()
    if (!token) {
      setStatus('請先登入後再留言')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: message }),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '留言失敗')
      return
    }

    setMessage('')
    setStatus(result.message)
    await refreshMessages()
  }

  const handleDeleteMessage = async (messageId) => {
    if (!token) {
      setStatus('請先登入後再刪除留言')
      return
    }

    setDeletingId(messageId)

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (!response.ok) {
        setStatus(result.detail || '刪除留言失敗')
        return
      }

      setStatus(result.message)
      await refreshMessages()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h2>💬 留言板</h2>
        <p>與球友交流，分享打球心得或約球資訊</p>
      </div>

      <form className="message-form" onSubmit={handleMessageSubmit}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="留下你的羽球消息或想一起打球的時間..."
          required
          className="message-input"
        />
        <button type="submit" className="submit-btn">
          <span className="btn-icon">📤</span>
          送出留言
        </button>
      </form>

      <div className="messages-list">
        {loading ? (
          <div className="loading">載入中...</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>還沒有留言，成為第一個留言的人吧！</p>
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className="message-card">
              <div className="message-header">
                <div className="message-meta">
                  <span className="message-author">{item.nickname}</span>
                  <span className="message-time">
                    {new Date(item.created_at).toLocaleString('zh-TW', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {isOwner(item) && (
                  <button
                    type="button"
                    className="delete-message-btn"
                    onClick={() => handleDeleteMessage(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? '刪除中...' : '刪除留言'}
                  </button>
                )}
              </div>
              <p className="message-content">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
