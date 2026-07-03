import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

import { chats } from "./chats";

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),

  chatId: uuid("chat_id")
    .references(() => chats.id, {
      onDelete: "cascade",
    })
    .notNull(),

  role: varchar("role", {
    length: 20,
  }).notNull(),

  content: text("content").notNull(),

  citations: jsonb("citations"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
