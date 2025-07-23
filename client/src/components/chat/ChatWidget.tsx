"use client"
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { socket } from "@/lib/socket"
import { RootState } from "@/store"
import {
  addMessage,
  setTyping,
  toggleChat,
} from "@/store/chatSlice"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"

const generateSessionId = () => {
  const existing = localStorage.getItem("sessionId")
  if (existing) return existing
  const id = "sess-" + Math.random().toString(36).substring(2)
  localStorage.setItem("sessionId", id)
  return id
}

export const ChatWidget = () => {
  const dispatch = useDispatch()
  const { messages, typing, isOpen } = useSelector(
    (state: RootState) => state.chat
  )
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Ensure component only renders on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const sessionId = generateSessionId()
    console.log("🔍 Connecting with sessionId:", sessionId)

    // Ensure we're not already connected
    if (socket.connected) {
      socket.disconnect()
    }

    socket.connect()
    
    // Let server detect IP automatically - much more reliable!
    socket.emit("join", {
      sessionId,
      userAgent: navigator.userAgent,
    })

    socket.on("message", (msg) => {
      console.log("📨 Received message:", msg)
      dispatch(addMessage({
        id: msg.id,
        content: msg.message,
        sender: msg.sender || (msg.isFromUser ? "user" : "ai"),
        isAi: msg.sender === "ai" || (!msg.isFromUser && !msg.sender)
      }))
      // Stop sending state when we receive any message (user or AI)
      setSending(false)
    })

    socket.on("error", (error) => {
      console.error("🚨 Socket error:", error)
      setSending(false)
    })

    socket.on("bot-typing", () => dispatch(setTyping(true)))
    socket.on("stop-typing", () => dispatch(setTyping(false)))

    return () => {
      socket.off("message")
      socket.off("error")
      socket.off("bot-typing")  
      socket.off("stop-typing")
      socket.disconnect()
    }
  }, [dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const handleSend = () => {
    if (!input.trim() || sending) return
    console.log("📤 Sending message:", input)
    setSending(true)
    
    // Add user message to UI immediately (optimistic update)
    dispatch(addMessage({
      id: Date.now().toString(),
      content: input,
      sender: "user",
      isAi: false
    }))
    
    // Send message with sessionId for better tracking
    const sessionId = generateSessionId()
    socket.emit("message", { sessionId, message: input })
    setInput("")
  }

  // Don't render anything until mounted on client side
  if (!isMounted) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg"
          onClick={() => dispatch(toggleChat())}
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-xl rounded-lg flex flex-col overflow-hidden border border-gray-200">
          <div className="p-2 bg-blue-600 text-white flex justify-between items-center">
            <span>Chat with us</span>
            <button onClick={() => dispatch(toggleChat())}>✖️</button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id || idx}
                content={msg.content}
                sender={msg.sender}
                isAi={msg.isAi}
              />
            ))}
            {(typing || sending) && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t flex gap-1">
            <input
              type="text"
              className="flex-1 border rounded px-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
              placeholder="Type a message..."
            />
            <button
              className="bg-blue-600 text-white px-3 rounded disabled:opacity-50"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "..." : "➤"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
