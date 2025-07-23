import app from "./app"
import http from "http"
import { Server } from "socket.io"
import { setupSocket } from "./sockets"
import { SERVER_CONFIG, getCorsOptions } from "./config"

const server = http.createServer(app)

// Environment-based Socket.IO CORS configuration
const io = new Server(server, { 
  cors: getCorsOptions() 
})

setupSocket(io)

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_CONFIG.PORT}`)
  console.log(`🌐 Environment: ${SERVER_CONFIG.ENV}`)
  console.log(`🔌 Socket.IO enabled for real-time features`)
})
