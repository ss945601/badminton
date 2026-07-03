import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import './MessagesPage.css'

function MessageItem({
  msg,
  depth = 0,
  token,
  replyingTo,
  replyDraft,
  setReplyDraft,
  handleReply,
  cancelReply,
  handleReplySubmit,
  deletingId,
  isOwner,
  handleDeleteMessage,
}) {
  const isParent = depth === 0
  const messageClass = isParent ? 'parent-message' : 'reply-message'

  return (
    <div className="message-item">
      <div className={`message-card ${messageClass}`}>
        <div className="message-header">
          <div className="message-meta">
            {!isParent && <span className="reply-indicator">↳</span>}
            <span className="message-author">{msg.nickname}</span>
            <span className="message-time">
              {new Date(msg.created_at).toLocaleString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="message-actions">
            {token && (
              <button type="button" className="reply-btn" onClick={() => handleReply(msg.id)}>
                💬 回覆
              </button>
            )}
            {isOwner(msg) && (
              <button
                type="button"
                className="delete-message-btn"
                onClick={() => handleDeleteMessage(msg.id)}
                disabled={deletingId === msg.id}
              >
                {deletingId === msg.id ? '刪除中...' : '🗑️ 刪除'}
              </button>
            )}
          </div>
        </div>
        <p className="message-content">{msg.content}</p>
      </div>

      <div className={`reply-form ${replyingTo === msg.id ? 'reply-form-open' : 'reply-form-hidden'}`}>
        {replyingTo === msg.id && (
          <form onSubmit={(e) => handleReplySubmit(e, msg.id)}>
            <div className="reply-form-header">
              <span>💬 回覆 {msg.nickname}</span>
              <button type="button" onClick={cancelReply} className="cancel-reply-btn">
                ✕ 取消
              </button>
            </div>
            <textarea
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              placeholder="輸入你的回覆..."
              required
              className="reply-input"
            />
            <button type="submit" className="submit-reply-btn">
              <span className="btn-icon">📤</span>
              送出回覆
            </button>
          </form>
        )}
      </div>

      {msg.replies && msg.replies.length > 0 && (
        <div className="replies-container">
          {msg.replies.map((reply) => (
            <MessageItem
              key={reply.id}
              msg={reply}
              depth={depth + 1}
              token={token}
              replyingTo={replyingTo}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              handleReply={handleReply}
              cancelReply={cancelReply}
              handleReplySubmit={handleReplySubmit}
              deletingId={deletingId}
              isOwner={isOwner}
              handleDeleteMessage={handleDeleteMessage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MessagesPage({ token, setStatus }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')

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
      body: JSON.stringify({ 
        content: message,
        parent_id: null
      }),
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

  const handleReplySubmit = async (event, parentId) => {
    event.preventDefault()
    if (!token) {
      setStatus('請先登入後再留言')
      return
    }

    const replyContent = replyDraft.trim()
    if (!replyContent) {
      setStatus('請輸入回覆內容')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        content: replyContent,
        parent_id: parentId
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      setStatus(result.detail || '回覆失敗')
      return
    }

    setReplyDraft('')
    setReplyingTo(null)
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

  const handleReply = (messageId) => {
    setReplyingTo(messageId)
    setReplyDraft('')
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setReplyDraft('')
  }

  // 遞歸組織留言結構，支持多層級回覆
  const buildMessageTree = (messages, parentId = null) => {
    const filtered = messages.filter(msg => msg.parent_id === parentId)
    
    // 主留言按照時間倒序（最新的在上面），回覆按照時間正序（舊的在上面）
    const sorted = parentId === null 
      ? filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    return sorted.map(msg => ({
      ...msg,
      replies: buildMessageTree(messages, msg.id)
    }))
  }

  const organizedMessages = buildMessageTree(messages)

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
        ) : organizedMessages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>還沒有留言，成為第一個留言的人吧！</p>
          </div>
        ) : (
          organizedMessages.map((msg) => (
            <div key={msg.id} className="message-thread">
              <MessageItem
                msg={msg}
                depth={0}
                token={token}
                replyingTo={replyingTo}
                replyDraft={replyDraft}
                setReplyDraft={setReplyDraft}
                handleReply={handleReply}
                cancelReply={cancelReply}
                handleReplySubmit={handleReplySubmit}
                deletingId={deletingId}
                isOwner={isOwner}
                handleDeleteMessage={handleDeleteMessage}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
