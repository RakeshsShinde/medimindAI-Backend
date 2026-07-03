import { Router } from "express";
import { Authenticate } from "../../middlewares/auth.middleware";
import { documentUpload } from "../../middlewares/upload.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getChatMessagesAPI, sendMessageHandler } from "./message.controller";

const router = Router();

// send message  
router.post(
    "/send/:chatId",
    Authenticate,
    documentUpload.array("files", 5),
    asyncHandler(sendMessageHandler),
);
// get chat messages 
router.get("/:chatId", Authenticate, asyncHandler(getChatMessagesAPI));

export default router;

