import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  isLoggedIn: boolean
  admin: { id: string; email: string } | null
}

// Load token from localStorage/cookies if available
const loadTokenFromStorage = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || getCookie("authToken")
  }
  return null
}

// Helper function to get cookie
const getCookie = (name: string): string | null => {
  if (typeof document !== "undefined") {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  }
  return null
}

// Helper function to set cookie
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=strict`
  }
}

// Helper function to remove cookie
const removeCookie = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}

const initialState: AuthState = {
  token: loadTokenFromStorage(),
  isLoggedIn: !!loadTokenFromStorage(),
  admin: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; admin: { id: string; email: string } }>) => {
      state.token = action.payload.token
      state.admin = action.payload.admin
      state.isLoggedIn = true
      
      // Save to both localStorage and cookies for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", action.payload.token)
        localStorage.setItem("adminData", JSON.stringify(action.payload.admin))
        setCookie("authToken", action.payload.token)
      }
    },
    logout: (state) => {
      state.token = null
      state.admin = null
      state.isLoggedIn = false
      
      // Remove from storage and cookies
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("adminData")
        removeCookie("authToken")
      }
    },
    setAdmin: (state, action: PayloadAction<{ id: string; email: string }>) => {
      state.admin = action.payload
    },
  },
})

export const { loginSuccess, logout, setAdmin } = authSlice.actions
export default authSlice.reducer
