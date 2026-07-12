import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteChatAPI,
  getUserChatsAPI,
  renameChatAPI,
  createNewChatAPI,
  getUserFilesAPI,
} from "./chat.controller";
import { Authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/new/chat", Authenticate, asyncHandler(createNewChatAPI));
router.get("/recents", Authenticate, asyncHandler(getUserChatsAPI));
router.patch("/rename/:chatId", Authenticate, asyncHandler(renameChatAPI));
router.delete("/delete/:chatId", Authenticate, asyncHandler(deleteChatAPI));
router.get("/files/vault", Authenticate, asyncHandler(getUserFilesAPI));

export default router;

