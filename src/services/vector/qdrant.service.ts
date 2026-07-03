import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";


/**
 * Indexes LangChain Documents into Qdrant via LangChain's QdrantVectorStore.
 *
 * KEY IMPROVEMENTS over old indexChunks():
 * - Old code: generated embeddings one-by-one in a loop, then upserted
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



/**
 * @deprecated Use indexDocuments() instead. Kept for backward compatibility.
 */

export async function indexChunks({
    chunks,
    chatId,
    userId,
    fileId,
}: {
    chunks: string[];
    chatId: string;
    userId: string;
    fileId?: string;
    fileName?: string;
}) {
    const docs = chunks.map(
        (chunk) =>
            new Document({
                pageContent: chunk,
                metadata: {},
            })
    );
    await indexDocuments({ documents: docs, chatId, userId, fileId });
}

