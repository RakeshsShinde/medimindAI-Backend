import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Document } from '@langchain/core/documents';


/**
 * LangChain's RecursiveCharacterTextSplitter.
 *
 * KEY IMPROVEMENT over old chunkText():
 * - Old code split at exact character positions (could cut mid-word/mid-sentence)
 * - New splitter tries paragraph breaks first (\n\n), then sentences (\n),
 *   then periods (. ), then spaces, then characters — producing coherent chunks.
 */

const textsplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ". ", ", ", " ", ""],
})


/**
 * Chunks LangChain Documents into smaller Documents.
 * Metadata (page number, source filename) is preserved on each chunk.
 */

export async function ChunkDocuments(docs: Document[]): Promise<Document[]> {
    return await textsplitter.splitDocuments(docs);
}