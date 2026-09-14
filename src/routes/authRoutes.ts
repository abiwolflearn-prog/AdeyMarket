import express from "express";
import { register, login, logout, refresh, resetPassword, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
