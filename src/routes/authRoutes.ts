import express from "express";
import { register, login, logout, refresh, resetPassword } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/reset-password", resetPassword);

export default router;
