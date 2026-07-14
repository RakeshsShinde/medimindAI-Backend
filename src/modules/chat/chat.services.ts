import { ApiError } from "../../utils/ApiError";
import { db } from "../../config/db";
import { chats } from "../../db/Schema/chats";
import { and, desc, eq, lt } from "drizzle-orm";
import { processUploadedFiles } from "../../services/file/file.service";
import {
  generateChatTitle,
} from "../../services/llm/llm.service";
import { messages, messageFiles, files } from "../../db/Schema";
import { saveUserMessage } from "../message/message.service";

export const validateChat = async (chatId: string, userId: string) => {
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!chat) {
    throw new ApiError(400, "Chat not found!");
  }

  return chat;
};




export async function loadChatHistory(chatId: string, limit = 20) {
  const history = await db.query.messages.findMany({
    where: eq(messages.chatId, chatId),
    orderBy: desc(messages.createdAt),
    limit,
    with: {
      files: {
        with: {
          file: true,
        },
      },
    },
  });

  return history.reverse().map((msg) => {
    const mappedFiles = msg.files
      ?.map((mf) => mf.file)
      .filter((f) => f !== null);

    return {
      id: msg.id,
      chatId: msg.chatId,
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
      createdAt: msg.createdAt,
      files: mappedFiles || [],
      toolData: msg.toolData || undefined,
    };
  });
}



export async function createChat(userId: string) {
  const [chat] = await db
    .insert(chats)
    .values({
      userId,
      title: "new chat",
    })
    .returning();

  return chat;
}

export async function updateChatTitle(chatId: string, title: string) {
  await db
    .update(chats)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId));
}


// function to get user recents chats
export async function getUserChats({
  userId,
  cursor,
  limit = 20,
}: {
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const query = await db.query.chats.findMany({
    where: cursor
      ? and(eq(chats.userId, userId), lt(chats.updatedAt, new Date(cursor)))
      : eq(chats.userId, userId),
    orderBy: desc(chats.updatedAt),
    limit: limit + 1,
  });

  const hasMore = query.length > limit;

  const chatsData = hasMore ? query.slice(0, limit) : query;

  const nextCursor = hasMore
    ? (chatsData[chatsData.length - 1].updatedAt?.toISOString() ?? null)
    : null;

  return {
    chats: chatsData,
    nextCursor,
    hasMore,
  };
}

// function to rename the existing chat

export async function renameChat({
  chatId,
  userId,
  title,
}: {
  chatId: string;
  userId: string;
  title: string;
}) {
  // first check if chat is present or not
  await validateChat(chatId, userId);

  const [chat] = await db
    .update(chats)
    .set({
      title: title.trim(),
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId))
    .returning();

  return chat;
}

//

export async function deleteChat({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}) {
  // first check if chat is present or not
  await validateChat(chatId, userId);

  const [chat] = await db.delete(chats).where(eq(chats.id, chatId)).returning();

  return chat;
}


// function to create new chat 
export async function createNewChat(userId: string) {
  const [chat] = await db.insert(chats).values({ userId, title: "new chat" }).returning();
  console.log("chat generated  : ", chat);
  return chat;
}


// function to prepare chat for streaming — now returns chatId for chain creation
export async function prepareChatForStreaming({
  chatId,
  userId,
  message,
  files,
  existingFileIds,
}: {
  chatId: string;
  userId: string;
  message: string;
  files?: Express.Multer.File[];
  existingFileIds?: string[];
}) {
  let chat = await validateChat(chatId, userId);
  const savedMsg = await saveUserMessage(chatId, message);
  // check if new chat then add the proper name for chat
  if (chat.title === "new chat") {
    const generatedTitle = await generateChatTitle(message);
    await updateChatTitle(chatId, generatedTitle);
  }
  if (files?.length) {
    await processUploadedFiles(files, chatId, userId, savedMsg.id);
  }
  if (existingFileIds?.length) {
    for (const fileId of existingFileIds) {
      await db.insert(messageFiles).values({
        messageId: savedMsg.id,
        fileId,
      });
    }
  }
  // Return chatId + message — the controller will create the chain and stream
  return { chatId, message };
}

// function to get all files in the user's document vault
export async function getUserVaultFiles(userId: string) {
  return await db
    .select()
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(desc(files.createdAt));
}