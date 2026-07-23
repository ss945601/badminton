import { useEffect, useState } from 'react'
import AIChatWidget from './AIChatWidget'
import { API_BASE_URL } from '../constants'
import './MembersPage.css'

const dayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const getCurrentWeekStart = () => {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default function MembersPage({ token }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(null)
  const [copyState, setCopyState] = useState('')
  const [selectedWeekStart, setSelectedWeekStart] = useState(getCurrentWeekStart)
  const [leavesByDate, setLeavesByDate] = useState({})
  const [cardLocks, setCardLocks] = useState({})

  const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`

  const getWeekRange = (date = selectedWeekStart) => {
    const monday = new Date(date)
    const day = monday.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return {
      start: formatDateKey(monday),
      end: formatDateKey(sunday),
      monday,
      sunday,
    }
  }

  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/members`)
        const result = await response.json()
        const membersData = result.members || []
        setMembers(membersData)

        const { start, end } = getWeekRange(selectedWeekStart)
        const [locksResponse, leavesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/card-locks?start_time=${encodeURIComponent(`${start}T00:00:00`)}&end_time=${encodeURIComponent(`${end}T23:59:59`)}`),
          fetch(`${API_BASE_URL}/api/leaves?start_date=${start}&end_date=${end}`),
        ])
        const locks = await locksResponse.json()
        const leavesResult = await leavesResponse.json()

        const locksByMemberId = {}
        for (const lock of locks || []) {
          if (!locksByMemberId[lock.member_id]) {
            locksByMemberId[lock.member_id] = []
          }
          locksByMemberId[lock.member_id].push(lock)
        }
        setCardLocks(locksByMemberId)
        setLeavesByDate(leavesResult.leaves_by_date || {})
      } catch (error) {
        console.error('Failed to fetch members, card locks or leaves', error)
        setCardLocks({})
        setLeavesByDate({})
      } finally {
        setLoading(false)
      }
    }

    fetchWeekData()
  }, [selectedWeekStart])

  const getWeekDates = (date = selectedWeekStart) => {
    const weekRange = getWeekRange(date)
    return dayKeys.map((_, index) => {
      const currentDate = new Date(weekRange.monday)
      currentDate.setDate(weekRange.monday.getDate() + index)
      return formatDisplayDate(currentDate)
    })
  }

  const weekDates = getWeekDates()

  const getFullWeekDates = (date = selectedWeekStart) => {
    const weekRange = getWeekRange(date)
    return dayKeys.map((_, index) => {
      const currentDate = new Date(weekRange.monday)
      currentDate.setDate(weekRange.monday.getDate() + index)
      return formatDateKey(currentDate)
    })
  }

  const fullWeekDates = getFullWeekDates()

  const getLeavesForDate = (dateStr) => leavesByDate[dateStr] || []

  const isMemberLockedOnDate = (memberId, dateStr) => {
    const locks = cardLocks[memberId] || []
    if (locks.length === 0) return false

    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(`${dateStr}T23:59:59`)

    return locks.some((lock) => {
      const lockStart = new Date(lock.start_time)
      const lockEnd = new Date(lock.end_time)
      return lockStart <= dayEnd && lockEnd >= dayStart
    })
  }

  const getMemberLocksOnDate = (memberId, dateStr) => {
    const locks = cardLocks[memberId] || []
    if (locks.length === 0) return []

    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(`${dateStr}T23:59:59`)

    return locks.filter((lock) => {
      const lockStart = new Date(lock.start_time)
      const lockEnd = new Date(lock.end_time)
      return lockStart <= dayEnd && lockEnd >= dayStart
    })
  }

  const getMembersForDay = (dayKey, dayIndex) => {
    const availableMembers = members.filter((member) => member.availability?.[dayKey])
    const dateStr = fullWeekDates[dayIndex]
    const leavesOnDate = getLeavesForDate(dateStr)
    const leaveIds = leavesOnDate.map((leave) => leave.member_id)

    return availableMembers.filter(
      (member) => !leaveIds.includes(member.member_id) && !isMemberLockedOnDate(member.member_id, dateStr)
    )
  }

  const getLeaveCountForDay = (dayIndex) => {
    const dateStr = fullWeekDates[dayIndex]
    const leavesOnDate = getLeavesForDate(dateStr)
    return leavesOnDate.length
  }

  const getLockedCountForDay = (dayIndex) => {
    const dateStr = fullWeekDates[dayIndex]
    return members.filter(
      (member) => member.availability?.[dayKeys[dayIndex]] && isMemberLockedOnDate(member.member_id, dateStr)
    ).length
  }

  const handleWeekChange = (direction) => {
    setActiveDay(null)
    setSelectedWeekStart((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + direction * 7)
      return next
    })
  }

  const handleResetToCurrentWeek = () => {
    setActiveDay(null)
    setSelectedWeekStart(getCurrentWeekStart())
  }

  const handleCopy = async (dayKey, dayIndex) => {
    const players = getMembersForDay(dayKey, dayIndex)
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

  const weekRange = getWeekRange(selectedWeekStart)
  const weekLabel = `${weekRange.monday.getFullYear()}/${weekRange.monday.getMonth() + 1}/${weekRange.monday.getDate()} - ${weekRange.sunday.getFullYear()}/${weekRange.sunday.getMonth() + 1}/${weekRange.sunday.getDate()}`

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
        <p>查看所有會員與各週可打球的時間</p>
      </div>

      <div className="calendar-section">
        <div className="week-navigation">
          <button type="button" className="nav-button" onClick={() => handleWeekChange(-1)}>
            ← 上一週
          </button>
          <div className="week-range-label">{weekLabel}</div>
          <button type="button" className="nav-button" onClick={() => handleWeekChange(1)}>
            下一週 →
          </button>
        </div>
        <button type="button" className="current-week-button" onClick={handleResetToCurrentWeek}>
          回到本週
        </button>

        <h3>📅 打球時間表</h3>
        <p className="calendar-hint">點擊任一天可複製該日可打球名單</p>

        <div className="calendar-grid">
          {dayKeys.map((dayKey, index) => {
            const players = getMembersForDay(dayKey, index)
            const leaveCount = getLeaveCountForDay(index)
            const lockedCount = getLockedCountForDay(index)
            return (
              <button
                key={dayKey}
                type="button"
                className={`calendar-day ${players.length ? 'has-players' : ''} ${activeDay === dayKey ? 'active' : ''}`}
                onMouseEnter={() => setActiveDay(dayKey)}
                onMouseLeave={() => setActiveDay(null)}
                onClick={() => handleCopy(dayKey, index)}
                title={`點擊複製 ${dayLabels[index]} 可打球名單`}
              >
                <span className="day-label">{dayLabels[index]}</span>
                <span className="day-date">{weekDates[index]}</span>
                <span className="day-count">{players.length}</span>
                <span className="day-text">{players.length ? '人可打' : '無人'}</span>
                {leaveCount > 0 && <span className="leave-badge">{leaveCount}人請假</span>}
                {lockedCount > 0 && <span className="lock-badge">{lockedCount}人鎖卡</span>}
              </button>
            )
          })}
        </div>

        <div className="day-details-container">
          {activeDay && (
            <div className="day-details">
              <h4>{dayLabels[dayKeys.indexOf(activeDay)]} 可打球名單</h4>
              <div className="players-list">
                {getMembersForDay(activeDay, dayKeys.indexOf(activeDay)).map((member) => (
                  <div key={member.member_id} className="player-tag">
                    <span className="player-name">{member.nickname}</span>
                    <span className="player-info">卡號：{member.card_number || '未填'}</span>
                  </div>
                ))}
              </div>
              {(() => {
                const dayIndex = dayKeys.indexOf(activeDay)
                const dateStr = fullWeekDates[dayIndex]
                const leavesOnDate = getLeavesForDate(dateStr)
                const lockedMembers = members.filter(
                  (member) => member.availability?.[activeDay] && isMemberLockedOnDate(member.member_id, dateStr)
                )
                return (
                  <>
                    {leavesOnDate.length > 0 && (
                      <div className="leaves-section">
                        <h4>請假名單</h4>
                        <div className="leaves-list-detail">
                          {leavesOnDate.map((leave) => (
                            <div key={leave.id} className="leave-tag">
                              <span className="leave-name">{leave.nickname}</span>
                              {leave.reason && <span className="leave-reason">{leave.reason}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {lockedMembers.length > 0 && (
                      <div className="locks-section">
                        <h4>鎖卡名單</h4>
                        <div className="locks-list-detail">
                          {lockedMembers.map((member) => {
                            const locks = getMemberLocksOnDate(member.member_id, dateStr)
                            return (
                              <div key={member.member_id} className="lock-tag">
                                <span className="lock-name">{member.nickname}</span>
                                {locks.map((lock) => (
                                  <span key={lock.id} className="lock-reason">
                                    {lock.reason ? `: ${lock.reason}` : '鎖卡中'}
                                  </span>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
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
      <AIChatWidget token={token} />
    </div>
  )
}
