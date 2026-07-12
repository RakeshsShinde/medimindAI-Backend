import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";
import { rerankDocuments } from "./re-ranker.service";
import { db } from "../../config/db";
import { eq, inArray } from "drizzle-orm";
import { messageFiles, messages } from "../../db/Schema";

/**
 * Gets all unique file IDs attached to any message in a given chat.
 */
export async function getChatAttachedFileIds(chatId: string): Promise<string[]> {
    const chatMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.chatId, chatId));

    if (chatMessages.length === 0) return [];

    const messageIds = chatMessages.map((m) => m.id);
    const linkedFiles = await db
        .select({ fileId: messageFiles.fileId })
        .from(messageFiles)
        .where(inArray(messageFiles.messageId, messageIds));

    return [...new Set(linkedFiles.map((lf) => lf.fileId))];
}

export async function createRetriever(chatId: string, fileIds: string[]) {
    const vectorStore = await getVectorStore("medical_chunks");

    // Build a Qdrant filter that:
    //  - `must`: scopes to this chat's chatId (maintains full chat context)
    //  - `should`: if specific fileIds are attached, prefer chunks from those files
    const filter: Record<string, any> = {
        must: [
            {
                key: "metadata.chatId",
                match: { value: chatId },
            },
        ],
    };

    // If fileIds are available, add a should clause to prefer those files
    if (fileIds.length > 0) {
        filter.should = fileIds.map((fileId) => ({
            key: "metadata.fileId",
            match: { value: fileId },
        }));
    }

    return vectorStore.asRetriever({
        k: 8,
        filter,
    });
}

export async function retrieveContext(question: string, chatId: string): Promise<Document[]> {
    const fileIds = await getChatAttachedFileIds(chatId);

    // If no files have been uploaded/linked in this chat, skip vector search entirely
    if (fileIds.length === 0) {
        return [];
    }

    const retriever = await createRetriever(chatId, fileIds);
    const docs = await retriever.invoke(question);

    // rerank condidates and select the top 5 most relevent documents 
    const rerankedDocs = await rerankDocuments(question, docs, 5);
    return rerankedDocs;
}



/**
 * Formats retrieved documents into a string for the prompt.
 */
export function formatDocumentsAsString(docs: Document[]): string {
    if (docs.length === 0) return "No relevant documents found.";
    return docs
        .map((doc, i) => {
            const source = doc.metadata?.source || "Unknown";
            const page = doc.metadata?.loc?.pageNumber
                ? ` (Page ${doc.metadata.loc.pageNumber})`
                : "";
            return `[Source ${i + 1}: ${source}${page}]\n${doc.pageContent}`;
        })
        .join("\n\n---\n\n");
}


export async function searchRelevantChunks(question: string, chatId: string): Promise<string> {
    const docs = await retrieveContext(question, chatId);
    return formatDocumentsAsString(docs);
}
