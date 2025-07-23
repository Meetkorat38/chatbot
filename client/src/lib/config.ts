// API configuration for environment-based URLs
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  ENV: process.env.NEXT_PUBLIC_ENV || 'development',
}

// API endpoint helpers
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
  
  // Admin endpoints
  ADMIN_CHATS: `${API_CONFIG.BASE_URL}/api/admin/chats`,
  ADMIN_CHAT_BY_ID: (id: string) => `${API_CONFIG.BASE_URL}/api/admin/chat/${id}`,
  ADMIN_REPLY: `${API_CONFIG.BASE_URL}/api/admin/reply`,
  ADMIN_ASSIGN_CHAT: `${API_CONFIG.BASE_URL}/api/admin/assign-chat`,
  ADMIN_TOGGLE_AI: `${API_CONFIG.BASE_URL}/api/admin/toggle-ai`,
  ADMIN_STATS: `${API_CONFIG.BASE_URL}/api/admin/stats`,
  
  // System endpoints
  AI_STATUS: `${API_CONFIG.BASE_URL}/api/system/ai-status`,
  
  // Chat endpoints  
  CHAT_SEND: `${API_CONFIG.BASE_URL}/api/chat/send`,
  CHAT_ASSIGN: `${API_CONFIG.BASE_URL}/api/chat/assign`,
  CHAT_TOGGLE_AI: `${API_CONFIG.BASE_URL}/api/chat/toggle-ai`,
}

// Development logging
if (API_CONFIG.ENV === 'development') {
  console.log('🔧 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    SOCKET_URL: API_CONFIG.SOCKET_URL,
    ENV: API_CONFIG.ENV
  })
}
