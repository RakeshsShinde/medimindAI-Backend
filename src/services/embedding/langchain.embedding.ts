// services/embedding/embedding.service.ts

import { embeddings } from "../../config/langchain.config";

export async function generateEmbedding(text: string): Promise<number[]> {
    return await embeddings.embedQuery(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    return await embeddings.embedDocuments(texts);
}
