"use client"
import { ChatWidget } from "@/components/chat/ChatWidget"

export default function Home() {
  return (
    <main>
      <h1 className="text-center text-2xl mt-4">Welcome to Our Site</h1>
      <ChatWidget />
    </main>
  )
}
