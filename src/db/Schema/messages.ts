import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { chats } from "./chats";
import { messageFiles } from "./messageFiles";

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

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  files: many(messageFiles),
}));

