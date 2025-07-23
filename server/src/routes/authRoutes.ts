import express from "express"
import bcrypt from "bcryptjs"
import { prisma } from "../prisma"
import { generateToken } from "../utils/generateToken"

const router = express.Router()

router.post("/login", async (req, res) => {
  try {
    console.log("🔍 Login attempt:", { email: req.body.email })
    const { email, password } = req.body
    
    const admin = await prisma.admin.findUnique({ where: { email } })
    console.log("🔍 Admin found:", !!admin)
    
    if (!admin) return res.status(401).json({ error: "Invalid Email" })

    const isMatch = await bcrypt.compare(password, admin.password)
    console.log("🔍 Password match:", isMatch)
    
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" })

    const token = generateToken(admin.id)
    console.log("✅ Token generated:", token.substring(0, 20) + "...")
    
    return res.json({ 
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

export default router

