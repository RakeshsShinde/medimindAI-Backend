import { Router } from "express";
import { imageUpload } from "../../middlewares/upload.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginAPI, registerAPI, logoutAPI, refreshTokenAPI, googleLoginAPI } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { LoginSchema, registerSchema, refreshSchema } from "./auth.validation";
import { Authenticate } from "../../middlewares/auth.middleware";
import passport from "../../config/passport.config";
const router = Router();

router.post(
    "/register",
    imageUpload.single("profilePic"),
    validate({ body: registerSchema }),
    asyncHandler(registerAPI)
);

router.post('/login', validate({ body: LoginSchema }), asyncHandler(loginAPI));

router.post('/refresh/token', asyncHandler(refreshTokenAPI));

router.get('/dashboard', Authenticate, asyncHandler((req: Request, res: Response) => {
    console.log("dashboard data api called ")
}));

router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/",
    }),
    asyncHandler(googleLoginAPI),
);

router.post('/logout', Authenticate, asyncHandler(logoutAPI));

export default router;


