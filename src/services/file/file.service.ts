import "multer";
import { loadDocuments } from "../document/documentLoader.service";
import { ChunkDocuments } from "../document/chunking.service";
import { indexDocuments } from "../vector/qdrant.service";

/**
 * Processes uploaded files through the full LangChain ingestion pipeline:
 *   1. loadDocuments()   — PDF/DOCX/TXT → Document[] with metadata
 *   2. chunkDocuments()  — smart splitting on natural boundaries
 *   3. indexDocuments()  — batch embed + upsert to Qdrant
 */
export async function processUploadedFiles(
    files: Express.Multer.File[],
    chatId: string,
    userId: string
) {
    for (const file of files) {
        // Step 1: Load file into LangChain Documents (with page/source metadata)
        const documents = await loadDocuments(file);

        // Step 2: Smart chunking — respects sentence/paragraph boundaries
        const chunks = await ChunkDocuments(documents);

        // Step 3: Batch embed + index into Qdrant
        await indexDocuments({
            documents: chunks,
            chatId,
            userId,
        });

        console.log(
            `✅ Indexed ${chunks.length} chunks from "${file.originalname}" into chat ${chatId}`
        );
    }
}
