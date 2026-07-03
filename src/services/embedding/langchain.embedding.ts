// services/embedding/embedding.service.ts

import { embeddings } from "../../config/langchain.config";

/**
 * Generate embedding for a single text string using LangChain OllamaEmbeddings.
 *
 * This is now mostly unused directly — LangChain's QdrantVectorStore handles
 * embeddings internally during addDocuments() and similarity search.
 * Kept for any standalone embedding needs.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    return await embeddings.embedQuery(text);
}

/**
 * Generate embeddings for multiple texts in batch.
 * More efficient than calling generateEmbedding() in a loop.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    return await embeddings.embedDocuments(texts);
}
