"use client"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { socket } from "@/lib/socket"

interface Notification {
  id: string
  type: "new_message" | "new_chat" | "chat_assigned" | "ai_toggled" | "ai_error"
  title: string
  message: string
  timestamp: Date
  read: boolean
  chatId?: string
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { isLoggedIn } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isLoggedIn) return

    socket.connect()

    // Listen for various notification events
    socket.on("admin-message", (data) => {
      // This is when an admin sends a message - notify other admins
      addNotification({
        type: "new_message",
        title: "Admin Reply",
        message: `Admin replied in chat`,
        chatId: data.chatId
      })
    })

    socket.on("new-chat", (data) => {
      addNotification({
        type: "new_chat",
        title: "New Chat Started",
        message: `A new user has started a conversation`,
        chatId: data.chatId
      })
    })

    // Listen for user messages (this happens when user sends message)
    socket.on("message", (data) => {
      if (data.isFromUser) {
        addNotification({
          type: "new_message", 
          title: "New User Message",
          message: `User: ${data.message.slice(0, 50)}...`,
          chatId: data.chatId
        })
      }
    })

    socket.on("chat-assigned", (data) => {
      addNotification({
        type: "chat_assigned",
        title: "Chat Assigned",
        message: `Chat has been assigned to an admin`,
        chatId: data.chatId
      })
    })

    socket.on("ai-toggled", (data) => {
      addNotification({
        type: "ai_toggled",
        title: "AI Mode Changed",
        message: `AI has been ${data.aiEnabled ? 'enabled' : 'disabled'} for a chat`,
        chatId: data.chatId
      })
    })

    // Listen for AI error notifications
    socket.on("ai-error-notification", (data) => {
      addNotification({
        type: "ai_error",
        title: data.errorType === "rate_limit" ? "AI Rate Limit" : "AI Error",
        message: data.errorType === "rate_limit" 
          ? "AI rate limit reached - user needs human assistance" 
          : "AI service error - user needs human assistance",
        chatId: data.chatId
      })
    })

    return () => {
      socket.off("admin-message")
      socket.off("message")
      socket.off("new-chat")
      socket.off("chat-assigned")
      socket.off("ai-toggled")
      socket.off("ai-error-notification")
    }
  }, [isLoggedIn])

  const addNotification = (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
    const notification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notificationData
    }

    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep only last 10

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Ensure component only renders on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Don't render anything until mounted on client side
  if (!isMounted || !isLoggedIn) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.chatId) {
                      window.location.href = `/admin/chat/${notification.chatId}`
                    }
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === "new_message" && "💬"}
                      {notification.type === "new_chat" && "🆕"}
                      {notification.type === "chat_assigned" && "👤"}
                      {notification.type === "ai_toggled" && "🤖"}
                      {notification.type === "ai_error" && "⚠️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
