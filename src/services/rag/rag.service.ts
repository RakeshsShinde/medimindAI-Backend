import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../config/langchain.config";

/**
 * Creates a LangChain retriever filtered to a specific chat's documents.
 *
 * KEY IMPROVEMENTS over old searchRelevantChunks():
 * - Returns structured Document[] with metadata (page, source) instead of flat string
 * - Retrieves 8 candidates instead of 5 for better recall
 * - Score threshold filtering removes noisy/irrelevant chunks
 * - Uses LangChain's retriever interface (composable with chains)
 */


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

/**
 * Retrieves relevant document chunks for a question within a specific chat.
 * Returns Document[] with full metadata.
 */

export async function retrieveContext(question: string, chatId: string): Promise<Document[]> {
    const retriever = await createRetriever(chatId);
    const docs = await retriever.invoke(question);
    return docs;
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
