import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { SocketContext } from './socketContext.js'

const NotificationContext = createContext(null)

const STORAGE_KEY = 'courseconnect_notifications'

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(items) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
  } catch { /* ignore */ }
}

export function NotificationProvider({ user, children }) {
  const { socket } = useContext(SocketContext) || {}
  const [notifications, setNotifications] = useState(loadStored)
  const userRef = useRef(user)

  useEffect(() => { userRef.current = user }, [user])

  useEffect(() => { persist(notifications) }, [notifications])

  const addNotification = useCallback((message) => {
    const item = { id: Date.now() + Math.random(), message, time: new Date().toISOString(), read: false }
    setNotifications((prev) => [item, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleThreadCreated = (thread) => {
      const me = userRef.current
      if (!me) return
      if (String(thread.authorId) === String(me.id)) return
      addNotification(`New thread "${thread.title}" by ${thread.authorName || 'someone'}`)
    }

    const handleReplyAdded = ({ thread }) => {
      const me = userRef.current
      if (!me || !thread) return
      const replies = Array.isArray(thread.replies) ? thread.replies : []
      const latestReply = replies[replies.length - 1]
      if (!latestReply) return
      if (String(latestReply.authorId) === String(me.id)) return
      if (String(thread.authorId) !== String(me.id)) return
      addNotification(`${latestReply.authorName || 'Someone'} replied to your thread "${thread.title}"`)
    }

    socket.on('thread:created', handleThreadCreated)
    socket.on('reply:added', handleReplyAdded)

    return () => {
      socket.off('thread:created', handleThreadCreated)
      socket.off('reply:added', handleReplyAdded)
    }
  }, [socket, addNotification])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
