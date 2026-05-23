import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import projectRoutes from "./routes/project.route.js";
import profileRoutes from "./routes/profile.route.js";
import fileRoutes from "./routes/file.route.js";
import commitRoutes from "./routes/commit.route.js";
import collaborationRoutes from "./routes/collaboration.route.js";
import chatRoutes from "./routes/chat.route.js";

import "./config/passport.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",          
      "http://localhost:5170",          
      "https://openbox-dashboard.vercel.app", 
      "https://openbox-dev4ce.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// DB
connectDB();

// logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/user", profileRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/commits", commitRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/chat", chatRoutes);

//  public route with auth needed for testing
app.get("/ping", (req, res) => res.send("pong"));
app.get("/", (req, res) => {
  res.send("Server chal rha hain!");
});

export default app;