import { useEffect, useMemo, useState } from 'react'
import aiRobotImage from '../assets/ai-robot.png'
import { API_BASE_URL } from '../constants'
import './HomePage.css'

const DEFAULT_NICKNAME = '朋友'

export default function AIChatWidget({ token, initialNickname = DEFAULT_NICKNAME }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [nickname, setNickname] = useState(initialNickname)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  const effectiveNickname = useMemo(() => nickname || DEFAULT_NICKNAME, [nickname])

  useEffect(() => {
    if (!token) {
      setNickname(DEFAULT_NICKNAME)
      return
    }

    const fetchMemberProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/member/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setNickname(data.nickname || DEFAULT_NICKNAME)
        } else {
          setNickname(DEFAULT_NICKNAME)
        }
      } catch {
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
        content: `你好呀，尊貴的 ${effectiveNickname}！，我會陪你一起解決羽球相關問題。`,
      },
    ])
  }, [effectiveNickname, isChatOpen, messages.length])

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

    const systemPrompt = `你是一個羽球問題輔助機器人，跟${effectiveNickname}親切地打招呼，並且盡量用鼓勵、貼心與有趣的方式回應。`
    const payloadMessages = [{ role: 'system', content: systemPrompt }, ...nextMessages]

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
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
    <>
      <button
        type="button"
        className="ai-assistant-toggle"
        onClick={() => setIsChatOpen((open) => !open)}
        aria-label={isChatOpen ? '關閉 AI 助手' : '開啟 AI 助手'}
      >
        <img src={aiRobotImage} alt="AI 助手" className="ai-assistant-icon" />
      </button>

      {isChatOpen && (
        <section className="ai-assistant-panel" aria-label="AI 助手對話框">
          <div className="ai-assistant-header">
            <div>
              <h3>羽球 AI 助手</h3>
              <p>你好，{effectiveNickname}！</p>
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
    </>
  )
}
