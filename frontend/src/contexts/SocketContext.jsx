import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ token, children }) {
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

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('[socket] disconnected')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  const addNotification = (msg) => {
    setNotifications((prev) => [...prev, { id: Date.now(), message: msg }])
  }

  const clearNotifications = () => setNotifications([])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, addNotification, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
