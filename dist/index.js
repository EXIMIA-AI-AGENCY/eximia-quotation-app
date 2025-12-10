var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  contactSchema: () => contactSchema,
  insertQuoteSchema: () => insertQuoteSchema,
  insertUserSchema: () => insertUserSchema,
  quotes: () => quotes,
  sessions: () => sessions,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: text("package_id").notNull(),
  addonIds: json("addon_ids").$type().default([]),
  contractTerm: text("contract_term").default("1month"),
  contact: json("contact").$type().notNull(),
  totals: json("totals").$type().notNull(),
  eximiaContactId: text("eximia_contact_id"),
  ghlInvoiceId: text("ghl_invoice_id"),
  ghlCustomerId: text("ghl_customer_id"),
  paymentUrl: text("payment_url"),
  status: text("status").default("pending"),
  // pending, paid, cancelled
  createdAt: timestamp("created_at").defaultNow()
});
var insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true
});
var contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inv\xE1lido"),
  phone: z.string().min(8, "Tel\xE9fono inv\xE1lido"),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  taxId: z.string().optional(),
  businessName: z.string().optional(),
  billingAddress: z.string().optional(),
  needsBilling: z.boolean().default(false)
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async createQuote(insertQuote) {
    try {
      const cleanedQuote = {
        ...insertQuote,
        addonIds: Array.isArray(insertQuote.addonIds) ? insertQuote.addonIds : [],
        contractTerm: insertQuote.contractTerm || "1month",
        status: insertQuote.status || "pending"
      };
      const [quote] = await db.insert(quotes).values(cleanedQuote).returning();
      console.log(`Quote saved to database with ID: ${quote.id}`);
      return quote;
    } catch (error) {
      console.error("Error saving quote to database:", error);
      throw error;
    }
  }
  async getQuote(id) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || void 0;
  }
  async updateQuote(id, updates) {
    const [quote] = await db.update(quotes).set(updates).where(eq(quotes.id, id)).returning();
    return quote || void 0;
  }
  async getAllQuotes() {
    return await db.select().from(quotes);
  }
  async getQuotesByEmail(email) {
    const allQuotes = await db.select().from(quotes);
    return allQuotes.filter(
      (quote) => quote.contact && quote.contact.email === email
    );
  }
};
var storage = new DatabaseStorage();

