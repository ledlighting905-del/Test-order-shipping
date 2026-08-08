import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id"),
  interest: text("interest").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});
