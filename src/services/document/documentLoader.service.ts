import { Document } from '@langchain/core/documents'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { ApiError } from '../../utils/ApiError'
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


export async function loadDocuments(file: Express.Multer.File): Promise<Document[]> {
    const mimeType = file.mimetype;
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `medimind-${Date.now()}-${file.originalname}`);
    try {
        fs.writeFileSync(tempFilePath, file.buffer);
        switch (mimeType) {

            case "application/pdf": {
                const loader = new PDFLoader(tempFilePath, {
                    splitPages: true
                });
                const docs = await loader.load();

                return docs.map((doc) => ({
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        source: file.originalname
                    }
                }))
            }


            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
                const loader = new DocxLoader(tempFilePath);
                const docs = await loader.load();
                return docs.map((doc) => ({
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        source: file.originalname
                    }
                }))
            }

            case "text/plain": {
                const text = file.buffer.toString("utf8");
                return [
                    new Document({
                        pageContent: text,
                        metadata: {
                            source: file.originalname,
                        }
                    })
                ]
            }

            default:
                throw new ApiError(400, `Unsupported file type ${mimeType}`)
        }
    } finally {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}