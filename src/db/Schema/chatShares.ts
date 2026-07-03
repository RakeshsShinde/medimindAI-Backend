import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

import { chats } from "./chats";

export const chatShares = pgTable("chat_shares", {
  id: uuid("id").defaultRandom().primaryKey(),

  chatId: uuid("chat_id")
    .references(() => chats.id, {
      onDelete: "cascade",
    })
    .notNull(),

  shareToken: varchar("share_token", {
    length: 255,
  })
    .unique()
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
