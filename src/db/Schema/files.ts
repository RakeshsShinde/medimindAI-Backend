import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";

import { chats } from "./chats";
import { users } from "./users";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .notNull(),

  chatId: uuid("chat_id")
    .references(() => chats.id, {
      onDelete: "cascade",
    })
    .notNull(),

  fileName: varchar("file_name", {
    length: 255,
  }).notNull(),

  fileUrl: text("file_url").notNull(),

  mimeType: varchar("mime_type", {
    length: 100,
  }).notNull(),

  fileSize: bigint("file_size", {
    mode: "number",
  }).notNull(),

  status: varchar("status", {
    length: 30,
  })
    .default("processing")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
