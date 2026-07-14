import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { llm } from "../../config/langchain.config";
import { ragPromptTemplate, bmiRagPromptTemplate, formatChatHistory } from "./prompt-builder";
import { retrieveContext, formatDocumentsAsString } from "./rag.service";
import { loadChatHistory } from "../../modules/chat/chat.services";

/**
 * Creates a complete RAG chain for a specific chat.
 * The chain pipeline:
 *   userMessage
 *     → parallel: retrieve context docs + load chat history
 *     → format into prompt template (system + human messages)
 *     → send to Groq LLM
 *     → parse output string
 */
export function createRAGChain(chatId: string, toolContext: string = '', preloadedContext?: string) {
    // Step 1: Prepare inputs — retrieve context and history in parallel
    const prepareInputs = RunnableLambda.from(async (question: string) => {
        const [contextDocs, history] = await Promise.all([
            // If the controller already retrieved context (to share with the tool agent),
            // skip the vector search to avoid a duplicate round-trip.
            preloadedContext !== undefined
                ? Promise.resolve(null)
                : retrieveContext(question, chatId),
            loadChatHistory(chatId),
        ]);

        return {
            context: preloadedContext !== undefined
                ? preloadedContext
                : formatDocumentsAsString(contextDocs!),
            history: formatChatHistory(history),
            toolContext,
            question,
        };
    });

    // Step 2: Dynamically select prompt template based on tool result presence
    const hasBmiData = toolContext && toolContext.includes('"bmi"');
    const promptTemplate = hasBmiData ? bmiRagPromptTemplate : ragPromptTemplate;

    // Step 3: Build the chain
    const chain = RunnableSequence.from([
        prepareInputs,
        promptTemplate,
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
