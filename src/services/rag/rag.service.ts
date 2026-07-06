import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";
import { rerankDocuments } from "./re-ranker.service";

export async function createRetriever(chatId: string) {
    const vectorStore = await getVectorStore("medical_chunks");

    return vectorStore.asRetriever({
        k: 8,
        filter: {
            must: [
                {
                    key: "metadata.chatId",
                    match: { value: chatId }
                }
            ]
        }
    })
}

export async function retrieveContext(question: string, chatId: string): Promise<Document[]> {
    const retriever = await createRetriever(chatId);
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
