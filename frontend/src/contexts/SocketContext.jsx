import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SocketContext } from './socketContext.js'

export function SocketProvider({ token, children }) {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const nextSocket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = nextSocket
    setSocket(nextSocket)

    const handleConnect = () => {
      console.log('[socket] connected', nextSocket.id)
    }

    const handleDisconnect = () => {
      if (socketRef.current === nextSocket) {
        setSocket(null)
      }
      console.log('[socket] disconnected')
    }

    nextSocket.on('connect', handleConnect)
    nextSocket.on('disconnect', handleDisconnect)

    return () => {
      nextSocket.off('connect', handleConnect)
      nextSocket.off('disconnect', handleDisconnect)
      if (socketRef.current === nextSocket) {
        socketRef.current = null
      }
      if (nextSocket) {
        nextSocket.disconnect()
      }
    }
  }, [token])

  const addNotification = (msg) => {
    setNotifications((prev) => [...prev, { id: Date.now(), message: msg }])
  }

  const clearNotifications = () => setNotifications([])

  return (
    <SocketContext.Provider value={{ socket, notifications, addNotification, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}
