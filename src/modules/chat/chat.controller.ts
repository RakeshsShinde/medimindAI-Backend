// message.controller.ts

import { Response } from "express";
import { AuthenticatedRequest } from "../../types";

import {
  createNewChat,
  deleteChat,
  getUserChats,
  renameChat,
  getUserVaultFiles,
} from "./chat.services";
import { ApiError } from "../../utils/ApiError";
import { getChatMessages } from "../message/message.service";

// create new chat 
export async function createNewChatAPI(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized");

  const chat = await createNewChat(user.id);
  return res.status(201).json({ success: true, data: chat });
}


// get all chats 
export async function getUserChatsAPI(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized");

  const cursor = req.query.cursor as string;
  const limit = Number(req.query.limit || 15);

  const data = await getUserChats({ userId: user.id, cursor, limit });

  res.status(200).json({
    success: true,
    data,
  });
}


// rename chat 
export async function renameChatAPI(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized");

  const chatId = req.params.chatId as string;
  const { title } = req.body;
  const updatedChat = await renameChat({ chatId, userId: user.id, title });

  return res.status(200).json({
    success: true,
    data: updatedChat,
  });
}


// delete chat 
export async function deleteChatAPI(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized");
  const chatId = req.params.chatId as string;


  console.log({ chatId, user })
  const deletedChat = await deleteChat({ chatId, userId: user.id });

  return res.status(200).json({
    success: true,
    data: deletedChat,
  });
}

// get all files in the user's document vault
export async function getUserFilesAPI(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized");

  const files = await getUserVaultFiles(user.id);

  return res.status(200).json({
    success: true,
    data: files,
  });
}



