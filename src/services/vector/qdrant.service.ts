import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";
import { env } from "../../config/env";



/**
 * Creates payload indexes on the Qdrant collection so that filtering
 * by chatId and fileId is fast. Safe to call on every startup —
 * Qdrant ignores the request if the index already exists.
 */
export async function ensureQdrantIndexes(): Promise<void> {
    const base = `${env.QDRANT_URL}/collections/${env.COLLECTION}/index`;
    const headers = {
        "api-key": env.QDRANT_API_KEY,
        "Content-Type": "application/json",
    };

    const fields = [
        { field_name: "metadata.chatId", field_schema: "keyword" },
        { field_name: "metadata.fileId", field_schema: "keyword" },
        { field_name: "metadata.userId", field_schema: "keyword" },
    ];

    await Promise.all(
        fields.map((body) =>
            fetch(base, {
                method: "PUT",
                headers,
                body: JSON.stringify(body),
            })
        )
    );

    console.log(`[Qdrant] Payload indexes ensured on ${env.COLLECTION}`);
}


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

    const vectorStore = await getVectorStore(env.COLLECTION);
    await vectorStore.addDocuments(enrichedDocs);
}
