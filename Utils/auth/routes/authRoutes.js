// routes/authRoutes.js
import { Router } from "express";
import { registerUser, loginUser, validateToken } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Validate Token
router.get("/validate", protect, validateToken);

export default router;