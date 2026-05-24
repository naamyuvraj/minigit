import { Message } from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const ChatController = {
  getMessages: async (req, res) => {
    try {
      const { userId } = req.query;
      const currentUserId = req.user._id;

      if (!userId) return res.status(400).json({ error: "userId is required" });

      const messages = await Message.find({
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId },
        ],
      })
        .populate("sender", "name email avatarUrl username")
        .populate("receiver", "name email avatarUrl username")
        .sort({ createdAt: 1 })
        .limit(200);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },

  getConversations: async (req, res) => {
    try {
      const currentUserId = req.user._id;

      // Find all unique users the current user has exchanged messages with
      const messages = await Message.find({
        $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      })
        .sort({ createdAt: -1 })
        .populate("sender", "name email avatarUrl username")
        .populate("receiver", "name email avatarUrl username");

      const conversationMap = new Map();

      messages.forEach((msg) => {
        const otherUser =
          msg.sender._id.toString() === currentUserId.toString()
            ? msg.receiver
            : msg.sender;

        if (otherUser && !conversationMap.has(otherUser._id.toString())) {
          conversationMap.set(otherUser._id.toString(), {
            user: otherUser,
            lastMessage: msg,
          });
        }
      });

      const conversations = Array.from(conversationMap.values());
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  },
};
