import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactSchema } from "@shared/schema";
import { calculateTotals } from "./lib/money";
import { eximiaClient } from "./services/eximiaClient";
import { ghlClient, formatPhoneForWebhook } from "./services/ghlClient";
// PayPal removed - using only GHL estimates
import { z } from "zod";
import fs from "fs";
import path from "path";
import { setupAdminAuth, requireAdmin } from "./adminAuth";

// Function to find and load pricing configuration from correct path
function loadPricingConfig() {
  const possiblePaths = [
    // Development path (when running from server/)
    path.join(import.meta.dirname, "config/pricing.json"),
    // Production path (when running from dist/)
    path.join(import.meta.dirname, "../server/config/pricing.json"),
    // Alternative production path (if config is copied to dist/config/)
    path.join(process.cwd(), "dist/config/pricing.json"),
    // Fallback to current working directory
    path.join(process.cwd(), "server/config/pricing.json"),
  ];

  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        console.log(`📄 Loaded pricing config from: ${configPath}`);
        return config;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${configPath}:`, error.message);
    }
  }

  // If no config file found, return default configuration
  console.warn("⚠️  No pricing.json found, using default configuration");
  return {
    currency: "USD",
    collectFirstMonthToday: true,
    tax: { enabled: false, label: "", rate: 0 },
    setupFee: { enabled: false, label: "Cuota de configuración (única)", amount: 199 },
    contractTerms: [
      { id: "1month", name: "1 mes", months: 1, discount: 0, label: "Mes a mes" }
    ],
    packages: [],
    addons: []
  };
}

// Load pricing configuration
const pricingConfig = loadPricingConfig();

// Function to get pricing data (GHL products or static config)
async function getPricingData() {
  try {
    // First try to get products from GHL
    const ghlProducts = await ghlClient.getProducts();
    
    if (ghlProducts && ghlProducts.length > 0) {
      // Transform GHL products to our format
      const packages = ghlProducts
        .filter(product => product.type === "SERVICE")
        .map(product => ({
          id: product.id,
          name: product.name,
          monthly: product.prices?.[0]?.amount ? product.prices[0].amount / 100 : 0,
          desc: product.description,
          features: ["Incluye todas las funcionalidades del producto"],
          ghlPriceId: product.prices?.[0]?.id,
        }));

      const addons = ghlProducts
        .filter(product => product.type === "DIGITAL")
        .map(product => ({
          id: product.id,
          name: product.name,
          monthly: product.prices?.[0]?.amount ? product.prices[0].amount / 100 : 0,
          desc: product.description,
          icon: "fas fa-plus",
          iconColor: "primary",
          ghlPriceId: product.prices?.[0]?.id,
        }));

      return {
        ...pricingConfig,
        packages: packages.length > 0 ? packages : pricingConfig.packages,
        addons: addons.length > 0 ? addons : pricingConfig.addons,
        fromGHL: true,
      };
    }
  } catch (error: any) {
    console.log("Using static pricing config (GHL not available):", error?.message || "Unknown error");
  }
  
  // Fallback to static configuration
  return { ...pricingConfig, fromGHL: false };
}

const quotePreviewSchema = z.object({
  packageId: z.string(),
  addonIds: z.array(z.string()).default([]),
  contractTerm: z.string().default("1month"),
  contact: contactSchema.optional(),
});

const checkoutSchema = z.object({
  packageId: z.string(),
  addonIds: z.array(z.string()).default([]),
  contractTerm: z.string().default("1month"),
  contact: contactSchema,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin Auth middleware
  setupAdminAuth(app);

  // Get pricing configuration (from GHL or static)
  app.get("/api/pricing", async (req, res) => {
    try {
      const pricing = await getPricingData();
      res.json(pricing);
    } catch (error) {
      console.error("Error getting pricing data:", error);
      res.json(pricingConfig); // Fallback to static config
    }
  });

  // Admin panel - get all quotes (protected - only for authorized admins)
  app.get("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      
      // Sort by creation date (newest first)
      const sortedQuotes = quotes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(sortedQuotes);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Preview quote with calculations
  app.post("/api/quote/preview", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = quotePreviewSchema.parse(req.body);
      
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p: any) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no válido" });
      }

      const selectedAddons = pricing.addons.filter((addon: any) => 
        addonIds.includes(addon.id)
      );

      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);

      res.json({
        package: selectedPackage,
        addons: selectedAddons,
        totals,
        pricing: {
          currency: pricing.currency,
          tax: pricing.tax,
          setupFee: pricing.setupFee,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Webhook test endpoint for debugging
  app.get("/api/webhook/test", (req, res) => {
    console.log("🧪 Webhook test endpoint accessed");
    res.json({ 
      status: "Webhook endpoint is working", 
      timestamp: new Date().toISOString(),
      endpoint: "/api/webhook/ghl"
    });
  });

  // Webhook debugging endpoint to simulate GHL webhook
  app.post("/api/webhook/debug", express.json(), (req, res) => {
    console.log("🐛 Debug webhook received:", JSON.stringify(req.body, null, 2));
    console.log("🐛 Debug headers:", JSON.stringify(req.headers, null, 2));
    res.json({ 
      received: true, 
      body: req.body, 
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  });
  
  // GHL Webhook endpoint for notifications
  app.post("/api/webhook/ghl", async (req, res) => {
    try {
      // Parse body if it's raw
      let event;
      if (Buffer.isBuffer(req.body)) {
        try {
          event = JSON.parse(req.body.toString());
          console.log("📦 Parsed raw body to JSON");
        } catch (parseError) {
          console.error("❌ Failed to parse webhook body:", parseError);
          return res.status(400).json({ error: "Invalid JSON payload" });
        }
      } else {
        event = req.body;
      }
      
      console.log("🔗 GHL Webhook received - Full payload:", JSON.stringify(event, null, 2));
      console.log("🔗 Headers:", JSON.stringify(req.headers, null, 2));
      
      // Log the structure we're receiving for debugging
      console.log("📋 Event structure analysis:");
      console.log("- Event type:", event.type || event.eventType || event.event);
      console.log("- Data keys:", Object.keys(event.data || event));
      console.log("- Full event keys:", Object.keys(event));
      
      // Try different possible event type fields that GHL might use
      const eventType = event.type || event.eventType || event.event || event.trigger;
      
      if (!eventType) {
        console.log("❌ No event type found in webhook payload");
        console.log("📋 Available keys:", Object.keys(event));
        return res.status(400).json({ error: "No event type specified" });
      }
      
      console.log(`🎯 Processing event type: ${eventType}`);
      
      // Process different event types with more flexible matching
      const normalizedEventType = eventType.toLowerCase();
      
      if (normalizedEventType.includes('invoice') && normalizedEventType.includes('paid')) {
        console.log("💰 Processing invoice payment");
        await handleInvoicePaid(event.data || event);
      } else if (normalizedEventType.includes('invoice') && normalizedEventType.includes('overdue')) {
        console.log("⚠️ Processing overdue invoice");
        await handleInvoiceOverdue(event.data || event);
      } else if (normalizedEventType.includes('invoice') && normalizedEventType.includes('cancel')) {
        console.log("❌ Processing cancelled invoice");
        await handleInvoiceCancelled(event.data || event);
      } else if (normalizedEventType.includes('contact') && normalizedEventType.includes('create')) {
        console.log("👤 Processing new contact");
        await handleContactCreated(event.data || event);
      } else {
        console.log(`❓ Unhandled webhook event type: ${eventType}`);
        console.log("📋 Event payload for analysis:", JSON.stringify(event, null, 2));
      }
      
      res.status(200).json({ 
        received: true, 
        eventType: eventType,
        processed: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("❌ Webhook processing error:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Request body that caused error:", JSON.stringify(req.body, null, 2));
      res.status(500).json({ 
        error: "Webhook processing failed", 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Send invoice (step 2 - Data page)
  app.post("/api/send-estimate", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = checkoutSchema.parse(req.body);
      
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p: any) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no válido" });
      }

      const selectedAddons = pricing.addons.filter((addon: any) => 
        addonIds.includes(addon.id)
      );

      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);

      // Step 1: Create/Update contact in GHL CRM
      let ghlContactId: string | undefined;
      const locationId = process.env.GHL_LOCATION_ID || "L3bLLVwvhdJ7A9WqkPxM"; // Fallback to known location
      
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
            locationId: locationId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company
          });
          // Add tag separately
          if (ghlContactId) {
            await ghlClient.addTagToContact(ghlContactId, "eximia-cotizacion");
          }
        }
        console.log(`GHL Contact created/found with ID: ${ghlContactId}`);
      } catch (error: any) {
        console.error("Error with GHL contact:", error);
        console.error("GHL Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }

      // Step 2: Create invoice in GoHighLevel
      let ghlInvoiceId: string | undefined;
      try {
        if (ghlContactId) {
          const invoiceItems = [
            {
              name: selectedPackage.name,
              description: `Paquete ${selectedPackage.name} - ${totals.contractTerm?.label || "Mes a mes"}${(contact as any).monthlyAdSpend ? ` - Presupuesto anuncios: $${(contact as any).monthlyAdSpend}/mes` : ''}`,
              amount: totals.totalMonthly,
              qty: 1,
              currency: pricing.currency,
              type: "recurring" as const
            }
          ];

          // Add addons to invoice
          selectedAddons.forEach((addon: any) => {
            invoiceItems.push({
              name: addon.name,
              description: addon.desc,
              amount: addon.monthly,
              qty: 1,
              currency: pricing.currency,
              type: "recurring" as const
            });
          });

          console.log(`Creating estimate for contact: ${ghlContactId} in location: ${locationId}`);
          const estimateResponse = await ghlClient.createEstimate({
            locationId: locationId,
            contactId: ghlContactId,
            contactName: contact.name,
            contactEmail: contact.email,
            contactPhone: contact.phone,
            name: `Cotización EXIMIA - ${selectedPackage.name}`,
            amount: totals.totalMonthly,
            packageName: selectedPackage.name,
            currency: pricing.currency,
            items: invoiceItems,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          
          ghlInvoiceId = typeof estimateResponse === 'string' ? estimateResponse : (estimateResponse as any)?._id || estimateResponse;

          console.log(`Estimate created in GoHighLevel: ${ghlInvoiceId}`);
        }
      } catch (error: any) {
        console.error("Error creating GHL estimate:", error);
        console.error("GHL Estimate Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }

      // Step 3: Create quote in storage
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
      
      // Step 4: Send notification about new estimate created
      console.log(`🔔 Checking notification conditions: ghlInvoiceId=${ghlInvoiceId}, ghlContactId=${ghlContactId}`);
      
      // Always send notification, even if GHL parts failed
      try {
        // Esperar un momento para que GHL procese el contacto
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await sendInternalNotification('estimate_created', {
          // Información básica de referencia
          quoteId: newQuote.id,
          timestamp: new Date().toISOString(),
          
          // Información del cliente (solo lo que proporcionó)
          contact: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company || null,
            // Información de facturación (si la proporcionó)
            ...(contact.needsBilling && {
              billingAddress: contact.billingAddress,
              billingCity: contact.billingCity,
              billingState: contact.billingState,
              billingZip: contact.billingZip
            }),
            // Gasto mensual en publicidad (si lo proporcionó)
            ...(contact.monthlyAdSpend && {
              monthlyAdSpend: contact.monthlyAdSpend
            })
          },
          
          // Cotización - Paquete seleccionado
          package: {
            name: selectedPackage.name,
            monthlyPrice: selectedPackage.monthly
          },
          
          // Cotización - Addons seleccionados
          addons: selectedAddons.map(addon => ({
            name: addon.name,
            monthlyPrice: addon.monthly,
            setupFee: addon.setup || 0
          })),
          
          // Términos del contrato
          contractTerm: contractTerm,
          
          // Totales calculados
          totals: {
            monthlyRecurring: totals.monthlyRecurring,
            oneTimeSetup: totals.oneTimeSetup,
            taxAmount: totals.taxAmount,
            totalToday: totals.totalToday,
            totalMonthly: totals.totalMonthly
          }
        });
        console.log(`✅ Internal notification sent successfully for quote ${newQuote.id}`);
      } catch (notificationError) {
        console.error("❌ Failed to send internal notification:", notificationError);
        // Don't fail the whole request if notification fails
      }

      res.json({
        success: true,
        quoteId: newQuote.id,
        invoiceId: ghlInvoiceId,
        message: "Factura enviada exitosamente"
      });
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PayPal routes removed - using only GHL estimates

  // Process checkout and create payment
  app.post("/api/checkout", async (req, res) => {
    try {
      const { packageId, addonIds, contractTerm, contact } = checkoutSchema.parse(req.body);
      
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p: any) => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Paquete no válido" });
      }

      const selectedAddons = pricing.addons.filter((addon: any) => 
        addonIds.includes(addon.id)
      );

      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, contractTerm);

      // Step 1: Create/Update contact in EXIMIA CRM
      let eximiaContactId: string | undefined;
      try {
        eximiaContactId = await eximiaClient.upsertContact({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          locationId: process.env.EXIMIA_LOCATION_ID!,
          tags: ["AutoCotizacion", "EXIMIA"],
        });
      } catch (error) {
        console.error("Error creating EXIMIA contact:", error);
        // Continue without EXIMIA contact ID - we'll handle this in the payment flow
      }

      // Step 2: Try to create recurring charge with EXIMIA Billing
      let paymentUrl: string | undefined;
      let eximiaInvoiceId: string | undefined;

      try {
        const eximiaPayment = await eximiaClient.createRecurringCharge({
          contactId: eximiaContactId,
          locationId: process.env.EXIMIA_LOCATION_ID!,
          description: `Plan ${selectedPackage.name}${selectedAddons.length > 0 ? ` + ${selectedAddons.map((a: any) => a.name).join(", ")}` : ""} — EXIMIA`,
          amountMonthly: totals.totalMonthly,
          taxRate: pricingConfig.tax.rate,
          setupFee: totals.setupFee,
        });

        paymentUrl = eximiaPayment.paymentUrl;
        eximiaInvoiceId = eximiaPayment.invoiceId;
      } catch (error) {
        console.error("EXIMIA Billing failed, using Stripe fallback:", error);
      }

      // Step 3: Plan B - Use GHL if EXIMIA Billing failed
      let ghlInvoiceId: string | undefined;
      let ghlContactId: string | undefined;
      
      if (!paymentUrl) {
        try {
          const locationId = "L3bLLVwvhdJ7A9WqkPxM";
          
          // Create contact in GoHighLevel using real contact data
          ghlContactId = await ghlClient.createContact({
            locationId: locationId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company || contact.businessName
          });
          console.log("GHL Contact created/found with ID:", ghlContactId);

          // Build invoice items for GHL with real data
          const invoiceItems = [
            {
              name: selectedPackage.name,
              description: `${selectedPackage.desc} - Servicio completo EXIMIA`,
              price: selectedPackage.monthly,
              quantity: 1,
            },
            ...selectedAddons.map((addon: any) => ({
              name: addon.name,
              description: addon.desc,
              price: addon.monthly,
              quantity: 1,
            })),
          ];

          // Add setup fee if enabled
          if (pricingConfig.setupFee.enabled) {
            invoiceItems.push({
              name: pricingConfig.setupFee.label,
              description: "Cuota única de configuración e implementación",
              price: pricingConfig.setupFee.amount,
              quantity: 1,
            });
          }

          const ghlInvoice = await ghlClient.createInvoice({
            contactId: ghlContactId,
            locationId: locationId,
            name: `Factura EXIMIA - ${selectedPackage.name}`,
            amount: totals.totalToday,
            currency: "USD",
            packageName: selectedPackage.name,
            contactName: contact.name,
            contactPhone: contact.phone,
            contactEmail: contact.email,
            items: invoiceItems.map(item => ({
              name: item.name,
              description: item.description,
              amount: item.price,
              qty: item.quantity,
              currency: "USD",
              type: "recurring" as const
            }))
          });

          paymentUrl = `https://app.gohighlevel.com/invoices/${ghlInvoice._id}/pay`;
          ghlInvoiceId = ghlInvoice._id;

          // Add note to EXIMIA CRM about GHL invoice
          if (eximiaContactId) {
            try {
              await eximiaClient.addNote(
                eximiaContactId,
                `📧 Factura generada via GHL. Invoice ID: ${ghlInvoiceId}. Total: ${totals.totalToday.toFixed(2)} USD. Plan: ${selectedPackage.name}${selectedAddons.length > 0 ? ` + ${selectedAddons.map((a: any) => a.name).join(", ")}` : ""}`
              );
            } catch (noteError) {
              console.error("Failed to add GHL note to EXIMIA:", noteError);
            }
          }
          // Note: Invoice created as draft in GoHighLevel CRM
          // You can manually send it from the CRM interface
          console.log(`Invoice created as draft in GoHighLevel: ${ghlInvoice._id}`);

        } catch (ghlError) {
          console.error("GHL invoice creation failed:", ghlError);
          return res.status(500).json({ 
            message: "Error al generar la factura. Por favor intenta nuevamente." 
          });
        }
      }

      // Save quote to storage
      const quote = await storage.createQuote({
        packageId,
        addonIds,
        contact,
        totals,
        eximiaContactId,
        ghlInvoiceId: ghlInvoiceId,
        ghlCustomerId: ghlContactId,
        paymentUrl,
        status: "pending",
      });

      res.json({
        quoteId: quote.id,
        paymentUrl,
        invoiceId: eximiaInvoiceId || ghlInvoiceId,
        subscriptionId: ghlInvoiceId,
        contactId: eximiaContactId,
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // GHL webhook handler
  app.post("/api/webhooks/ghl", async (req, res) => {
    try {
      const isValid = await ghlClient.verifyWebhook(req.body, req.headers['x-ghl-signature'] as string);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }

      const event = req.body;

      switch (event.type) {
        case 'InvoicePaid':
        case 'invoice.paid':
          const invoiceData = event.data || event;
          const { contactId, invoiceId, amount } = invoiceData;

          // Find quote by invoice ID or contact
          // Note: This might need adjustment based on actual GHL webhook payload structure
          const allQuotes = Array.from(await storage.getQuotesByEmail(invoiceData.customerEmail || ""));
          const pendingQuote = allQuotes.find(q => q.status === "pending");
          
          if (pendingQuote) {
            await storage.updateQuote(pendingQuote.id, {
              status: "paid",
            });
          }

          // Add success note to EXIMIA CRM
          if (contactId) {
            try {
              await eximiaClient.addNote(
                contactId,
                `✅ Factura pagada via GHL. Invoice ID: ${invoiceId}. Monto: $${(amount / 100).toFixed(2)} USD.`
              );

              // Create opportunity in EXIMIA CRM
              await eximiaClient.createOrUpdateOpportunity({
                contactId: contactId,
                pipelineId: process.env.EXIMIA_PIPELINE_ID!,
                stageId: process.env.EXIMIA_STAGE_ACTIVE_ID!,
                monetaryValue: amount / 100, // Convert from cents if needed
              });
            } catch (eximiaError) {
              console.error("Failed to update EXIMIA CRM:", eximiaError);
            }
          }
          break;

        case 'InvoiceOverdue':
        case 'invoice.overdue':
          // Handle overdue invoice
          console.log(`Invoice overdue: ${event.data?.invoiceId}`);
          break;

        default:
          console.log(`Unhandled GHL event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("GHL Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Get quote by ID
  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Test invoice endpoint
  app.post("/api/test-invoice", async (req, res) => {
    try {
      // Use unique email to avoid duplicate contact errors  
      const uniqueEmail = `test-${Date.now()}@eximia.agency`;
      const testContactData = {
        email: uniqueEmail,
        name: "EXIMIA Agency",
        lastName: "Test",
        company: "EXIMIA",
        phone: "+1-787-555-0123",
        website: "https://eximia.agency",
        monthlyAdSpend: 1000,
        needsBilling: true,
        businessName: "EXIMIA Agency LLC",
        taxId: "66-1234567",
        billingAddress: "San Juan, Puerto Rico"
      };

      const testQuoteData = {
        packageId: "starter",
        addonIds: ["analytics"]
      };

      // Get pricing data
      const pricing = await getPricingData();
      const selectedPackage = pricing.packages.find((p: any) => p.id === testQuoteData.packageId);
      const selectedAddons = pricing.addons.filter((a: any) => testQuoteData.addonIds.includes(a.id));

      if (!selectedPackage) {
        return res.status(400).json({ error: "Invalid package selected" });
      }

      // Calculate totals
      const totals = calculateTotals(selectedPackage, selectedAddons, pricing, "1month");

      // Create quote in storage
      const quoteId = await storage.createQuote({
        packageId: testQuoteData.packageId,
        addonIds: testQuoteData.addonIds,
        contractTerm: "1month",
        contact: testContactData,
        totals: totals,
        status: "pending"
      });

      // Try GoHighLevel first
      try {
        const locationId = "L3bLLVwvhdJ7A9WqkPxM"; // Your Location ID

        // Create or get contact in GoHighLevel using real contact data
        let contactId;
        try {
          contactId = await ghlClient.createContact({
            locationId: locationId,
            name: testContactData.name,
            email: testContactData.email,
            phone: testContactData.phone,
            company: testContactData.company
          });
          console.log("Contact created/found with ID:", contactId);
        } catch (contactError) {
          console.error("Failed to create contact:", contactError);
          // Fallback to known working contact for now
          contactId = "JpoYBpphC6cfMbUjQiEw";
        }

        // Create invoice items
        const invoiceItems = [
          {
            name: selectedPackage.name,
            description: `Paquete ${selectedPackage.name} - Presupuesto anuncios: $${testContactData.monthlyAdSpend}/mes`,
            amount: totals.totalMonthly,
            qty: 1,
            currency: pricing.currency,
            type: "recurring" as const
          }
        ];

        // Add addons as separate items
        selectedAddons.forEach((addon: any) => {
          invoiceItems.push({
            name: addon.name,
            description: addon.description || `Add-on: ${addon.name}`,
            amount: addon.price,
            qty: 1,
            currency: pricing.currency,
            type: "recurring" as const
          });
        });

        // Create invoice in GHL
        const invoice = await ghlClient.createInvoice({
          contactId: contactId,
          locationId: locationId,
          name: `Factura EXIMIA - ${selectedPackage.name}`,
          amount: totals.totalMonthly,
          currency: pricing.currency,
          packageName: selectedPackage.name,
          contactName: testContactData.name,
          contactPhone: testContactData.phone,
          contactEmail: testContactData.email,
          items: invoiceItems
        });

        // Invoice created as draft in GoHighLevel CRM
        console.log(`Invoice created as draft in GoHighLevel: ${invoice._id}`);

        // Update quote with GHL info
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
          message: "✅ Factura creada y enviada exitosamente a info@eximia.agency vía GoHighLevel",
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
        
        // Update quote as test only
        await storage.updateQuote(quoteId.id, {
          status: "test_invoice_created"
        });

        res.json({
          success: true,
          quoteId: quoteId.id,
          message: "Factura de prueba creada (modo simulación - servicio de facturación no disponible)",
          testData: {
            email: testContactData.email,
            package: selectedPackage.name,
            addons: selectedAddons.map((a: any) => a.name),
            totals: totals,
            note: "Esta factura se enviaría a info@eximia.agency en producción"
          }
        });
      }

    } catch (error: any) {
      console.error("Test invoice error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Webhook handlers for GHL events
async function handleInvoicePaid(invoiceData: any) {
  try {
    console.log("Processing invoice payment:", invoiceData.invoiceNumber);
    
    // Update quote status in database (storage doesn't have getQuotes, so we'll log for now)
    console.log(`Looking for quote with GHL Invoice ID: ${invoiceData._id}`);
    // TODO: Implement quote status update when storage interface is extended
    
    // Send payment confirmation email
    await sendPaymentConfirmationEmail(invoiceData);
    
    // Send internal notification to EXIMIA team
    await sendInternalNotification('payment', {
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.amountPaid,
      customerName: invoiceData.contactDetails?.name,
      customerEmail: invoiceData.contactDetails?.email
    });
    
  } catch (error) {
    console.error("Error handling invoice paid:", error);
  }
}

async function handleInvoiceOverdue(invoiceData: any) {
  try {
    console.log("Processing overdue invoice:", invoiceData.invoiceNumber);
    
    // Send overdue reminder email
    await sendOverdueReminderEmail(invoiceData);
    
    // Send internal notification
    await sendInternalNotification('overdue', {
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.amountDue,
      customerName: invoiceData.contactDetails?.name,
      dueDate: invoiceData.dueDate
    });
    
  } catch (error) {
    console.error("Error handling invoice overdue:", error);
  }
}

async function handleInvoiceCancelled(invoiceData: any) {
  try {
    console.log("Processing cancelled invoice:", invoiceData.invoiceNumber);
    
    // Send internal notification
    await sendInternalNotification('cancelled', {
      invoiceNumber: invoiceData.invoiceNumber,
      customerName: invoiceData.contactDetails?.name
    });
    
  } catch (error) {
    console.error("Error handling invoice cancelled:", error);
  }
}

async function handleContactCreated(contactData: any) {
  try {
    console.log("Processing new contact created:", contactData.name);
    
    // Send welcome email to new contact
    await sendWelcomeEmail(contactData);
    
  } catch (error) {
    console.error("Error handling contact created:", error);
  }
}

// Email notification functions
async function sendPaymentConfirmationEmail(invoiceData: any) {
  // For now, just log - you can implement email sending later
  console.log(`Would send payment confirmation email to ${invoiceData.contactDetails?.email}`);
  console.log(`Payment received: $${invoiceData.amountPaid} for invoice ${invoiceData.invoiceNumber}`);
}

async function sendOverdueReminderEmail(invoiceData: any) {
  console.log(`Would send overdue reminder to ${invoiceData.contactDetails?.email}`);
  console.log(`Invoice ${invoiceData.invoiceNumber} is overdue. Amount due: $${invoiceData.amountDue}`);
}

async function sendWelcomeEmail(contactData: any) {
  console.log(`Would send welcome email to ${contactData.email}`);
  console.log(`Welcome ${contactData.name} to EXIMIA!`);
}

async function sendInternalNotification(type: string, data: any) {
  console.log(`INTERNAL NOTIFICATION [${type.toUpperCase()}]:`, JSON.stringify(data, null, 2));
  
  // Send notification to GoHighLevel webhook
  await sendGHLWebhookNotification(type, data);
}

async function sendGHLWebhookNotification(type: string, data: any) {
  try {
    const webhookUrl = "https://services.leadconnectorhq.com/hooks/L3bLLVwvhdJ7A9WqkPxM/webhook-trigger/2610d3ce-66a7-4a6d-9390-10b8cd5bf071";
    
    // Payload optimizado para workflows de GoHighLevel
    const payload = {
      event: `eximia_${type}`,
      eventType: type,
      timestamp: new Date().toISOString(),
      // Datos principales en el nivel superior para fácil acceso
      contactId: data.contactId || data.ghlContactId,
      phone: data.contact?.phone || data.customer?.phone,
      email: data.contact?.email || data.customer?.email,
      name: data.contact?.name || data.customer?.name,
      // Datos completos
      data: data,
      source: "EXIMIA Auto-Cotización",
      // Metadatos para debugging
      debug: {
        hasContactId: !!(data.contactId || data.ghlContactId),
        phoneFormatted: data.contact?.phone || data.customer?.phone,
        triggerTime: new Date().toISOString()
      }
    };
    
    console.log("Sending GHL webhook notification:", JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EXIMIA-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log("GHL webhook notification sent successfully");
      
      // Log adicional para debugging
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
