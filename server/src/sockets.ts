import { Server } from "socket.io";
import { prisma } from "./prisma";
import OpenAI from "openai";
import { getRealClientIP } from "./utils/ipUtils";

export let io: Server;

export const setupSocket = (server: Server) => {
  io = server;
  
  io.on("connection", (socket) => {
    console.log("🔌 New user connected");

    socket.on("join", async ({ sessionId, userAgent }) => {
      try {
        // Get real client IP using request-ip library
        const clientIP = getRealClientIP(socket);
        
        console.log("🔍 Join request:", { sessionId, clientIP, userAgent });
        
        let user = await prisma.chatUser.findUnique({ where: { sessionId } });
        if (!user) {
          user = await prisma.chatUser.create({
            data: { 
              sessionId, 
              ipAddress: clientIP, 
              userAgent 
            },
          });
          console.log("✅ New user created:", user.id);
          
          // Emit new chat notification to admins
          io.emit("new-chat", {
            chatId: user.id,
            sessionId: user.sessionId,
            ipAddress: user.ipAddress,
            timestamp: new Date()
          });
        } else {
          // Update IP and last seen for existing user
          user = await prisma.chatUser.update({
            where: { sessionId },
            data: { 
              ipAddress: clientIP,
              lastSeen: new Date()
            }
          });
          console.log("✅ Existing user updated:", user.id);
        }

        // Store user info in socket
        (socket as any).data = { userId: user.id };
        socket.join(`user-${user.id}`);
        
        // Send initial greeting message
        socket.emit("message", {
          id: Date.now(),
          message: "Hello! How can I assist you today?",
          isFromUser: false,
          timestamp: new Date(),
          sender: "ai"
        });

      } catch (error) {
        console.error("❌ Error in join:", error);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    socket.on("message", async (data) => {
      try {
        // Handle both old format (just string) and new format (object)
        let sessionId, message;
        
        if (typeof data === 'string') {
          // Old format: just the message text
          message = data;
          // Get sessionId from socket data stored during join
          const userData = (socket as any).data;
          if (!userData?.userId) {
            socket.emit("error", { message: "Please rejoin the chat" });
            return;
          }
          
          // Find user by ID to get sessionId
          const user = await prisma.chatUser.findUnique({ where: { id: userData.userId } });
          if (!user) {
            socket.emit("error", { message: "User session not found" });
            return;
          }
          sessionId = user.sessionId;
        } else {
          // New format: object with sessionId and message
          sessionId = data.sessionId;
          message = data.message;
        }

        console.log("💬 Message received:", { sessionId, message });

        // Find user
        const user = await prisma.chatUser.findUnique({ where: { sessionId } });
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Save user message to database
        const userMessage = await prisma.message.create({
          data: {
            userId: user.id,
            content: message,
            sender: "user",
            isAi: false,
          },
        });

        // Emit message to admins with proper user identification
        io.emit("admin-message", {
          chatId: user.id,
          sessionId: user.sessionId,
          message: {
            ...userMessage,
            content: message
          },
          timestamp: new Date(),
          fromAdminId: null // User message, not from admin
        });

        // Generate AI response if AI is enabled
        if (user.aiEnabled) {
          try {
            const token = process.env["OPENAI_API_KEY"];
            const endpoint = "https://models.github.ai/inference";
            const model = "openai/gpt-4.1";

            const client = new OpenAI({ baseURL: endpoint, apiKey: token });

            const completion = await client.chat.completions.create({
              temperature: 1,
              top_p: 1,
              model: model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful customer service assistant. Keep responses concise and helpful.",
                },
                {
                  role: "user",
                  content: message,
                },
              ],
              max_tokens: 150,
            });

            const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request right now.";

            // Save AI response to database
            const aiMessage = await prisma.message.create({
              data: {
                userId: user.id,
                content: aiResponse,
                sender: "ai",
                isAi: true,
              },
            });

            // Send AI response to user
            socket.emit("message", {
              id: aiMessage.id,
              message: aiResponse,
              isFromUser: false,
              timestamp: aiMessage.createdAt,
              sender: "ai"
            });

            // Emit AI response to admins
            io.emit("admin-message", {
              chatId: user.id,
              sessionId: user.sessionId,
              message: {
                ...aiMessage,
                content: aiResponse
              },
              timestamp: new Date(),
              fromAdminId: null // AI message, not from admin
            });

          } catch (aiError: any) {
            console.error("❌ AI Error:", aiError);
            
            let fallbackMessage = "I'm currently experiencing high demand. A human agent will assist you shortly.";
            
            // Handle specific rate limit errors
            if (aiError.status === 429) {
              const waitTime = Math.ceil((aiError.headers?.['retry-after'] || 3600) / 3600);
              fallbackMessage = `⏳ AI is temporarily unavailable due to high demand (rate limit reached). Please wait approximately ${waitTime} hour(s) or a human agent will assist you shortly.`;
              console.log(`🚫 Rate limit hit. Retry after: ${aiError.headers?.['retry-after']} seconds`);
            } else if (aiError.status === 500) {
              fallbackMessage = "AI service is temporarily down. A human agent will help you shortly.";
            } else if (aiError.status === 401) {
              fallbackMessage = "AI service authentication issue. A human agent will assist you.";
            }

            // Save fallback message to database
            const fallbackAiMessage = await prisma.message.create({
              data: {
                userId: user.id,
                content: fallbackMessage,
                sender: "system",
                isAi: false,
              },
            });

            // Send fallback message to user
            socket.emit("message", {
              id: fallbackAiMessage.id,
              message: fallbackMessage,
              isFromUser: false,
              timestamp: fallbackAiMessage.createdAt,
              sender: "system"
            });

            // Emit fallback message to admins with priority flag
            io.emit("admin-message", {
              chatId: user.id,
              sessionId: user.sessionId,
              message: {
                ...fallbackAiMessage,
                content: fallbackMessage
              },
              timestamp: new Date(),
              fromAdminId: null,
              priority: true, // Flag for admin attention
              errorType: aiError.status === 429 ? "rate_limit" : "ai_error"
            });

            // Notify admins about the AI failure
            io.emit("ai-error-notification", {
              chatId: user.id,
              sessionId: user.sessionId,
              errorType: aiError.status === 429 ? "rate_limit" : "ai_error",
              message: `AI failed for user ${user.sessionId}: ${aiError.message}`,
              timestamp: new Date()
            });
          }
        }

      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.emit("error", { message: "Failed to process message" });
      }
    });

    socket.on("admin-message", async ({ chatId, message, adminId }) => {
      try {
        console.log("👨‍💼 Admin message:", { chatId, message, adminId });

        // Save admin message to database
        const adminMessage = await prisma.message.create({
          data: {
            userId: chatId,
            content: message,
            sender: "admin",
            isAi: false,
          },
        });

        // Emit message to specific user
        io.to(`user-${chatId}`).emit("message", {
          id: adminMessage.id,
          message,
          isFromUser: false,
          timestamp: adminMessage.createdAt,
          sender: "admin"
        });

        // Emit to other admins (but not to the sender to avoid duplicates)
        socket.broadcast.emit("admin-message", {
          chatId,
          message: {
            ...adminMessage,
            content: message
          },
          timestamp: new Date(),
          fromAdminId: adminId
        });

      } catch (error) {
        console.error("❌ Error processing admin message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("get-chat-history", async ({ sessionId }) => {
      try {
        const user = await prisma.chatUser.findUnique({ 
          where: { sessionId },
          include: {
            messages: {
              orderBy: { createdAt: "asc" }
            }
          }
        });

        if (user) {
          socket.emit("chat-history", {
            messages: user.messages.map(msg => ({
              id: msg.id,
              message: msg.content,
              isFromUser: msg.sender === "user",
              timestamp: msg.createdAt,
              sender: msg.sender
            }))
          });
        }
      } catch (error) {
        console.error("❌ Error fetching chat history:", error);
        socket.emit("error", { message: "Failed to fetch chat history" });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 User disconnected");
    });
  });

  return io;
};
