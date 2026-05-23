import express from "express";
import AdminController from "../controllers/admin.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// For a real production app, we should add an `isAdmin` middleware here.
// For now, we allow authenticated users to view the dashboard to demonstrate the functionality.
router.use(authenticateToken);

router.get("/stats", AdminController.getDashboardStats.bind(AdminController));

export default router;
