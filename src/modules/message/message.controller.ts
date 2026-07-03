import { Response } from "express";
import { db } from "../../config/db";
import { messages } from "../../db/Schema";
import { AuthenticatedRequest } from "../../types";
import { ApiError } from "../../utils/ApiError";
import { prepareChatForStreaming } from "../chat/chat.services";
import { getChatMessages } from "./message.service";
import { createRAGChain } from "../../services/rag/ragchain.service";

export async function saveAssistantMessage(chatId: string, content: string) {
    const [message] = await db
        .insert(messages)
        .values({
            chatId,
            role: "assistant",
            content,
        })
        .returning();

    return message;
}

/**
 * Streaming message handler — now uses LangChain chain.stream().
 *
 * OLD FLOW:
 *   prepareChatPrompt() → generateAIResponseStream(prompt) → manual Groq chunk parsing
 *
 * NEW FLOW:
 *   prepareChatForStreaming() → createRAGChain(chatId).stream(message) → LangChain chunk parsing
 *
 * LangChain's .stream() outputs clean string chunks directly —
 * no need to dig into choices[0].delta.content anymore.
 */
export async function sendMessageHandler(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    const chatId = req.params.chatId as string;
    const message = req.body.message;
    const files = req.files as any;
    // Prepare: save user message, process files, generate title
    const { chatId: preparedChatId, message: preparedMessage } =
        await prepareChatForStreaming({
            chatId,
            userId,
            message,
            files,
        });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
        // Create LangChain RAG chain and stream the response
        const chain = createRAGChain(preparedChatId);
        const stream = await chain.stream(preparedMessage);
        let fullAnswer = "";
        for await (const chunk of stream) {
            // LangChain StringOutputParser gives clean string chunks directly
            if (chunk) {
                fullAnswer += chunk;
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        }
        await saveAssistantMessage(preparedChatId, fullAnswer);
        res.write("data: [DONE]\n\n");
    } catch (error: any) {
        console.error("Stream generation error:", error);
        res.write(
            `data: ${JSON.stringify({ error: error.message || "Failed to generate stream" })}\n\n`
        );
    } finally {
        res.end();
    }
}




export async function getChatMessagesAPI(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    if (!user) throw new ApiError(401, "Unauthorized");

    const chatId = req.params.chatId as string;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const data = await getChatMessages({ chatId, userId: user.id, limit });

    return res.status(200).json({
        success: true,
        data,
    });
}

