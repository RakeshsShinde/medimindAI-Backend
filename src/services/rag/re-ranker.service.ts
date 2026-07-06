import { Document } from '@langchain/core/documents';
import { env } from '../../config/env';

export interface RerankResult {
    index: number;
    relevance_score: number;
}


export interface RerankResponse {
    id: string,
    results: RerankResult[];
}

export async function rerankDocuments(
    query: string,
    docs: Document[],
    topN: number = 5
): Promise<Document[]> {
    if (docs.length === 0) {
        return [];
    }

    const apiKey = env.COHERE_API_KEY;
    if (!apiKey) {
        console.warn(
            "[RerankerService] COHERE_API_KEY is not set. Gracefully falling back to returning the first topN documents from vector search."
        );
        return docs.slice(0, topN);
    }

    try {
        const response = await fetch("https://api.cohere.com/v2/rerank", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "rerank-v3.5",
                query: query,
                documents: docs.map((doc) => doc.pageContent),
                top_n: topN
            })
        })

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cohere API error (status ${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as RerankResponse;
        const rerankedDocs = data.results.map((res) => {
            const doc = docs[res.index];
            if (doc) {
                doc.metadata = {
                    ...doc.metadata,
                    rerankScore: res.relevance_score
                }
            }
            return doc;
        }).filter(Boolean);

        return rerankedDocs;

    } catch (err) {
        console.error("Error calling Cohere Rerank API:", err);
        // Fallback: return the topN original documents to prevent the RAG system from failing
        return docs.slice(0, topN);
    }
}
