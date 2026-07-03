import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users";

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .notNull(),

  title: varchar("title", {
    length: 255,
  }).notNull(),

  summary: text("summary"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  deletedAt: timestamp("deleted_at"),
});
