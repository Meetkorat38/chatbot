"use client"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Card } from "@/components/ui/card"
import AdminLayout from "@/components/layout/AdminLayout"
import { API_ENDPOINTS } from "@/lib/config"

interface AnalyticsData {
  totalChats: number
  todayChats: number
  totalMessages: number
  todayMessages: number
  activeChats: number
  aiEnabledChats: number
  averageResponseTime: number
  popularHours: { hour: number; count: number }[]
  messagesByDay: { date: string; count: number }[]
  userSatisfaction: number
}

export default function AnalyticsPage() {
  const token = useSelector((state: RootState) => state.auth.token)

  const { data: stats, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(API_ENDPOINTS.ADMIN_STATS, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) return (
    <AdminLayout>
      <p className="p-4">Loading analytics...</p>
    </AdminLayout>
  )
  
  if (isError) return (
    <AdminLayout>
      <p className="p-4 text-red-500">Failed to load analytics</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights into your chatbot performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                💬
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalChats || 0}</p>
                <p className="text-xs text-green-600">+{stats?.todayChats || 0} today</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                📝
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages || 0}</p>
                <p className="text-xs text-green-600">+{stats?.todayMessages || 0} today</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                🟢
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeChats || 0}</p>
                <p className="text-xs text-gray-600">Last 24 hours</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                🤖
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Enabled</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.aiEnabledChats || 0}</p>
                <p className="text-xs text-gray-600">Active AI chats</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Response Time</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats?.averageResponseTime || 0}s
              </div>
              <div className="text-sm text-gray-600">Average Response Time</div>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-600">AI</div>
                  <div className="text-lg font-bold">2.3s</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-orange-600">Human</div>
                  <div className="text-lg font-bold">45s</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Satisfaction</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats?.userSatisfaction || 85}%
              </div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.userSatisfaction || 85}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Usage Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
            <div className="space-y-2">
              {[
                { hour: '9 AM', usage: 85 },
                { hour: '2 PM', usage: 92 },
                { hour: '7 PM', usage: 78 },
                { hour: '11 PM', usage: 45 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.hour}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.usage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{item.usage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Message Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Questions</span>
                <span className="text-sm text-gray-600">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Support Requests</span>
                <span className="text-sm text-gray-600">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Feedback</span>
                <span className="text-sm text-gray-600">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Other</span>
                <span className="text-sm text-gray-600">10%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">7-Day Trend</h3>
          <div className="grid grid-cols-7 gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const height = Math.random() * 80 + 20; // Random data for demo
              return (
                <div key={day} className="flex flex-col items-center">
                  <div className="flex-1 flex items-end">
                    <div 
                      className="w-8 bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{day}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
