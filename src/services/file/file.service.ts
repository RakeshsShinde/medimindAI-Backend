import "multer";
import { loadDocuments } from "../document/documentLoader.service";
import { ChunkDocuments } from "../document/chunking.service";
import { indexDocuments } from "../vector/qdrant.service";
import { db } from "../../config/db";
import { files as filesTable, messageFiles } from "../../db/Schema";
import { uploadDocumentToCloudinary } from "../../utils/cloudinary-upload";

/**
 * Processes uploaded files through the full LangChain ingestion pipeline:
 *   1. uploadToCloudinary — uploads file and gets secure URL
 *   2. db.insert(files)   — stores file metadata in Postgres
 *   3. db.insert(message_files) — links file to message
 *   4. loadDocuments()   — PDF/DOCX/TXT → Document[] with metadata
 *   5. chunkDocuments()  — smart splitting on natural boundaries
 *   6. indexDocuments()  — batch embed + upsert to Qdrant (with fileId)
 */

export async function processUploadedFiles(
    files: Express.Multer.File[],
    chatId: string,
    userId: string,
    messageId?: string
) {
    for (const file of files) {
        // Step 1: Upload to Cloudinary
        const uploadResult: any = await uploadDocumentToCloudinary(file.buffer, file.originalname);
        const fileUrl = uploadResult.secure_url;

        // Step 2: Store file metadata in the relational database
        const [newFile] = await db
            .insert(filesTable)
            .values({
                userId,
                chatId,
                fileName: file.originalname,
                fileUrl,
                mimeType: file.mimetype,
                fileSize: file.size,
                status: "completed",
            })
            .returning();

        // Step 3: Link file to specific message
        if (messageId) {
            await db
                .insert(messageFiles)
                .values({
                    messageId,
                    fileId: newFile.id,
                });
        }

        // Step 4: Load file into LangChain Documents 
        const documents = await loadDocuments(file);

        // Step 5:  chunking 
        const chunks = await ChunkDocuments(documents);

        // Step 6: Batch embed + index into Qdrant (including fileId in metadata)
        await indexDocuments({
            documents: chunks,
            chatId,
            userId,
            fileId: newFile.id,
        });

        console.log(
            `✅ Indexed ${chunks.length} chunks from "${file.originalname}" (ID: ${newFile.id}) into chat ${chatId}`
        );
    }
}

