"use client"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AdminLayout from "@/components/layout/AdminLayout"
import { socket } from "@/lib/socket"
import { API_ENDPOINTS } from "@/lib/config"

interface Message {
  id: string
  content: string
  sender: "user" | "admin" | "ai"
  isAi?: boolean
  createdAt: string
  userId?: string
}

interface ChatUser {
  id: string
  sessionId: string
  ipAddress: string
  userAgent: string
  messages: Message[]
  aiEnabled: boolean
  assignedAdmin?: string
  lastSeen: string
}

export default function AdminChatPage() {
  const { id } = useParams()
  const token = useSelector((state: RootState) => state.auth.token)
  const { admin } = useSelector((state: RootState) => state.auth)
  const [chat, setChat] = useState<ChatUser | null>(null)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userTyping, setUserTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 🔁 Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat?.messages])

  // 🔌 Connect socket
  useEffect(() => {
    socket.connect()

    socket.on("admin-message", (msg: any) => {
      if (msg.chatId === id) {
        console.log("📨 Received admin-message:", msg, "Current admin ID:", admin?.id)
        
        // Only add message if it's NOT from the current admin (to prevent duplicates)
        // OR if it's a user/AI message (fromAdminId will be null)
        const currentAdminId = admin?.id
        const isFromCurrentAdmin = msg.fromAdminId === currentAdminId
        
        if (!isFromCurrentAdmin) {
          setChat((prev) =>
            prev
              ? { 
                  ...prev, 
                  messages: [...prev.messages, {
                    id: msg.message.id,
                    content: msg.message.content,
                    sender: msg.message.sender || "admin",
                    isAi: msg.message.isAi || false,
                    createdAt: msg.message.createdAt || new Date().toISOString()
                  }] 
                }
              : prev
          )
          console.log("✅ Added message from other admin/user/AI")
        } else {
          console.log("🚫 Ignored duplicate message from current admin")
        }
        setSending(false)
      }
    })

    socket.on("message", (msg: any) => {
      // This handles messages from user to admin panel
      console.log("📨 Received socket message:", msg)
      
      // Only add user messages, not admin messages (admin messages are handled by admin-message event)
      if (msg.sender === "user" || msg.isFromUser) {
        console.log("✅ Adding user message to admin panel")
        setChat((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages, {
                id: msg.id,
                content: msg.message || msg.content,
                sender: "user",
                isAi: false,
                createdAt: msg.timestamp || new Date().toISOString()
              }] }
            : prev
        )
      }
    })

    socket.on("user-typing", (data: { userId: string, typing: boolean }) => {
      if (data.userId === id) {
        setUserTyping(data.typing)
      }
    })

    socket.on("user-online", (userId: string) => {
      if (userId === id) {
        setIsOnline(true)
      }
    })

    socket.on("user-offline", (userId: string) => {
      if (userId === id) {
        setIsOnline(false)
      }
    })

    return () => {
      socket.off("admin-message")
      socket.off("message")
      socket.off("user-typing")
      socket.off("user-online")
      socket.off("user-offline")
      socket.disconnect()
    }
  }, [id])

  // 📦 Load chat data
  useEffect(() => {
    const load = async () => {
      try {
        console.log("🔍 Making request with token:", token?.substring(0, 20) + "...")
        const res = await axios.get(API_ENDPOINTS.ADMIN_CHAT_BY_ID!(id as string), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log("✅ Chat data loaded:", res.data)
        setChat(res.data)
      } catch (error) {
        console.error("❌ Error loading chat:", error)
        if (axios.isAxiosError(error)) {
          console.error("Response:", error.response?.data)
          console.error("Status:", error.response?.status)
        }
      }
    }
    
    if (token) {
      load()
    } else {
      console.warn("⚠️ No token available")
    }
  }, [id, token])

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
      socket.emit("admin-typing", { chatId: id, typing: true })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit("admin-typing", { chatId: id, typing: false })
    }, 1000)
  }

  const handleReply = async () => {
    if (!input.trim() || sending) return

    setSending(true)
    setIsTyping(false)
    socket.emit("admin-typing", { chatId: id, typing: false })

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: input,
      sender: "admin" as const,
      isAi: false,
      createdAt: new Date().toISOString()
    }
    
    setChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage]
    } : prev)

    const messageContent = input
    setInput("")

    try {
      await axios.post(
        API_ENDPOINTS.ADMIN_REPLY,
        {
          content: messageContent,
          userId: id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      // Message will be updated via socket events, so we don't need to reload
      setSending(false)
      
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove the optimistic message on error
      setChat(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
      } : prev)
      setSending(false)
      setInput(messageContent) // Restore the input
    }
  }

  const toggleAI = async () => {
    if (!chat) return
    
    try {
      await axios.patch(
        API_ENDPOINTS.ADMIN_TOGGLE_AI,
        { chatId: id, aiEnabled: !chat.aiEnabled },
        { 
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          } 
        }
      )
      
      setChat(prev => prev ? { ...prev, aiEnabled: !prev.aiEnabled } : prev)
    } catch (error) {
      console.error("Failed to toggle AI:", error)
    }
  }

  const assignToMe = async () => {
    try {
      await axios.post(
        API_ENDPOINTS.ADMIN_ASSIGN_CHAT,
        { chatId: id },
        { 
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          } 
        }
      )
      
      setChat(prev => prev ? { ...prev, assignedAdmin: admin?.id } : prev)
    } catch (error) {
      console.error("Failed to assign chat:", error)
    }
  }

  if (!chat) return (
    <AdminLayout>
      <p className="p-4">Loading chat...</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Chat Header */}
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-xl font-semibold">Chat with User</h1>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  isOnline 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Session:</strong> <code className="bg-gray-100 px-1 rounded">{chat.sessionId}</code>
                </div>
                <div>
                  <strong>IP:</strong> {chat.ipAddress || "Unknown"}
                </div>
                <div>
                  <strong>Device:</strong> {chat.userAgent?.slice(0, 40)}...
                </div>
                <div>
                  <strong>Last Seen:</strong> {new Date(chat.lastSeen).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 ml-4">
              <Button
                onClick={toggleAI}
                variant={chat.aiEnabled ? "default" : "outline"}
                size="sm"
              >
                {chat.aiEnabled ? '🤖 AI Enabled' : '👤 Manual Mode'}
              </Button>
              
              {!chat.assignedAdmin && (
                <Button
                  onClick={assignToMe}
                  variant="outline"
                  size="sm"
                >
                  👤 Assign to Me
                </Button>
              )}
              
              {chat.assignedAdmin === admin?.id && (
                <div className="text-xs text-green-600 text-center">
                  ✅ Assigned to you
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Messages */}
        <Card className="h-[30rem] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {chat.messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              chat.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  sender={msg.sender}
                  isAi={msg.isAi}
                />
              ))
            )}
            
            {userTyping && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm mt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>User is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your reply..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && !sending && handleReply()}
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={handleReply}
                disabled={sending || !input.trim()}
              >
                {sending ? "..." : "Send"}
              </Button>
            </div>
            
            {isTyping && (
              <div className="text-xs text-gray-500 mt-1">
                Admin is typing...
              </div>
            )}
          </div>
        </Card>

        {/* Chat Stats */}
       
      </div>
    </AdminLayout>
  )
}
