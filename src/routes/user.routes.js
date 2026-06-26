import { Router } from "express";
import {registerUser} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";

const Router = Router();

Router.route("/register").post(
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


export default Router;