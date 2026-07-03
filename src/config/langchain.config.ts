import { ChatGroq } from '@langchain/groq';
import { OllamaEmbeddings } from '@langchain/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { env } from './env';

//  llm groq
export const llm = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    temperature: 0.3,
    maxRetries: 2
})


// Embeddings (ollama -nomic-embed-text)

export const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
})

//  vector store factory 

export function getVectorStore(collectionName: string = "medical-chunks") {
    return QdrantVectorStore.fromExistingCollection(embeddings, {
        url: env.QDRANT_URL,
        apiKey: env.QDRANT_API_KEY,
        collectionName
    })
}
