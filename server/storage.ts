import { type Quote, type InsertQuote, type User, type UpsertUser, type ContactInfo, quotes, users } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | undefined>;
  updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined>;
  getQuotesByEmail(email: string): Promise<Quote[]>;
  getAllQuotes(): Promise<Quote[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quotes: Map<string, Quote>;

  constructor() {
    this.users = new Map();
    this.quotes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const user: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = randomUUID();
    const quote: Quote = {
      id,
      packageId: insertQuote.packageId,
      addonIds: Array.isArray(insertQuote.addonIds) ? insertQuote.addonIds as string[] : [],
      contractTerm: insertQuote.contractTerm || "1month",
      contact: insertQuote.contact as ContactInfo,
      totals: insertQuote.totals,
      status: insertQuote.status || "pending",
      eximiaContactId: insertQuote.eximiaContactId || null,
      ghlInvoiceId: insertQuote.ghlInvoiceId || null,
      ghlCustomerId: insertQuote.ghlCustomerId || null,
      paymentUrl: insertQuote.paymentUrl || null,
      createdAt: new Date(),
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.quotes.set(id, updated);
    return updated;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuotesByEmail(email: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(
      quote => quote.contact.email === email
    );
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    try {
      // Ensure addonIds is an array
      const cleanedQuote = {
        ...insertQuote,
        addonIds: Array.isArray(insertQuote.addonIds) ? insertQuote.addonIds : [],
        contractTerm: insertQuote.contractTerm || "1month",
        status: insertQuote.status || "pending"
      };

      const [quote] = await db
        .insert(quotes)
        .values(cleanedQuote)
        .returning();
      
      console.log(`Quote saved to database with ID: ${quote.id}`);
      return quote;
    } catch (error) {
      console.error("Error saving quote to database:", error);
      throw error;
    }
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const [quote] = await db
      .update(quotes)
      .set(updates)
      .where(eq(quotes.id, id))
      .returning();
    return quote || undefined;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }

  async getQuotesByEmail(email: string): Promise<Quote[]> {
    // Since contact is JSON, we need to use a SQL query to search within it
    const allQuotes = await db.select().from(quotes);
    return allQuotes.filter(quote => 
      quote.contact && (quote.contact as any).email === email
    );
  }
}

export const storage = new DatabaseStorage();
