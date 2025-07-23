import express from "express"
import { getAllChats, replyToChat, assignChat, toggleAI, getChatStats, getChatById } from "../controllers/chatController"

const router = express.Router()

router.get("/chats", getAllChats)
router.get("/chat/:chatId", getChatById)
router.post("/reply", replyToChat)
router.post("/assign-chat", assignChat)
router.patch("/toggle-ai", toggleAI)
router.get("/stats", getChatStats)

export default router
