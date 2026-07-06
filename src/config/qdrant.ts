// src/config/qdrant.ts

import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env";

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL!,
  apiKey: env.QDRANT_API_KEY!,
});

// runs once for create the index of the collection
// export async function ensureQdrantIndexes() {
//   try {
//     await qdrant.createPayloadIndex("medical_chunks", {
//       field_name: "metadata.chatId",
//       field_schema: "keyword",
//       wait: true,
//     });
//     console.log("✅ Qdrant index ensured for metadata.chatId");
//   } catch (error) {
//     console.error("⚠️ Error creating Qdrant index for metadata.chatId:", error);
//   }
// }