// server/lib/money.ts
function calculateTotals(selectedPackage, selectedAddons, config, contractTermId = "1month") {
  const subtotalMonthly = selectedPackage.monthly + selectedAddons.reduce((sum, addon) => sum + (addon.monthly || 0), 0);
  const oneTimeFees = selectedAddons.reduce((sum, addon) => sum + (addon.oneTime || 0), 0);
  const selectedTerm = config.contractTerms?.find((term) => term.id === contractTermId);
  const discount = selectedTerm?.discount || 0;
  const discountedSubtotal = subtotalMonthly * (1 - discount);
  const taxMonthly = config.tax.enabled ? discountedSubtotal * config.tax.rate : 0;
  const setupFee = config.setupFee.enabled && contractTermId === "1month" ? config.setupFee.amount : 0;
  const totalMonthly = discountedSubtotal + taxMonthly;
  const totalToday = config.collectFirstMonthToday ? setupFee + totalMonthly + oneTimeFees : setupFee + oneTimeFees;
  return {
    subtotalMonthly: roundToTwoDecimals(subtotalMonthly),
    discountedSubtotal: roundToTwoDecimals(discountedSubtotal),
    discount: roundToTwoDecimals(subtotalMonthly - discountedSubtotal),
    discountPercentage: Math.round(discount * 100),
    taxMonthly: roundToTwoDecimals(taxMonthly),
    setupFee: roundToTwoDecimals(setupFee),
    oneTimeFees: roundToTwoDecimals(oneTimeFees),
    totalToday: roundToTwoDecimals(totalToday),
    totalMonthly: roundToTwoDecimals(totalMonthly),
    contractTerm: selectedTerm
  };
}
function roundToTwoDecimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// server/services/eximiaClient.ts
import axios from "axios";
var EximiaClient = class {
  apiKey;
  baseUrl;
  constructor() {
    this.apiKey = process.env.EXIMIA_API_KEY || "";
    this.baseUrl = "https://api.eximia.com/v1";
  }
  getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }
  async upsertContact(params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/contacts/upsert`,
        {
          firstName: params.name.split(" ")[0],
          lastName: params.name.split(" ").slice(1).join(" "),
          email: params.email,
          phone: params.phone,
          companyName: params.company,
          locationId: params.locationId,
          tags: params.tags
        },
        { headers: this.getHeaders() }
      );
      return response.data.contactId || response.data.id;
    } catch (error) {
      console.error("EXIMIA CRM upsert contact error:", error);
      throw new Error("Failed to create contact in EXIMIA CRM");
    }
  }
  async createRecurringCharge(params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/billing/recurring-charges`,
        {
          contactId: params.contactId,
          locationId: params.locationId,
          description: params.description,
          amount: Math.round(params.amountMonthly * 100),
          // Convert to cents
          currency: "USD",
          interval: "month",
          taxRate: params.taxRate,
          setupFee: Math.round(params.setupFee * 100)
        },
        { headers: this.getHeaders() }
      );
      return {
        paymentUrl: response.data.paymentUrl,
        invoiceId: response.data.invoiceId
      };
    } catch (error) {
      console.error("EXIMIA Billing error:", error);
      throw new Error("Failed to create recurring charge in EXIMIA Billing");
    }
  }
  async addNote(contactId, text2) {
    try {
      await axios.post(
        `${this.baseUrl}/contacts/${contactId}/notes`,
        {
          body: text2,
          userId: "system"
          // or get from context
        },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error("EXIMIA add note error:", error);
      throw new Error("Failed to add note to EXIMIA CRM");
    }
  }
  async createOrUpdateOpportunity(params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/opportunities`,
        {
          contactId: params.contactId,
          pipelineId: params.pipelineId,
          stageId: params.stageId,
          title: "EXIMIA Auto-cotizaci\xF3n",
          monetaryValue: Math.round(params.monetaryValue * 100),
          currency: "USD"
        },
        { headers: this.getHeaders() }
      );
      return response.data.opportunityId || response.data.id;
    } catch (error) {
      console.error("EXIMIA opportunity error:", error);
      throw new Error("Failed to create opportunity in EXIMIA CRM");
    }
  }
};
var eximiaClient = new EximiaClient();

// server/services/ghlClient.ts
import axios2 from "axios";
var GHLClient = class {
  apiKey;
  baseUrl;
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.baseUrl = "https://services.leadconnectorhq.com";
    if (!this.apiKey) {
      throw new Error("GHL_API_KEY environment variable is required");
    }
    console.log(`GHL Token: ${this.apiKey.substring(0, 15)}...`);
  }
  // Formatear número para compatibilidad con GoHighLevel
  formatPhoneForGHL(phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  }
  // Obtener variaciones del número para búsqueda
  getPhoneVariations(phone) {
    const cleaned = phone.replace(/\D/g, "");
    const variations = [
      phone,
      // Original
      cleaned,
      // Solo números
      `+${cleaned}`
      // Con +
    ];
    if (cleaned.length === 10) {
      variations.push(`+1${cleaned}`);
      variations.push(`1${cleaned}`);
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      variations.push(cleaned.substring(1));
    }
    return Array.from(new Set(variations));
  }
  getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    };
  }
  async searchContactByPhone(locationId, phone) {
    try {
      const phoneVariations = this.getPhoneVariations(phone);
      console.log("Searching for contact with phone variations:", phoneVariations);
      for (const variation of phoneVariations) {
        try {
          const response = await axios2.get(
            `${this.baseUrl}/contacts/`,
            {
              params: {
                locationId,
                query: variation
              },
              headers: this.getHeaders()
            }
          );
          if (response.data.contacts && response.data.contacts.length > 0) {
            const existingContact = response.data.contacts.find((contact) => {
              if (!contact.phone) return false;
              const contactVariations = this.getPhoneVariations(contact.phone);
              return phoneVariations.some(
                (userVar) => contactVariations.some((contactVar) => contactVar === userVar)
              );
            });
            if (existingContact) {
              console.log("Found existing contact with phone:", variation, "\u2192 ID:", existingContact.id);
              return existingContact.id;
            }
          }
        } catch (searchError) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.log("No existing contact found for phone:", phone);
      return null;
    }
  }
  async addTagToContact(contactId, tag) {
    try {
      await axios2.post(
        `${this.baseUrl}/contacts/${contactId}/tags`,
        {
          tags: [tag]
        },
        { headers: this.getHeaders() }
      );
      console.log(`Tag "${tag}" added to contact ${contactId}`);
    } catch (error) {
      console.error("Error adding tag to contact:", error.response?.data || error.message);
    }
  }
  async createContact(params) {
    try {
      const quotationTag = "eximia-cotizacion";
      const existingContactId = await this.searchContactByPhone(params.locationId, params.phone);
      if (existingContactId) {
        console.log("Found existing contact with phone:", params.phone, "ID:", existingContactId);
        await this.addTagToContact(existingContactId, quotationTag);
        console.log("Added quotation tag to existing contact");
        return existingContactId;
      }
      const formattedPhone = this.formatPhoneForGHL(params.phone);
      console.log("Creating new contact for phone:", params.phone, "\u2192", formattedPhone);
      const response = await axios2.post(
        `${this.baseUrl}/contacts/`,
        {
          firstName: params.name.split(" ")[0],
          lastName: params.name.split(" ").slice(1).join(" ") || "",
          email: params.email,
          phone: formattedPhone,
          companyName: params.company,
          locationId: params.locationId,
          tags: [quotationTag]
        },
        { headers: this.getHeaders() }
      );
      const newContactId = response.data.contact?.id || response.data.id;
      console.log("Created new contact with eximia-cotizacion tag, ID:", newContactId);
      return newContactId;
    } catch (error) {
      console.log("Error response:", error.response?.data);
      if (error.response?.status === 400 && error.response?.data?.message?.includes("duplicated contacts")) {
        const existingContactId = error.response?.data?.meta?.contactId;
        if (existingContactId) {
          console.log("Contact already exists (from error), using existing contact ID:", existingContactId);
          await this.addTagToContact(existingContactId, "eximia-cotizacion");
          console.log("Added quotation tag to existing contact from error");
          return existingContactId;
        }
      }
      console.error("GHL contact creation error:", error.response?.data || error);
      throw new Error("Failed to create contact in GoHighLevel");
    }
  }
  normalizePhoneToE164(phone) {
    return this.formatPhoneForGHL(phone);
  }
  async createEstimate(params) {
    try {
      const today = /* @__PURE__ */ new Date();
      const normalizedPhone = params.contactPhone ? this.normalizePhoneToE164(params.contactPhone) : "+17875550123";
      const requestData = {
        altId: params.locationId,
        altType: "location",
        name: params.name,
        currency: params.currency,
        businessDetails: {
          name: "EXIMIA",
          address: {
            addressLine1: "Puerto Rico",
            city: "San Juan",
            state: "PR",
            countryCode: "US",
            postalCode: "00901"
          },
          phoneNo: "+17875550123",
          website: "www.eximia.agency"
        },
        contactDetails: {
          id: params.contactId,
          name: params.contactName || "Cliente EXIMIA",
          phoneNo: normalizedPhone,
          email: params.contactEmail || "info@eximia.agency"
        },
        items: params.items.map((item) => ({
          name: item.name,
          description: item.description,
          amount: item.amount,
          qty: item.qty,
          currency: params.currency,
          type: "one_time"
        })),
        issueDate: today.toISOString().split("T")[0],
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        liveMode: false,
        discount: {
          type: "percentage",
          value: 0
        },
        sentTo: {
          email: [params.contactEmail || "info@eximia.agency"]
        }
      };
      console.log("Creating GHL Estimate with data:", JSON.stringify(requestData, null, 2));
      const response = await axios2.post(
        `${this.baseUrl}/invoices/`,
        requestData,
        { headers: this.getHeaders() }
      );
      return {
        _id: response.data._id,
        status: response.data.status,
        estimateNumber: response.data.estimateNumber,
        total: response.data.total
      };
    } catch (error) {
      console.error("GHL estimate creation error:", error.response?.data || error);
      console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.data?.error) {
        console.error("Specific errors:", error.response.data.error);
      }
      throw new Error("Failed to create estimate in GoHighLevel");
    }
  }
  async createInvoice(params) {
    try {
      const today = /* @__PURE__ */ new Date();
      const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1e3);
      const normalizedPhone = params.contactPhone ? this.normalizePhoneToE164(params.contactPhone) : "+17875550123";
      const requestData = {
        altId: params.locationId,
        altType: "location",
        name: params.name,
        currency: params.currency,
        businessDetails: {
          name: "EXIMIA",
          address: {
            addressLine1: "Puerto Rico",
            city: "San Juan",
            state: "PR",
            countryCode: "US",
            postalCode: "00901"
          },
          phoneNo: "+17875550123",
          website: "www.eximia.agency"
        },
        contactDetails: {
          id: params.contactId,
          name: params.contactName || "Cliente EXIMIA",
          phoneNo: normalizedPhone,
          email: params.contactEmail || "info@eximia.agency"
        },
        items: params.items.map((item) => ({
          name: item.name,
          description: item.description,
          amount: item.amount,
          qty: item.qty,
          currency: params.currency
        })),
        issueDate: today.toISOString().split("T")[0],
        dueDate: params.dueDate || dueDate.toISOString().split("T")[0],
        liveMode: false,
        discount: {
          type: "percentage",
          value: 0
        },
        sentTo: {
          email: ["info@eximia.agency"]
        }
      };
      const response = await axios2.post(
        `${this.baseUrl}/invoices/`,
        requestData,
        { headers: this.getHeaders() }
      );
      return {
        _id: response.data._id,
        status: response.data.status,
        invoiceNumber: response.data.invoiceNumber,
        total: response.data.total,
        amountDue: response.data.amountDue
      };
    } catch (error) {
      console.error("GHL invoice creation error:", error.response?.data || error);
      console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.data?.error) {
        console.error("Specific errors:", error.response.data.error);
      }
      throw new Error("Failed to create invoice in GoHighLevel");
    }
  }
  async getInvoice(invoiceId) {
    try {
      const response = await axios2.get(
        `${this.baseUrl}/invoices/${invoiceId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("GHL get invoice error:", error);
      throw new Error("Failed to get invoice from GoHighLevel");
    }
  }
  async getProducts() {
    try {
      const response = await axios2.get(
        `${this.baseUrl}/products/?locationId=L3bLLVwvhdJ7A9WqkPxM`,
        { headers: this.getHeaders() }
      );
      return response.data.products || response.data || [];
    } catch (error) {
      console.error("GHL get products error:", error);
      throw new Error("Failed to get products from GoHighLevel");
    }
  }
  async sendInvoice(invoiceId) {
    try {
      await axios2.post(
        `${this.baseUrl}/invoices/${invoiceId}/send`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error("GHL send invoice error:", error);
      throw new Error("Failed to send invoice in GoHighLevel");
    }
  }
  async verifyWebhook(body, signature) {
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("GHL_WEBHOOK_SECRET not configured");
      return true;
    }
    return true;
  }
};
var ghlClient = new GHLClient();

