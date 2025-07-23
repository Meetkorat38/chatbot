import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

async function testJWT() {
  try {
    const testId = "test-admin-id"
    const secret = process.env.JWT_SECRET
    
    console.log("🔍 JWT_SECRET exists:", !!secret)
    console.log("🔍 JWT_SECRET value:", secret)
    
    // Generate token
    const token = jwt.sign({ id: testId }, secret!, { expiresIn: "1d" })
    console.log("✅ Token generated:", token)
    
    // Verify token
    const decoded = jwt.verify(token, secret!)
    console.log("✅ Token verified:", decoded)
    
  } catch (error) {
    console.error("❌ JWT test failed:", error)
  }
}

testJWT()
