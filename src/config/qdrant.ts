// src/config/qdrant.ts

import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env";

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL!,
  apiKey: env.QDRANT_API_KEY!,
});

// runs once to create the collection and payload indexes
// export async function ensureQdrantIndexes() {
//   try {
//     const collectionsResponse = await qdrant.getCollections();
//     const collectionExists = collectionsResponse.collections.some(
//       (c) => c.name === "medical_chunks"
//     );

//     if (!collectionExists) {
//       console.log("Creating Qdrant collection 'medical_chunks'...");
//       await qdrant.createCollection("medical_chunks", {
//         vectors: {
//           size: 768, // nomic-embed-text dimension size
//           distance: "Cosine",
//         },
//       });
//       console.log("✅ Qdrant collection 'medical_chunks' created.");
//     }

//     await qdrant.createPayloadIndex("medical_chunks", {
//       field_name: "metadata.chatId",
//       field_schema: "keyword",
//       wait: true,
//     });
//     console.log("✅ Qdrant index ensured for metadata.chatId");

//     await qdrant.createPayloadIndex("medical_chunks", {
//       field_name: "metadata.fileId",
//       field_schema: "keyword",
//       wait: true,
//     });
//     console.log("✅ Qdrant index ensured for metadata.fileId");
//   } catch (error) {
//     console.error("⚠️ Error ensuring Qdrant indexes:", error);
//   }
// }
