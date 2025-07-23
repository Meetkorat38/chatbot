"use client"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AdminLayout from "@/components/layout/AdminLayout"
import { socket } from "@/lib/socket"
import { API_ENDPOINTS } from "@/lib/config"

interface ChatUser {
  id: string
  sessionId: string
  ipAddress: string
  userAgent: string
  createdAt: string
  messages: { 
    id: string
    content: string
    createdAt: string
    sender: string
    isAi?: boolean
  }[]
  aiEnabled: boolean
  isOnline?: boolean
  lastSeen?: string
  assignedAdmin?: string
}

export default function LiveChatsPage() {
  const token = useSelector((state: RootState) => state.auth.token)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "online" | "unassigned" | "ai-enabled">("all")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Connect to socket for real-time updates
  useEffect(() => {
    socket.connect()
    
    // Listen for user status updates
    socket.on("user-online", (userId: string) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId])
    })
    
    socket.on("user-offline", (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId))
    })
    
    return () => {
      socket.off("user-online")
      socket.off("user-offline")
      socket.disconnect()
    }
  }, [])

  const { data: chats, isLoading, isError, refetch } = useQuery<ChatUser[]>({
    queryKey: ["liveChats"],
    queryFn: async () => {
      const res = await axios.get(API_ENDPOINTS.ADMIN_CHATS, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.map((chat: ChatUser) => ({
        ...chat,
        isOnline: onlineUsers.includes(chat.id)
      }))
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  })

  // Filter chats based on search and filter criteria
  const filteredChats = chats?.filter(chat => {
    const matchesSearch = chat.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    
    switch (filter) {
      case "online":
        return matchesSearch && chat.isOnline
      case "unassigned":
        return matchesSearch && !chat.assignedAdmin
      case "ai-enabled":
        return matchesSearch && chat.aiEnabled
      default:
        return matchesSearch
    }
  })

  const handleAssignToMe = async (chatId: string) => {
    try {
      await axios.post(
        API_ENDPOINTS.ADMIN_ASSIGN_CHAT,
        { chatId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      refetch()
    } catch (error) {
      console.error("Failed to assign chat:", error)
    }
  }

  const toggleAI = async (chatId: string, currentState: boolean) => {
    try {
      await axios.patch(
        API_ENDPOINTS.ADMIN_TOGGLE_AI,
        { chatId, aiEnabled: !currentState },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      refetch()
    } catch (error) {
      console.error("Failed to toggle AI:", error)
    }
  }

  if (isLoading) return (
    <AdminLayout>
      <p className="p-4">Loading live chats...</p>
    </AdminLayout>
  )
  
  if (isError) return (
    <AdminLayout>
      <p className="p-4 text-red-500">Failed to load chats</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Chats</h1>
            <p className="text-gray-600">{filteredChats?.length || 0} chats found</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by session ID or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "online" ? "default" : "outline"}
              onClick={() => setFilter("online")}
              size="sm"
            >
              Online
            </Button>
            <Button
              variant={filter === "unassigned" ? "default" : "outline"}
              onClick={() => setFilter("unassigned")}
              size="sm"
            >
              Unassigned
            </Button>
            <Button
              variant={filter === "ai-enabled" ? "default" : "outline"}
              onClick={() => setFilter("ai-enabled")}
              size="sm"
            >
              AI Enabled
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Chats</div>
            <div className="text-xl font-bold">{chats?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Online Now</div>
            <div className="text-xl font-bold text-green-600">{onlineUsers.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Unassigned</div>
            <div className="text-xl font-bold text-orange-600">
              {chats?.filter(chat => !chat.assignedAdmin).length || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">AI Active</div>
            <div className="text-xl font-bold text-blue-600">
              {chats?.filter(chat => chat.aiEnabled).length || 0}
            </div>
          </Card>
        </div>

        {/* Chat List */}
        <div className="grid gap-4">
          {filteredChats?.map((chat) => (
            <Card key={chat.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        chat.isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="font-medium text-gray-900">
                        {chat.sessionId.slice(0, 12)}...
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      chat.aiEnabled 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {chat.aiEnabled ? '🤖 AI' : '👤 Manual'}
                    </span>
                    
                    {chat.assignedAdmin && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        👤 Assigned
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    📍 {chat.ipAddress || "Unknown IP"} • 
                    💻 {chat.userAgent.slice(0, 40)}...
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    💬 {chat.messages.length} messages • 
                    Last: {chat.messages.length > 0 
                      ? new Date(chat.messages[chat.messages.length - 1].createdAt).toLocaleTimeString()
                      : "No messages"
                    }
                  </div>
                  
                  {chat.messages.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-600">Latest:</span> "
                      {chat.messages[chat.messages.length - 1].content.slice(0, 60)}..."
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Link href={`/admin/chat/${chat.id}`}>
                    <Button size="sm" className="w-full">
                      💬 Open Chat
                    </Button>
                  </Link>
                  
                  {!chat.assignedAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignToMe(chat.id)}
                      className="w-full"
                    >
                      👤 Assign to Me
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAI(chat.id, chat.aiEnabled)}
                    className="w-full"
                  >
                    {chat.aiEnabled ? '🚫 Disable AI' : '🤖 Enable AI'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {filteredChats?.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No chats found matching your criteria</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
