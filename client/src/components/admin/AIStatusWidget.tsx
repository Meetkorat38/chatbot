"use client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { API_ENDPOINTS } from "@/lib/config"

interface AIStatus {
  aiAvailable: boolean
  rateLimited: boolean
  retryAfter: number
  message: string
}

export const AIStatusWidget = () => {
  const token = useSelector((state: RootState) => state.auth.token)

  const { data: aiStatus, isLoading } = useQuery<AIStatus>({
    queryKey: ["aiStatus"],
    queryFn: async () => {
      const res = await axios.get(API_ENDPOINTS.AI_STATUS, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    refetchInterval: 30000, // Check every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="text-sm text-gray-600">Loading AI status...</div>
      </div>
    )
  }

  if (!aiStatus) return null

  return (
    <div className={`p-3 rounded-lg border ${
      aiStatus.aiAvailable 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${
          aiStatus.aiAvailable ? 'bg-green-500' : 'bg-red-500'
        }`}></span>
        <span className="font-medium text-sm">
          {aiStatus.aiAvailable ? '🤖 AI Online' : '⚠️ AI Offline'}
        </span>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {aiStatus.message}
      </div>
      
      {aiStatus.rateLimited && (
        <div className="text-xs text-red-600 mt-1 font-medium">
          ⏳ Retry in: {Math.ceil(aiStatus.retryAfter / 3600)}h {Math.ceil((aiStatus.retryAfter % 3600) / 60)}m
        </div>
      )}
    </div>
  )
}