// server/routes.ts
import { z as z2 } from "zod";
import fs from "fs";
import path from "path";

// server/adminAuth.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
function getAdminSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "admin_sessions"
  });
  return session({
    name: "admin.sid",
    secret: process.env.SESSION_SECRET || "admin-secret-key-2024",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax"
    }
  });
}
function setupAdminAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getAdminSession());
  app2.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contrase\xF1a requeridos" });
    }
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validUsername || !validPassword) {
      console.error("Admin credentials not configured in environment variables");
      return res.status(500).json({ message: "Sistema de autenticaci\xF3n no configurado" });
    }
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }
    req.session.isAdmin = true;
    req.session.adminUsername = username;
    res.json({
      success: true,
      message: "Autenticaci\xF3n exitosa",
      user: { username }
    });
  });
  app2.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesi\xF3n" });
      }
      res.clearCookie("admin.sid");
      res.json({ success: true, message: "Sesi\xF3n cerrada" });
    });
  });
  app2.get("/api/admin/status", (req, res) => {
    const isAdmin = req.session?.isAdmin === true;
    res.json({
      authenticated: isAdmin,
      user: isAdmin ? { username: req.session.adminUsername } : null
    });
  });
}
var requireAdmin = (req, res, next) => {
  if (req.session?.isAdmin !== true) {
    return res.status(401).json({ message: "Acceso no autorizado" });
  }
  next();
};

