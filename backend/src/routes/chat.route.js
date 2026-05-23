import express from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

// Get list of previous chat partners
router.get("/conversations", ChatController.getConversations);

// Get messages for a specific 1-on-1 chat
router.get("/messages", ChatController.getMessages);

export default router;
