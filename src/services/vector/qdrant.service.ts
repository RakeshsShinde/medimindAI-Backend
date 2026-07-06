import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";


/**
 * Indexes LangChain Documents into Qdrant via LangChain's QdrantVectorStore.
 * - New code: LangChain batches embedding generation + upsert internally
 * - Metadata (chatId, userId, page number, source) all stored automatically
 */

export async function indexDocuments({
    documents,
    chatId,
    userId,
    fileId
}: {
    documents: Document[];
    chatId: string;
    userId: string;
    fileId?: string;
}) {
    const enrichedDocs = documents.map((doc) => {
        return new Document({
            pageContent: doc.pageContent,
            metadata: {
                ...doc.metadata,
                chatId,
                userId,
                fileId
            }
        })
    })

    const vectorStore = await getVectorStore("medical_chunks");
    await vectorStore.addDocuments(enrichedDocs);
}
