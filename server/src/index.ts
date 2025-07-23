import app from "./app"
import http from "http"
import { Server } from "socket.io"
import { setupSocket } from "./sockets"

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

setupSocket(io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`📡 CORS enabled for all origins`)
console.log(`🔌 Socket.IO enabled for real-time features`)
