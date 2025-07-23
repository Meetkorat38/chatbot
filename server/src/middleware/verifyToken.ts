import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  console.log("🔍 Auth header:", authHeader)
  
  const token = authHeader?.split(" ")[1]
  console.log("🔍 Extracted token:", token?.substring(0, 20) + "...")
  
  if (!token) return res.status(401).json({ error: "Unauthorized" })

  try {
    console.log("🔍 JWT_SECRET exists:", !!process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    console.log("✅ Token verified successfully:", decoded)
    ;(req as any).admin = decoded
   return next()
  } catch (err) {
    console.error("❌ Token verification failed:", err)
    res.status(403).json({ error: "Invalid token" })
  }
}
