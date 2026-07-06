import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Document } from '@langchain/core/documents';

const textsplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ". ", ", ", " ", ""],
})


export async function ChunkDocuments(docs: Document[]): Promise<Document[]> {
    return await textsplitter.splitDocuments(docs);
}