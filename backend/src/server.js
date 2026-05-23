import app from "./app.js";
import dotenv from "dotenv";
import cron from "node-cron";
import axios from "axios";
import { createServer } from "http";
import { Server } from "socket.io";
import { Message } from "./models/message.model.js";

dotenv.config();

// ==================================
// KEEP-ALIVE CRON JOB (Runs every 10 minutes)
// ==================================
const RENDER_URL = process.env.API_BASE_URL || "https://openbox-0tuh.onrender.com";

cron.schedule("*/10 * * * *", async () => {
  console.log("⏱️ Cron Job Triggered: Pinging server to keep it alive...");
  try {
    await axios.get(`${RENDER_URL}/ping`);
    console.log("✅ Keep-alive ping successful.");
  } catch (error) {
    console.error("❌ Keep-alive ping failed:", error.message);
  }
});

// Remove old setInterval strategy in favor of the controlled cron
// ==================================
// Start Server

const PORT = process.env.PORT || 5170;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://openbox-dashboard.vercel.app",
      "https://openbox-dev4ce.vercel.app"
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User joins their own personal room to receive messages
  socket.on("join_own_room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} bound to own socket room`);
  });

  socket.on("send_message", async (data) => {
    try {
      // Save Message to DB
      const newMessage = await Message.create({
        sender: data.senderId,
        receiver: data.receiverId,
        content: data.content,
      });

      // Populate data before emitting
      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "name email pfp")
        .populate("receiver", "name email pfp");

      // Broadcast to both the sender's own room and the receiver's own room
      io.to(data.receiverId).to(data.senderId).emit("receive_message", populatedMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
