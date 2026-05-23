import express from "express";
import AdminController from "../controllers/admin.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Restrict admin access
const isAdmin = (req, res, next) => {
  // In a real app, check req.user.role === 'admin'
  // Here we secure it by returning a 403 Forbidden to regular users.
  // To test the admin panel, you'd insert your own email.
  if (req.user && req.user.email === "admin@example.com") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

router.use(authenticateToken);
router.use(isAdmin);

router.get("/stats", AdminController.getDashboardStats.bind(AdminController));

export default router;
