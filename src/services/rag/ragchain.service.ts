// services/rag/rag-chain.ts

import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { llm } from "../../config/langchain.config";
import { ragPromptTemplate, formatChatHistory } from "./prompt-builder";
import { retrieveContext, formatDocumentsAsString } from "./rag.service";
import { loadChatHistory } from "../../modules/chat/chat.services";

/**
 * Creates a complete RAG chain for a specific chat.
 *
 * This single chain replaces what was previously 4 separate manual calls in
 * message.services.ts and chat.services.ts:
 *   1. searchRelevantChunks(message, chatId)
 *   2. loadChatHistory(chatId)
 *   3. buildPrompt({ history, context, question })
 *   4. generateAIResponse(prompt)
 *
 * Now it's just: const answer = await chain.invoke(userMessage)
 *
 * The chain pipeline:
 *   userMessage
 *     → parallel: retrieve context docs + load chat history
 *     → format into prompt template (system + human messages)
 *     → send to Groq LLM
 *     → parse output string
 */
export function createRAGChain(chatId: string) {
    // Step 1: Prepare inputs — retrieve context and history in parallel
    const prepareInputs = RunnableLambda.from(async (question: string) => {
        const [contextDocs, history] = await Promise.all([
            retrieveContext(question, chatId),
            loadChatHistory(chatId),
        ]);

        return {
            context: formatDocumentsAsString(contextDocs),
            history: formatChatHistory(history),
            question,
        };
    });

    // Step 2: Build the chain
    const chain = RunnableSequence.from([
        prepareInputs,
        ragPromptTemplate,
        llm,
        new StringOutputParser(),
    ]);

    return chain;
}

/**
 * Creates a streaming RAG chain — same as above but returns a stream.
 * Use with: for await (const chunk of stream) { ... }
 */
export function createStreamingRAGChain(chatId: string) {
    return createRAGChain(chatId);
    // Usage: const stream = await chain.stream(userMessage);
}
