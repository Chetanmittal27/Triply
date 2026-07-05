import { Router } from "express";
import {loginUser, logoutUser, RefreshAccessToken, registerUser, verifyEmail} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },

        {
            name: "coverImage",
            maxCount: 1
        }
    ]),

    registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT , logoutUser);
router.route("/refreshaccessToken").post(RefreshAccessToken);
router.route("/verify-email").get(verifyEmail);

export default Router;