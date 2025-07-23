import express from "express"
import cors from "cors"
import requestIp from "request-ip"
import authRoutes from "./routes/authRoutes"
import adminRoutes from "./routes/adminRoutes"
import systemRoutes from "./routes/systemRoutes"
import { verifyToken } from "./middleware/verifyToken"
import { SERVER_CONFIG, getCorsOptions } from "./config"

const app = express()

// Trust proxy for accurate IP detection (important for production)
app.set('trust proxy', true)

// Environment-based CORS configuration
app.use(cors(getCorsOptions()))
app.use(express.json())

// Use request-ip middleware for consistent IP detection
app.use(requestIp.mw())

// Middleware to log real IP addresses
app.use((req, res, next) => {
  const realIP = (req as any).clientIp || 'unknown'
  console.log(`📡 Request from IP: ${realIP}`)
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", verifyToken, adminRoutes)
app.use("/api/system", systemRoutes)

app.get("/", (_, res) => res.send("Backend is live 🚀"))

export default app
