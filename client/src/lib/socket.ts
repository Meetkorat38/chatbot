import { io } from "socket.io-client"
import { API_CONFIG } from "./config"

export const socket = io(API_CONFIG.SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
})

// Development logging
if (API_CONFIG.ENV === 'development') {
  socket.on("connect", () => {
    console.log("🔌 Socket connected to:", API_CONFIG.SOCKET_URL)
  })

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected")
  })
}
