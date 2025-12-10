import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp, json, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: text("package_id").notNull(),
  addonIds: json("addon_ids").$type<string[]>().default([]),
  contractTerm: text("contract_term").default("1month"),
  contact: json("contact").$type<ContactInfo>().notNull(),
  totals: json("totals").$type<QuoteTotals>().notNull(),
  eximiaContactId: text("eximia_contact_id"),
  ghlInvoiceId: text("ghl_invoice_id"),
  ghlCustomerId: text("ghl_customer_id"),
  paymentUrl: text("payment_url"),
  status: text("status").default("pending"), // pending, paid, cancelled
  createdAt: timestamp("created_at").defaultNow(),
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
