import bcrypt from "bcryptjs"
import { prisma } from "../prisma"

async function createAdmin() {
  try {
    const email = "admin@example.com"
    const plainPassword = "admin123"
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (existingAdmin) {
      console.log("❌ Admin already exists with email:", email)
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    
    // Create the admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword
      }
    })
    
    console.log("✅ Admin created successfully!")
    console.log("📧 Email:", email)
    console.log("🔑 Password:", plainPassword)
    console.log("🆔 Admin ID:", admin.id)
    
  } catch (error) {
    console.error("❌ Error creating admin:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
