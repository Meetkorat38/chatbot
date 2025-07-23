import { prisma } from "../prisma"
import { Request, Response } from "express"
import { io } from "../sockets" // You’ll expose io globally


export const getAllChats = async (_: Request, res: Response) => {
  const chats = await prisma.chatUser.findMany({
    select: {
      id: true,
      sessionId: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      aiEnabled: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  res.json(chats)
}


export const replyToChat = async (req: Request, res: Response) => {
  const { content, userId } = req.body
  const adminId = (req as any).admin?.id // Get admin ID from JWT
  
  const message = await prisma.message.create({
    data: {
      content,
      sender: "admin",
      userId,
    },
  })

  // Find the user to get their session ID for targeting the right socket
  const user = await prisma.chatUser.findUnique({ where: { id: userId } })
  
  if (user) {
    // Emit to specific user socket room (so user sees admin message)
    io.to(`user-${userId}`).emit("message", {
      id: message.id,
      message: content,
      isFromUser: false,
      timestamp: message.createdAt,
      sender: "admin"
    })
    
    // Emit to admin panel for real-time updates to OTHER admins only
    // Don't emit to the admin who sent the message to avoid duplicates
    io.emit("admin-message", {
      chatId: userId,
      sessionId: user.sessionId,
      message: {
        ...message,
        content: content // Ensure content is properly set
      },
      timestamp: new Date(),
      fromAdminId: adminId // Identify which admin sent it
    })
  }

  res.json(message)
}

export const assignChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body
    const adminId = (req as any).admin.id // From JWT middleware

    const updatedChat = await prisma.chatUser.update({
      where: { id: chatId },
      data: { assignedAdmin: adminId },
    })

    // Emit assignment notification
    io.emit("chat-assigned", { chatId, adminId })

    res.json({ success: true, chat: updatedChat })
  } catch (error) {
    console.error("Error assigning chat:", error)
    res.status(500).json({ error: "Failed to assign chat" })
  }
}

export const toggleAI = async (req: Request, res: Response) => {
  try {
    const { chatId, aiEnabled } = req.body

    const updatedChat = await prisma.chatUser.update({
      where: { id: chatId },
      data: { aiEnabled },
    })

    // Emit AI toggle notification
    io.emit("ai-toggled", { chatId, aiEnabled })

    res.json({ success: true, chat: updatedChat })
  } catch (error) {
    console.error("Error toggling AI:", error)
    res.status(500).json({ error: "Failed to toggle AI" })
  }
}

export const getChatStats = async (_: Request, res: Response) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const [
      totalChats,
      todayChats,
      totalMessages,
      todayMessages,
      activeChats,
      aiEnabledChats
    ] = await Promise.all([
      prisma.chatUser.count(),
      prisma.chatUser.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.message.count(),
      prisma.message.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.chatUser.count({
        where: {
          messages: {
            some: {
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),
      prisma.chatUser.count({
        where: { aiEnabled: true }
      })
    ])

    res.json({
      totalChats,
      todayChats,
      totalMessages,
      todayMessages,
      activeChats,
      aiEnabledChats
    })
  } catch (error) {
    console.error("Error getting chat stats:", error)
    res.status(500).json({ error: "Failed to get stats" })
  }
}

export const getChatById = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params

    const chat = await prisma.chatUser.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" })
    }

    return res.json(chat)
  } catch (error) {
    console.error("Error getting chat:", error)
    return res.status(500).json({ error: "Failed to get chat" })
  }
}
