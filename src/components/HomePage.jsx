import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import homeImage from '../assets/home_img.png'
import { API_BASE_URL } from '../constants'
import './HomePage.css'

const DEFAULT_NICKNAME = '朋友'

export default function HomePage({ token }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [nickname, setNickname] = useState(DEFAULT_NICKNAME)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!token) {
        setIsAdmin(false)
        setNickname(DEFAULT_NICKNAME)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/member/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsAdmin(Boolean(data.is_admin))
          setNickname(data.nickname || DEFAULT_NICKNAME)
        } else {
          setIsAdmin(false)
          setNickname(DEFAULT_NICKNAME)
        }
      } catch {
        setIsAdmin(false)
        setNickname(DEFAULT_NICKNAME)
      }
    }

    fetchMemberProfile()
  }, [token])

  useEffect(() => {
    if (!isChatOpen || messages.length > 0) {
      return
    }

    setMessages([
      {
        role: 'assistant',
        content: `你好呀，尊貴的 ${nickname}！，我會陪你一起解決羽球相關問題。`,
      },
    ])
  }, [isChatOpen, nickname, messages.length])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const trimmedDraft = draft.trim()

    if (!trimmedDraft || isLoading) {
      return
    }

    const nextMessages = [...messages, { role: 'user', content: trimmedDraft }]

    setMessages(nextMessages)
    setDraft('')
    setIsLoading(true)
    setChatError('')

    const systemPrompt = `你是一個羽球問題輔助機器人，跟${nickname}親切地打招呼，並且盡量用鼓勵、貼心與有趣的方式回應。`
    const payloadMessages = [{ role: 'system', content: systemPrompt }, ...nextMessages]

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: payloadMessages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'AI 回覆失敗，請稍後再試。')
      }

      const data = await response.json()
      const assistantReply = data.reply || '我先把這個問題記下來，之後再跟你聊。'

      setMessages([...nextMessages, { role: 'assistant', content: assistantReply }])
    } catch (error) {
      setChatError(error.message || 'AI 回覆失敗，請稍後再試。')
      setMessages(nextMessages)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="home-page">
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>會員總覽</h3>
          <p>查看所有會員資訊，了解每天可打球的夥伴，輕鬆組隊。</p>
          <Link to="/members" className="feature-link">查看會員 →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>留言板</h3>
          <p>與球友交流，分享打球心得，約球更方便。</p>
          <Link to="/messages" className="feature-link">前往留言板 →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>個人資料</h3>
          <p>管理你的打球時間，更新個人資訊，讓大家更了解你。</p>
          {token ? (
            <Link to="/profile" className="feature-link">管理資料 →</Link>
          ) : (
            <Link to="/register" className="feature-link">立即註冊 →</Link>
          )}
        </div>

        {isAdmin && (
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>管理者後台</h3>
            <p>管理會員權限、設定鎖卡與維護活動資料。</p>
            <Link to="/admin" className="feature-link">進入管理者頁 →</Link>
          </div>
        )}
      </div>

      {!token && (
        <section className="cta-section">
          <h3>還不是會員嗎？</h3>
          <p>立即註冊，開始你的羽球之旅！</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">立即註冊</Link>
            <Link to="/login" className="btn-secondary">會員登入</Link>
          </div>
        </section>
      )}

      <section className="hero-section">
        <div className="hero-content">
          <a href="https://www.youtube.com/@%E5%8F%B0%E5%85%83%E8%8F%9C%E9%9B%9E%E5%9C%98" target="_blank" rel="noopener noreferrer">
            <img src={homeImage} alt="Latticework 羽球社活動照片" className="hero-image" />
          </a>
          <h2 className="hero-title">歡迎來到 Latticework 羽球社 🏸</h2>
        </div>
      </section>

      <button
        type="button"
        className="ai-assistant-toggle"
        onClick={() => setIsChatOpen((open) => !open)}
        aria-label={isChatOpen ? '關閉 AI 助手' : '開啟 AI 助手'}
      >
        🤖
      </button>

      {isChatOpen && (
        <section className="ai-assistant-panel" aria-label="AI 助手對話框">
          <div className="ai-assistant-header">
            <div>
              <h3>羽球 AI 助手</h3>
              <p>你好，{nickname}！</p>
            </div>
            <button type="button" className="ai-assistant-close" onClick={() => setIsChatOpen(false)}>
              ×
            </button>
          </div>

          <div className="ai-assistant-messages" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ai-message ${message.role}`}>
                <div className="ai-message-content">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message assistant">
                <div className="ai-message-content">正在思考中...</div>
              </div>
            )}
          </div>

          {chatError && <p className="ai-assistant-error">{chatError}</p>}

          <form className="ai-assistant-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="問我羽球相關問題..."
              autoComplete="off"
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? '送出中' : '送出'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
