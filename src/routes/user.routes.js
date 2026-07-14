import { Router } from "express";
import { getProfile, updateProfile, updateAvatar, updateCoverImage, changePassword } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
const router = Router(); router.use(verifyJWT); router.get("/me", getProfile); router.patch("/me", updateProfile); router.patch("/me/avatar", upload.single("avatar"), updateAvatar); router.patch("/me/cover-image", upload.single("coverImage"), updateCoverImage); router.patch("/me/password", changePassword); export default router;