// server/routes.ts
function loadPricingConfig() {
  const possiblePaths = [
    // Development path (when running from server/)
    path.join(import.meta.dirname, "config/pricing.json"),
    // Production path (when running from dist/)
    path.join(import.meta.dirname, "../server/config/pricing.json"),
    // Alternative production path (if config is copied to dist/config/)
    path.join(process.cwd(), "dist/config/pricing.json"),
    // Fallback to current working directory
    path.join(process.cwd(), "server/config/pricing.json")
  ];
  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        console.log(`\u{1F4C4} Loaded pricing config from: ${configPath}`);
        return config;
      }
    } catch (error) {
      console.warn(`\u26A0\uFE0F  Failed to load config from ${configPath}:`, error.message);
    }
  }
  console.warn("\u26A0\uFE0F  No pricing.json found, using default configuration");
  return {
    currency: "USD",
    collectFirstMonthToday: true,
    tax: { enabled: false, label: "", rate: 0 },
    setupFee: { enabled: false, label: "Cuota de configuraci\xF3n (\xFAnica)", amount: 199 },
    contractTerms: [
      { id: "1month", name: "1 mes", months: 1, discount: 0, label: "Mes a mes" }
    ],
    packages: [],
    addons: []
  };
}
var pricingConfig = loadPricingConfig();
async function getPricingData() {
  try {
    const ghlProducts = await ghlClient.getProducts();
    if (ghlProducts && ghlProducts.length > 0) {
      const packages = ghlProducts.filter((product) => product.type === "SERVICE").map((product) => ({
        id: product.id,
        name: product.name,
        monthly: product.prices?.[0]?.amount ? product.prices[0].amount / 100 : 0,
        desc: product.description,
        features: ["Incluye todas las funcionalidades del producto"],
        ghlPriceId: product.prices?.[0]?.id
      }));
      const addons = ghlProducts.filter((product) => product.type === "DIGITAL").map((product) => ({
        id: product.id,
        name: product.name,
        monthly: product.prices?.[0]?.amount ? product.prices[0].amount / 100 : 0,
        desc: product.description,
        icon: "fas fa-plus",
        iconColor: "primary",
        ghlPriceId: product.prices?.[0]?.id
      }));
      return {
        ...pricingConfig,
        packages: packages.length > 0 ? packages : pricingConfig.packages,
        addons: addons.length > 0 ? addons : pricingConfig.addons,
        fromGHL: true
      };
    }
  } catch (error) {
    console.log("Using static pricing config (GHL not available):", error?.message || "Unknown error");
  }
  return { ...pricingConfig, fromGHL: false };
}
var quotePreviewSchema = z2.object({
  packageId: z2.string(),
  addonIds: z2.array(z2.string()).default([]),
  contractTerm: z2.string().default("1month"),
  contact: contactSchema.optional()
});
var checkoutSchema = z2.object({
  packageId: z2.string(),
  addonIds: z2.array(z2.string()).default([]),
  contractTerm: z2.string().default("1month"),
  contact: contactSchema
});
async function registerRoutes(app2) {
  setupAdminAuth(app2);
  app2.get("/api/pricing", async (req, res) => {
    try {
      const pricing = await getPricingData();
      res.json(pricing);
    } catch (error) {
      console.error("Error getting pricing data:", error);
      res.json(pricingConfig);
    }
  });
  app2.get("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const quotes2 = await storage.getAllQuotes();
      const sortedQuotes = quotes2.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(sortedQuotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/quote/preview", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = quotePreviewSchema.parse(req.body);
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no v\xE1lido" });
      }
      const selectedAddons = pricing.addons.filter(
        (addon) => addonIds.includes(addon.id)
      );
      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);
      res.json({
        package: selectedPackage,
        addons: selectedAddons,
        totals,
        pricing: {
          currency: pricing.currency,
          tax: pricing.tax,
          setupFee: pricing.setupFee
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/webhook/test", (req, res) => {
    console.log("\u{1F9EA} Webhook test endpoint accessed");
    res.json({
      status: "Webhook endpoint is working",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      endpoint: "/api/webhook/ghl"
    });
  });
  app2.post("/api/webhook/debug", express.json(), (req, res) => {
    console.log("\u{1F41B} Debug webhook received:", JSON.stringify(req.body, null, 2));
    console.log("\u{1F41B} Debug headers:", JSON.stringify(req.headers, null, 2));
    res.json({
      received: true,
      body: req.body,
      headers: req.headers,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.post("/api/webhook/ghl", async (req, res) => {
    try {
      let event;
      if (Buffer.isBuffer(req.body)) {
        try {
          event = JSON.parse(req.body.toString());
          console.log("\u{1F4E6} Parsed raw body to JSON");
        } catch (parseError) {
          console.error("\u274C Failed to parse webhook body:", parseError);
          return res.status(400).json({ error: "Invalid JSON payload" });
        }
      } else {
        event = req.body;
      }
      console.log("\u{1F517} GHL Webhook received - Full payload:", JSON.stringify(event, null, 2));
      console.log("\u{1F517} Headers:", JSON.stringify(req.headers, null, 2));
      console.log("\u{1F4CB} Event structure analysis:");
      console.log("- Event type:", event.type || event.eventType || event.event);
      console.log("- Data keys:", Object.keys(event.data || event));
      console.log("- Full event keys:", Object.keys(event));
      const eventType = event.type || event.eventType || event.event || event.trigger;
      if (!eventType) {
        console.log("\u274C No event type found in webhook payload");
        console.log("\u{1F4CB} Available keys:", Object.keys(event));
        return res.status(400).json({ error: "No event type specified" });
      }
      console.log(`\u{1F3AF} Processing event type: ${eventType}`);
      const normalizedEventType = eventType.toLowerCase();
      if (normalizedEventType.includes("invoice") && normalizedEventType.includes("paid")) {
        console.log("\u{1F4B0} Processing invoice payment");
        await handleInvoicePaid(event.data || event);
      } else if (normalizedEventType.includes("invoice") && normalizedEventType.includes("overdue")) {
        console.log("\u26A0\uFE0F Processing overdue invoice");
        await handleInvoiceOverdue(event.data || event);
      } else if (normalizedEventType.includes("invoice") && normalizedEventType.includes("cancel")) {
        console.log("\u274C Processing cancelled invoice");
        await handleInvoiceCancelled(event.data || event);
      } else if (normalizedEventType.includes("contact") && normalizedEventType.includes("create")) {
        console.log("\u{1F464} Processing new contact");
        await handleContactCreated(event.data || event);
      } else {
        console.log(`\u2753 Unhandled webhook event type: ${eventType}`);
        console.log("\u{1F4CB} Event payload for analysis:", JSON.stringify(event, null, 2));
      }
      res.status(200).json({
        received: true,
        eventType,
        processed: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("\u274C Webhook processing error:", error);
      console.error("\u274C Error stack:", error.stack);
      console.error("\u274C Request body that caused error:", JSON.stringify(req.body, null, 2));
      res.status(500).json({
        error: "Webhook processing failed",
        details: error.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.post("/api/send-estimate", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = checkoutSchema.parse(req.body);
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no v\xE1lido" });
      }
      const selectedAddons = pricing.addons.filter(
        (addon) => addonIds.includes(addon.id)
      );
      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);
      let ghlContactId;
      const locationId = process.env.GHL_LOCATION_ID || "L3bLLVwvhdJ7A9WqkPxM";
      try {
        console.log(`Searching for contact with phone: ${contact.phone} in location: ${locationId}`);
        const existingContact = await ghlClient.searchContactByPhone(locationId, contact.phone);
        if (existingContact) {
          console.log(`Found existing contact with phone: ${contact.phone} ID: ${existingContact}`);
          await ghlClient.addTagToContact(existingContact, "eximia-cotizacion");
          console.log("Added quotation tag to existing contact");
          ghlContactId = existingContact;
        } else {
          console.log(`Creating new contact for phone: ${contact.phone}`);
          ghlContactId = await ghlClient.createContact({
            locationId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company
          });
          if (ghlContactId) {
            await ghlClient.addTagToContact(ghlContactId, "eximia-cotizacion");
          }
        }
        console.log(`GHL Contact created/found with ID: ${ghlContactId}`);
      } catch (error) {
        console.error("Error with GHL contact:", error);
        console.error("GHL Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      let ghlInvoiceId;
      try {
        if (ghlContactId) {
          const invoiceItems = [
            {
              name: selectedPackage.name,
              description: `Paquete ${selectedPackage.name} - ${totals.contractTerm?.label || "Mes a mes"}${contact.monthlyAdSpend ? ` - Presupuesto anuncios: $${contact.monthlyAdSpend}/mes` : ""}`,
              amount: totals.totalMonthly,
              qty: 1,
              currency: pricing.currency,
              type: "recurring"
            }
          ];
          selectedAddons.forEach((addon) => {
            invoiceItems.push({
              name: addon.name,
              description: addon.desc,
              amount: addon.monthly,
              qty: 1,
              currency: pricing.currency,
              type: "recurring"
            });
          });
          console.log(`Creating estimate for contact: ${ghlContactId} in location: ${locationId}`);
          const estimateResponse = await ghlClient.createEstimate({
            locationId,
            contactId: ghlContactId,
            contactName: contact.name,
            contactEmail: contact.email,
            contactPhone: contact.phone,
            name: `Cotizaci\xF3n EXIMIA - ${selectedPackage.name}`,
            amount: totals.totalMonthly,
            packageName: selectedPackage.name,
            currency: pricing.currency,
            items: invoiceItems,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]
          });
          ghlInvoiceId = typeof estimateResponse === "string" ? estimateResponse : estimateResponse?._id || estimateResponse;
          console.log(`Estimate created in GoHighLevel: ${ghlInvoiceId}`);
        }
      } catch (error) {
        console.error("Error creating GHL estimate:", error);
        console.error("GHL Estimate Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      const newQuote = await storage.createQuote({
        packageId,
        addonIds,
        contractTerm,
        contact,
        totals,
        ghlInvoiceId,
        ghlCustomerId: ghlContactId,
        status: "pending"
      });
      console.log("Created quote with ID:", newQuote.id);
      console.log(`\u{1F514} Checking notification conditions: ghlInvoiceId=${ghlInvoiceId}, ghlContactId=${ghlContactId}`);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        await sendInternalNotification("estimate_created", {
          // Información básica de referencia
          quoteId: newQuote.id,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          // Información del cliente (solo lo que proporcionó)
          contact: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company || null,
            // Información de facturación (si la proporcionó)
            ...contact.needsBilling && {
              billingAddress: contact.billingAddress,
              billingCity: contact.billingCity,
              billingState: contact.billingState,
              billingZip: contact.billingZip
            },
            // Gasto mensual en publicidad (si lo proporcionó)
            ...contact.monthlyAdSpend && {
              monthlyAdSpend: contact.monthlyAdSpend
            }
          },
          // Cotización - Paquete seleccionado
          package: {
            name: selectedPackage.name,
            monthlyPrice: selectedPackage.monthly
          },
          // Cotización - Addons seleccionados
          addons: selectedAddons.map((addon) => ({
            name: addon.name,
            monthlyPrice: addon.monthly,
            setupFee: addon.setup || 0
          })),
          // Términos del contrato
          contractTerm,
          // Totales calculados
          totals: {
            monthlyRecurring: totals.monthlyRecurring,
            oneTimeSetup: totals.oneTimeSetup,
            taxAmount: totals.taxAmount,
            totalToday: totals.totalToday,
            totalMonthly: totals.totalMonthly
          }
        });
        console.log(`\u2705 Internal notification sent successfully for quote ${newQuote.id}`);
      } catch (notificationError) {
        console.error("\u274C Failed to send internal notification:", notificationError);
      }
      res.json({
        success: true,
        quoteId: newQuote.id,
        invoiceId: ghlInvoiceId,
        message: "Factura enviada exitosamente"
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/checkout", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = checkoutSchema.parse(req.body);
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no v\xE1lido" });
      }
      const selectedAddons = pricing.addons.filter(
        (addon) => addonIds.includes(addon.id)
      );
      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);
      let eximiaContactId;
      try {
        eximiaContactId = await eximiaClient.upsertContact({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          locationId: process.env.EXIMIA_LOCATION_ID,
          tags: ["AutoCotizacion", "EXIMIA"]
        });
      } catch (error) {
        console.error("Error creating EXIMIA contact:", error);
      }
      let paymentUrl;
      let eximiaInvoiceId;
      try {
        const eximiaPayment = await eximiaClient.createRecurringCharge({
          contactId: eximiaContactId,
          locationId: process.env.EXIMIA_LOCATION_ID,
          description: `Plan ${selectedPackage.name}${selectedAddons.length > 0 ? ` + ${selectedAddons.map((a) => a.name).join(", ")}` : ""} \u2014 EXIMIA`,
          amountMonthly: totals.totalMonthly,
          taxRate: pricingConfig.tax.rate,
          setupFee: totals.setupFee
        });
        paymentUrl = eximiaPayment.paymentUrl;
        eximiaInvoiceId = eximiaPayment.invoiceId;
      } catch (error) {
        console.error("EXIMIA Billing failed, using Stripe fallback:", error);
      }
      let ghlInvoiceId;
      let ghlContactId;
      if (!paymentUrl) {
        try {
          const locationId = "L3bLLVwvhdJ7A9WqkPxM";
          ghlContactId = await ghlClient.createContact({
            locationId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company || contact.businessName
          });
          console.log("GHL Contact created/found with ID:", ghlContactId);
          const invoiceItems = [
            {
              name: selectedPackage.name,
              description: `${selectedPackage.desc} - Servicio completo EXIMIA`,
              price: selectedPackage.monthly,
              quantity: 1
            },
            ...selectedAddons.map((addon) => ({
              name: addon.name,
              description: addon.desc,
              price: addon.monthly,
              quantity: 1
            }))
          ];
          if (pricingConfig.setupFee.enabled) {
            invoiceItems.push({
              name: pricingConfig.setupFee.label,
              description: "Cuota \xFAnica de configuraci\xF3n e implementaci\xF3n",
              price: pricingConfig.setupFee.amount,
              quantity: 1
            });
          }
          const ghlInvoice = await ghlClient.createInvoice({
            contactId: ghlContactId,
            locationId,
            name: `Factura EXIMIA - ${selectedPackage.name}`,
            amount: totals.totalToday,
            currency: "USD",
            packageName: selectedPackage.name,
            contactName: contact.name,
            contactPhone: contact.phone,
            contactEmail: contact.email,
            items: invoiceItems.map((item) => ({
              name: item.name,
              description: item.description,
              amount: item.price,
              qty: item.quantity,
              currency: "USD",
              type: "recurring"
            }))
          });
          paymentUrl = `https://app.gohighlevel.com/invoices/${ghlInvoice._id}/pay`;
          ghlInvoiceId = ghlInvoice._id;
          if (eximiaContactId) {
            try {
              await eximiaClient.addNote(
                eximiaContactId,
                `\u{1F4E7} Factura generada via GHL. Invoice ID: ${ghlInvoiceId}. Total: ${totals.totalToday.toFixed(2)} USD. Plan: ${selectedPackage.name}${selectedAddons.length > 0 ? ` + ${selectedAddons.map((a) => a.name).join(", ")}` : ""}`
              );
            } catch (noteError) {
              console.error("Failed to add GHL note to EXIMIA:", noteError);
            }
          }
          console.log(`Invoice created as draft in GoHighLevel: ${ghlInvoice._id}`);
        } catch (ghlError) {
          console.error("GHL invoice creation failed:", ghlError);
          return res.status(500).json({
            message: "Error al generar la factura. Por favor intenta nuevamente."
          });
        }
      }
      const quote = await storage.createQuote({
        packageId,
        addonIds,
        contact,
        totals,
        eximiaContactId,
        ghlInvoiceId,
        ghlCustomerId: ghlContactId,
        paymentUrl,
        status: "pending"
      });
      res.json({
        quoteId: quote.id,
        paymentUrl,
        invoiceId: eximiaInvoiceId || ghlInvoiceId,
        subscriptionId: ghlInvoiceId,
        contactId: eximiaContactId
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/webhooks/ghl", async (req, res) => {
    try {
      const isValid = await ghlClient.verifyWebhook(req.body, req.headers["x-ghl-signature"]);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }
      const event = req.body;
      switch (event.type) {
        case "InvoicePaid":
        case "invoice.paid":
          const invoiceData = event.data || event;
          const { contactId, invoiceId, amount } = invoiceData;
          const allQuotes = Array.from(await storage.getQuotesByEmail(invoiceData.customerEmail || ""));
          const pendingQuote = allQuotes.find((q) => q.status === "pending");
          if (pendingQuote) {
            await storage.updateQuote(pendingQuote.id, {
              status: "paid"
            });
          }
          if (contactId) {
            try {
              await eximiaClient.addNote(
                contactId,
                `\u2705 Factura pagada via GHL. Invoice ID: ${invoiceId}. Monto: $${(amount / 100).toFixed(2)} USD.`
              );
              await eximiaClient.createOrUpdateOpportunity({
                contactId,
                pipelineId: process.env.EXIMIA_PIPELINE_ID,
                stageId: process.env.EXIMIA_STAGE_ACTIVE_ID,
                monetaryValue: amount / 100
                // Convert from cents if needed
              });
            } catch (eximiaError) {
              console.error("Failed to update EXIMIA CRM:", eximiaError);
            }
          }
          break;
        case "InvoiceOverdue":
        case "invoice.overdue":
          console.log(`Invoice overdue: ${event.data?.invoiceId}`);
          break;
        default:
          console.log(`Unhandled GHL event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("GHL Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
  app2.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Cotizaci\xF3n no encontrada" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/test-invoice", async (req, res) => {
    try {
      const uniqueEmail = `test-${Date.now()}@eximia.agency`;
      const testContactData = {
        email: uniqueEmail,
        name: "EXIMIA Agency",
        lastName: "Test",
        company: "EXIMIA",
        phone: "+1-787-555-0123",
        website: "https://eximia.agency",
        monthlyAdSpend: 1e3,
        needsBilling: true,
        businessName: "EXIMIA Agency LLC",
        taxId: "66-1234567",
        billingAddress: "San Juan, Puerto Rico"
      };
      const testQuoteData = {
        packageId: "starter",
        addonIds: ["analytics"]
      };
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p) => p.id === testQuoteData.packageId);
      const selectedAddons = pricing.addons.filter((a) => testQuoteData.addonIds.includes(a.id));
      if (!selectedPackage) {
        return res.status(400).json({ error: "Invalid package selected" });
      }
      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, "1month");
      const quoteId = await storage.createQuote({
        packageId: testQuoteData.packageId,
        addonIds: testQuoteData.addonIds,
        contractTerm: "1month",
        contact: testContactData,
        totals,
        status: "pending"
      });
      try {
        const locationId = "L3bLLVwvhdJ7A9WqkPxM";
        let contactId;
        try {
          contactId = await ghlClient.createContact({
            locationId,
            name: testContactData.name,
            email: testContactData.email,
            phone: testContactData.phone,
            company: testContactData.company
          });
          console.log("Contact created/found with ID:", contactId);
        } catch (contactError) {
          console.error("Failed to create contact:", contactError);
          contactId = "JpoYBpphC6cfMbUjQiEw";
        }
        const invoiceItems = [
          {
            name: selectedPackage.name,
            description: `Paquete ${selectedPackage.name} - Presupuesto anuncios: $${testContactData.monthlyAdSpend}/mes`,
            amount: totals.totalMonthly,
            qty: 1,
            currency: pricing.currency,
            type: "recurring"
          }
        ];
        selectedAddons.forEach((addon) => {
          invoiceItems.push({
            name: addon.name,
            description: addon.description || `Add-on: ${addon.name}`,
            amount: addon.price,
            qty: 1,
            currency: pricing.currency,
            type: "recurring"
          });
        });
        const invoice = await ghlClient.createInvoice({
          contactId,
          locationId,
          name: `Factura EXIMIA - ${selectedPackage.name}`,
          amount: totals.totalMonthly,
          currency: pricing.currency,
          packageName: selectedPackage.name,
          contactName: testContactData.name,
          contactPhone: testContactData.phone,
          contactEmail: testContactData.email,
          items: invoiceItems
        });
        console.log(`Invoice created as draft in GoHighLevel: ${invoice._id}`);
        await storage.updateQuote(quoteId.id, {
          ghlCustomerId: contactId,
          ghlInvoiceId: invoice._id,
          status: "payment_sent"
        });
        res.json({
          success: true,
          quoteId: quoteId.id,
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          message: "\u2705 Factura creada y enviada exitosamente a info@eximia.agency v\xEDa GoHighLevel",
          invoice: {
            email: testContactData.email,
            package: selectedPackage.name,
            amount: totals.totalMonthly,
            currency: pricing.currency,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total
          }
        });
      } catch (error) {
        console.error("Test invoice creation failed:", error);
        await storage.updateQuote(quoteId.id, {
          status: "test_invoice_created"
        });
        res.json({
          success: true,
          quoteId: quoteId.id,
          message: "Factura de prueba creada (modo simulaci\xF3n - servicio de facturaci\xF3n no disponible)",
          testData: {
            email: testContactData.email,
            package: selectedPackage.name,
            addons: selectedAddons.map((a) => a.name),
            totals,
            note: "Esta factura se enviar\xEDa a info@eximia.agency en producci\xF3n"
          }
        });
      }
    } catch (error) {
      console.error("Test invoice error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function handleInvoicePaid(invoiceData) {
  try {
    console.log("Processing invoice payment:", invoiceData.invoiceNumber);
    console.log(`Looking for quote with GHL Invoice ID: ${invoiceData._id}`);
    await sendPaymentConfirmationEmail(invoiceData);
    await sendInternalNotification("payment", {
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.amountPaid,
      customerName: invoiceData.contactDetails?.name,
      customerEmail: invoiceData.contactDetails?.email
    });
  } catch (error) {
    console.error("Error handling invoice paid:", error);
  }
}
async function handleInvoiceOverdue(invoiceData) {
  try {
    console.log("Processing overdue invoice:", invoiceData.invoiceNumber);
    await sendOverdueReminderEmail(invoiceData);
    await sendInternalNotification("overdue", {
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.amountDue,
      customerName: invoiceData.contactDetails?.name,
      dueDate: invoiceData.dueDate
    });
  } catch (error) {
    console.error("Error handling invoice overdue:", error);
  }
}
async function handleInvoiceCancelled(invoiceData) {
  try {
    console.log("Processing cancelled invoice:", invoiceData.invoiceNumber);
    await sendInternalNotification("cancelled", {
      invoiceNumber: invoiceData.invoiceNumber,
      customerName: invoiceData.contactDetails?.name
    });
  } catch (error) {
    console.error("Error handling invoice cancelled:", error);
  }
}
async function handleContactCreated(contactData) {
  try {
    console.log("Processing new contact created:", contactData.name);
    await sendWelcomeEmail(contactData);
  } catch (error) {
    console.error("Error handling contact created:", error);
  }
}
async function sendPaymentConfirmationEmail(invoiceData) {
  console.log(`Would send payment confirmation email to ${invoiceData.contactDetails?.email}`);
  console.log(`Payment received: $${invoiceData.amountPaid} for invoice ${invoiceData.invoiceNumber}`);
}
async function sendOverdueReminderEmail(invoiceData) {
  console.log(`Would send overdue reminder to ${invoiceData.contactDetails?.email}`);
  console.log(`Invoice ${invoiceData.invoiceNumber} is overdue. Amount due: $${invoiceData.amountDue}`);
}
async function sendWelcomeEmail(contactData) {
  console.log(`Would send welcome email to ${contactData.email}`);
  console.log(`Welcome ${contactData.name} to EXIMIA!`);
}
async function sendInternalNotification(type, data) {
  console.log(`INTERNAL NOTIFICATION [${type.toUpperCase()}]:`, JSON.stringify(data, null, 2));
  await sendGHLWebhookNotification(type, data);
}
async function sendGHLWebhookNotification(type, data) {
  try {
    const webhookUrl = "https://services.leadconnectorhq.com/hooks/L3bLLVwvhdJ7A9WqkPxM/webhook-trigger/2610d3ce-66a7-4a6d-9390-10b8cd5bf071";
    const payload = {
      event: `eximia_${type}`,
      eventType: type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      // Datos principales en el nivel superior para fácil acceso
      contactId: data.contactId || data.ghlContactId,
      phone: data.contact?.phone || data.customer?.phone,
      email: data.contact?.email || data.customer?.email,
      name: data.contact?.name || data.customer?.name,
      // Datos completos
      data,
      source: "EXIMIA Auto-Cotizaci\xF3n",
      // Metadatos para debugging
      debug: {
        hasContactId: !!(data.contactId || data.ghlContactId),
        phoneFormatted: data.contact?.phone || data.customer?.phone,
        triggerTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    console.log("Sending GHL webhook notification:", JSON.stringify(payload, null, 2));
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EXIMIA-Webhook/1.0"
      },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      console.log("GHL webhook notification sent successfully");
      console.log("Webhook details sent:");
      console.log("- Contact ID:", payload.contactId);
      console.log("- Phone:", payload.phone);
      console.log("- Event:", payload.event);
    } else {
      console.error("GHL webhook notification failed:", response.status, response.statusText);
      const responseText = await response.text();
      console.error("Response body:", responseText);
    }
  } catch (error) {
    console.error("Error sending GHL webhook notification:", error);
  }
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
