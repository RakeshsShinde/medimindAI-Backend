import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { messages } from "./messages";
import { files } from "./files";

export const messageFiles = pgTable("message_files", {
  id: uuid("id").defaultRandom().primaryKey(),

  messageId: uuid("message_id")
    .references(() => messages.id, {
      onDelete: "cascade",
    })
    .notNull(),

  fileId: uuid("file_id")
    .references(() => files.id, {
      onDelete: "cascade",
    })
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageFilesRelations = relations(messageFiles, ({ one }) => ({
  message: one(messages, {
    fields: [messageFiles.messageId],
    references: [messages.id],
  }),
  file: one(files, {
    fields: [messageFiles.fileId],
    references: [files.id],
  }),
}));
