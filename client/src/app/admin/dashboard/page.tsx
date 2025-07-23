"use client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Card } from "@/components/ui/card"
import AdminLayout from "@/components/layout/AdminLayout"
import { API_ENDPOINTS } from "@/lib/config"
import { AIStatusWidget } from "@/components/admin/AIStatusWidget"

interface ChatUser {
  id: string
  sessionId: string
  ipAddress: string
  userAgent: string
  createdAt: string
  messages: { id: string; content: string; createdAt: string; sender: string }[]
  aiEnabled: boolean
}

interface DashboardStats {
  totalChats: number
  activeChats: number
  totalMessages: number
  todayMessages: number
}

export default function DashboardPage() {
  const token = useSelector((state: RootState) => state.auth.token)

  const { data: chats, isLoading, isError } = useQuery<ChatUser[]>({
    queryKey: ["chatUsers"],
    queryFn: async () => {
      const res = await axios.get(API_ENDPOINTS.ADMIN_CHATS, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Calculate stats
  const stats: DashboardStats = {
    totalChats: chats?.length || 0,
    activeChats: chats?.filter(chat => 
      chat.messages.some(msg => 
        new Date(msg.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
    ).length || 0,
    totalMessages: chats?.reduce((acc, chat) => acc + chat.messages.length, 0) || 0,
    todayMessages: chats?.reduce((acc, chat) => 
      acc + chat.messages.filter(msg => 
        new Date(msg.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length, 0
    ) || 0,
  }

  if (isLoading) return (
    <AdminLayout>
      <p className="p-4">Loading dashboard...</p>
    </AdminLayout>
  )
  
  if (isError) return (
    <AdminLayout>
      <p className="p-4 text-red-500">Failed to load dashboard data</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* AI Status Widget */}
        <AIStatusWidget />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                💬
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                🟢
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                📝
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                📊
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Chats */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Chats</h2>
            <Link 
              href="/admin/chats" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="grid gap-4">
            {chats?.slice(0, 5).map((chat) => (
              <Link key={chat.id} href={`/admin/chat/${chat.id}`}>
                <Card className="p-4 hover:bg-gray-50 cursor-pointer border transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Session: {chat.sessionId.slice(0, 8)}...
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          chat.aiEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {chat.aiEnabled ? 'AI Enabled' : 'Manual Only'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        IP: {chat.ipAddress || "unknown"} | 
                        Device: {chat.userAgent.slice(0, 30)}...
                      </div>
                      <div className="text-sm text-gray-700">
                        Last Message: {
                          chat.messages.length > 0
                            ? chat.messages[chat.messages.length - 1].content.slice(0, 50) + "..."
                            : "No messages yet"
                        }
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
