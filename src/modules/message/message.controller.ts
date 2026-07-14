import { Response } from "express";
import { db } from "../../config/db";
import { messages } from "../../db/Schema";
import { AuthenticatedRequest } from "../../types";
import { ApiError } from "../../utils/ApiError";
import { prepareChatForStreaming, loadChatHistory } from "../chat/chat.services";
import { getChatMessages } from "./message.service";
import { createRAGChain } from "../../services/rag/ragchain.service";
import { runToolAgent } from "../../services/Tools/tool-runner.service";
import { retrieveContext, formatDocumentsAsString } from "../../services/rag/rag.service";

export async function saveAssistantMessage(chatId: string, content: string, toolData?: any) {
    const [message] = await db
        .insert(messages)
        .values({
            chatId,
            role: "assistant",
            content,
            toolData: toolData ?? null,
        })
        .returning();

    return message;
}

/**
 * Streaming message handler — now uses LangChain chain.stream().
 *  FLOW:
 *   prepareChatForStreaming() → createRAGChain(chatId).stream(message) → LangChain chunk parsing
 */
export async function sendMessageHandler(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    const chatId = req.params.chatId as string;
    const message = req.body.message;
    const files = req.files as any;

    let existingFileIds: string[] | undefined = undefined;
    if (req.body.existingFileIds) {
        try {
            existingFileIds = typeof req.body.existingFileIds === "string"
                ? JSON.parse(req.body.existingFileIds)
                : req.body.existingFileIds;
        } catch (e) {
            existingFileIds = Array.isArray(req.body.existingFileIds)
                ? req.body.existingFileIds
                : [req.body.existingFileIds];
        }
    }

    // Prepare: save user message, process files, generate title
    const { chatId: preparedChatId, message: preparedMessage } =
        await prepareChatForStreaming({
            chatId,
            userId,
            message,
            files,
            existingFileIds,
        });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {

        const rawHistory = await loadChatHistory(preparedChatId, 20);
        const chatHistory = rawHistory
            .slice(0, -1) // exclude current user message
            .map((m) => ({ role: m.role, content: m.content }));

        // Retrieve document context FIRST so the tool agent can extract
        // real values (e.g. weight/height) from any uploaded file,
        // rather than guessing from the user's text alone.
        const contextDocs = await retrieveContext(preparedMessage, preparedChatId);
        const docContext = formatDocumentsAsString(contextDocs);

        // Run tool agent with full context (message + history + doc context)
        const { toolResult, toolContext } = await runToolAgent(preparedMessage, chatHistory, docContext);

        if (toolResult) {
            res.write(`data: ${JSON.stringify({ toolResult })}\n\n`);
        }
        // Pass pre-fetched context to the RAG chain so it doesn't re-retrieve
        const chain = createRAGChain(preparedChatId, toolContext, docContext);

        const stream = await chain.stream(preparedMessage);
        let fullAnswer = "";
        for await (const chunk of stream) {
            // LangChain StringOutputParser gives clean string chunks directly
            if (chunk) {
                fullAnswer += chunk;
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        }
        await saveAssistantMessage(preparedChatId, fullAnswer, toolResult);
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

