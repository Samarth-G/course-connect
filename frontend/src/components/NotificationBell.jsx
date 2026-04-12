import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext.jsx'

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications() || {}
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => {
          const next = !open
          if (next && unreadCount > 0) markAllRead()
          setOpen(next)
        }}
        title="Notifications"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
          </div>

          {(!notifications || notifications.length === 0) && (
            <p className="notification-empty">No notifications yet</p>
          )}

          {notifications && notifications.map((n) => (
            <div key={n.id} className={`notification-item${n.read ? '' : ' notification-item-unread'}`}>
              <div>{n.message}</div>
              <div className="notification-item-time">{formatTime(n.time)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
