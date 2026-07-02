import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import './MembersPage.css'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(null)
  const [copyState, setCopyState] = useState('')

  useEffect(() => {
    const fetchMembers = async () => {
      const response = await fetch(`${API_BASE_URL}/api/members`)
      const result = await response.json()
      setMembers(result.members || [])
      setLoading(false)
    }

    fetchMembers()
  }, [])

  const dayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const getMembersForDay = (dayKey) =>
    members.filter((member) => member.availability?.[dayKey])

  const handleCopy = async (dayKey) => {
    const players = getMembersForDay(dayKey)
    const text = players
      .map((member) => `${member.nickname}｜卡號:${member.card_number || '未填'}｜尾碼:${member.id_card_last3}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopyState(`${dayLabels[dayKeys.indexOf(dayKey)]} 的名單已複製`)
      setTimeout(() => setCopyState(''), 3000)
    } catch {
      setCopyState('複製失敗，請稍後再試')
    }
  }

  if (loading) {
    return (
      <div className="members-page">
        <div className="loading-state">載入中...</div>
      </div>
    )
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <h2>👥 會員總覽</h2>
        <p>查看所有會員與每週可打球的時間</p>
      </div>

      <div className="calendar-section">
        <h3>📅 每週打球時間表</h3>
        <p className="calendar-hint">點擊任一天可複製該日可打球名單</p>
        
        <div className="calendar-grid">
          {dayKeys.map((dayKey, index) => {
            const players = getMembersForDay(dayKey)
            return (
              <button
                key={dayKey}
                type="button"
                className={`calendar-day ${players.length ? 'has-players' : ''} ${activeDay === dayKey ? 'active' : ''}`}
                onMouseEnter={() => setActiveDay(dayKey)}
                onMouseLeave={() => setActiveDay(null)}
                onClick={() => handleCopy(dayKey)}
                title={`點擊複製 ${dayLabels[index]} 可打球名單`}
              >
                <span className="day-label">{dayLabels[index]}</span>
                <span className="day-count">{players.length}</span>
                <span className="day-text">{players.length ? '人可打' : '無人'}</span>
              </button>
            )
          })}
        </div>

        <div className="day-details-container">
        {activeDay && (
          <div className="day-details">
            <h4>{dayLabels[dayKeys.indexOf(activeDay)]} 可打球名單</h4>
            <div className="players-list">
              {getMembersForDay(activeDay).map((member) => (
                <div key={member.member_id} className="player-tag">
                  <span className="player-name">{member.nickname}</span>
                  <span className="player-info">卡號：{member.card_number || '未填'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {copyState && <div className="copy-notification">{copyState}</div>}
      </div>

      <div className="members-list">
        <h3>所有會員</h3>
        <div className="members-grid">
          {members.map((member) => (
            <article key={member.member_id} className="member-card">
              <div className="member-avatar">{member.nickname.charAt(0)}</div>
              <div className="member-info">
                <h4>{member.nickname}</h4>
                <p className="member-id">ID: {member.member_id}</p>
                <div className="member-details">
                  <span>📅 {member.available_days.join('、') || '尚未設定'}</span>
                  <span>🆔 尾碼：{member.id_card_last3}</span>
                  {member.card_number && <span>💳 {member.card_number}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
