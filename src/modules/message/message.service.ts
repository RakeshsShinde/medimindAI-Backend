import { db } from "../../config/db";
import { messages } from "../../db/Schema";
import { processUploadedFiles } from "../../services/file/file.service";
import { generateChatTitle } from "../../services/llm/llm.service";
import { createRAGChain } from "../../services/rag/ragchain.service";
import { updateChatTitle, validateChat, loadChatHistory } from "../chat/chat.services";
import { saveAssistantMessage } from "./message.controller";

// function to get chat messages with ownership validation
export async function getChatMessages({
    chatId,
    userId,
    limit = 50,
}: {
    chatId: string;
    userId: string;
    limit?: number;
}) {
    await validateChat(chatId, userId);
    return await loadChatHistory(chatId, limit);
}


export async function saveUserMessage(chatId: string, content: string) {
    const [message] = await db
        .insert(messages)
        .values({
            chatId,
            role: "user",
            content,
        })
        .returning();

    return message;
}


/**
 * Send message and get AI response via LangChain RAG chain.
 *  FLOW (1 chain call):
 *   createRAGChain(chatId).invoke(message)
 *   The chain internally does: retrieve context + load history + format prompt + call LLM
 */
export async function sendMessage({
    chatId,
    userId,
    message,
    files,
}: {
    chatId: string;
    userId: string;
    message: string;
    files?: Express.Multer.File[];
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

    //  searchRelevantChunks + loadChatHistory + buildPrompt + generateAIResponse
    const chain = createRAGChain(chatId);
    const answer = await chain.invoke(message);

    await saveAssistantMessage(chatId, answer);

    return {
        answer,
    };
}
