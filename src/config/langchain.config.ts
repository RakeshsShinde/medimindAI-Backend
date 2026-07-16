import { ChatGroq } from '@langchain/groq';
import { CohereEmbeddings } from '@langchain/cohere';
import { QdrantVectorStore } from '@langchain/qdrant';
import { env } from './env';

//  llm groq
export const llm = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    temperature: 0.3,
    maxRetries: 2
})


// Embeddings (Cohere - embed-english-v3.0)
// Free tier: 1000 calls/month — no credit card needed
export const embeddings = new CohereEmbeddings({
    model: "embed-english-v3.0",
    apiKey: env.COHERE_API_KEY,
})

//  vector store factory 

export function getVectorStore(collectionName: string = "medical-chunks") {
    return QdrantVectorStore.fromExistingCollection(embeddings, {
        url: env.QDRANT_URL,
        apiKey: env.QDRANT_API_KEY,
        collectionName
    })
}
