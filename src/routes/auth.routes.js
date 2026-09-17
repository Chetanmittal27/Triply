import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  verifyEmail,
  resendVerifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { rateLimit } from "../middlewares/rateLimit.middlewares.js";
const router = Router();
router.post(
  "/register",
  rateLimit({ max: 5 }),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.post("/login", rateLimit({ max: 10 }), loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-access-token", RefreshAccessToken);
router.post("/forgot-password", rateLimit({ max: 3 }), forgotPassword);
router.post("/reset-password", rateLimit({ max: 5 }), resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verify-email", rateLimit({ max: 3 }), resendVerifyEmail);
export default router;
