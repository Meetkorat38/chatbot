import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// Store rate limit info (in production, use Redis or database)
let lastRateLimitError: {
  timestamp: Date;
  retryAfter: number;
  message: string;
} | null = null;

// Function to update rate limit status (called from sockets)
export const updateRateLimitStatus = (retryAfter: number, message: string) => {
  lastRateLimitError = {
    timestamp: new Date(),
    retryAfter,
    message
  };
};

// Get AI service status
router.get("/ai-status", verifyToken, (req, res) => {
  const now = new Date();
  
  let status = {
    aiAvailable: true,
    rateLimited: false,
    retryAfter: 0,
    message: "AI service is operational"
  };

  if (lastRateLimitError) {
    const timeSinceError = (now.getTime() - lastRateLimitError.timestamp.getTime()) / 1000;
    const remainingWait = Math.max(0, lastRateLimitError.retryAfter - timeSinceError);
    
    if (remainingWait > 0) {
      status = {
        aiAvailable: false,
        rateLimited: true,
        retryAfter: remainingWait,
        message: `Rate limited. ${Math.ceil(remainingWait / 3600)} hours remaining`
      };
    } else {
      // Rate limit has expired, clear it
      lastRateLimitError = null;
    }
  }

  res.json(status);
});

export default router;
