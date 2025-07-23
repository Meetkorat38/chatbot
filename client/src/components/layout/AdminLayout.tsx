"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { RootState } from "@/store"
import { logout } from "@/store/authSlice"
import { Button } from "@/components/ui/button"
import { NotificationSystem } from "@/components/notifications/NotificationSystem"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { admin } = useSelector((state: RootState) => state.auth)
  const [currentDate, setCurrentDate] = useState<string>("")

  // Set date on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-gray-800">ChatBot Admin</h1>
        </div>
        
        <nav className="mt-8">
          <Link 
            href="/admin/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/admin/chats"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            💬 Live Chats
          </Link>
          <Link 
            href="/admin/analytics"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            📈 Analytics
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">
            Logged in as: {admin?.email}
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Admin Dashboard
          </h2>
          <div className="flex items-center space-x-4">
            <NotificationSystem />
            <div className="text-sm text-gray-500">
              {currentDate}
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
