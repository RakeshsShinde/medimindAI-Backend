import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", { length: 150 }).notNull().unique(),

  password: text("password"),

  avatar: text("avatar"),

  authProvider: varchar("auth_provider", {
    length: 20,
  }).default("local"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
