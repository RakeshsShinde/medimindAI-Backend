import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteChatAPI,
  getUserChatsAPI,
  renameChatAPI,
  createNewChatAPI,
} from "./chat.controller";
import { Authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/new/chat", Authenticate, asyncHandler(createNewChatAPI));
router.get("/recents", Authenticate, asyncHandler(getUserChatsAPI));
router.patch("/rename/:chatId", Authenticate, asyncHandler(renameChatAPI));
router.delete("/delete/:chatId", Authenticate, asyncHandler(deleteChatAPI));

export default router;

