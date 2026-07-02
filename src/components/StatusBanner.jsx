import { useEffect, useState } from 'react'
import './StatusBanner.css'

export default function StatusBanner({ status, onClear }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClear, 300)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [status, onClear])

  if (!status) return null

  return (
    <div className={`status-banner ${visible ? 'visible' : ''}`}>
      <span className="status-icon">✓</span>
      {status}
    </div>
  )
}
