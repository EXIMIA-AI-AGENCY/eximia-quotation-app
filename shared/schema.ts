import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess", { mode: 'json' }).notNull(),
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table for Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  packageId: text("package_id").notNull(),
  addonIds: text("addon_ids", { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  contractTerm: text("contract_term").default("1month"),
  contact: text("contact", { mode: 'json' }).$type<ContactInfo>().notNull(),
  totals: text("totals", { mode: 'json' }).$type<QuoteTotals>().notNull(),
  eximiaContactId: text("eximia_contact_id"),
  ghlInvoiceId: text("ghl_invoice_id"),
  ghlCustomerId: text("ghl_customer_id"),
  paymentUrl: text("payment_url"),
  status: text("status").default("pending"), // pending, paid, cancelled
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  taxId?: string;
  businessName?: string;
  billingAddress?: string;
  needsBilling: boolean;
  monthlyAdSpend?: number;
}

export interface QuoteTotals {
  subtotalMonthly: number;
  discountedSubtotal: number;
  discount: number;
  discountPercentage: number;
  taxMonthly: number;
  setupFee: number;
  totalToday: number;
  totalMonthly: number;
  contractTerm?: any;
}

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  taxId: z.string().optional(),
  businessName: z.string().optional(),
  billingAddress: z.string().optional(),
  needsBilling: z.boolean().default(false),
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
