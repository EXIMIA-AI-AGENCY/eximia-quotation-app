import axios from "axios";

interface CreateContactParams {
  name: string;
  email: string;
  phone: string;
  company?: string;
  locationId: string;
}

interface CreateInvoiceParams {
  contactId: string;
  locationId: string;
  name: string;
  amount: number;
  currency: string;
  packageName: string;
  dueDate?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  items: Array<{
    name: string;
    description: string;
    amount: number;
    qty: number;
    currency: string;
    type: "one_time" | "recurring";
  }>;
}

interface GHLInvoiceResponse {
  _id: string;
  status: string;
  invoiceNumber: number;
  total: number;
  amountDue: number;
}

interface GHLEstimateResponse {
  _id: string;
  status: string;
  estimateNumber: number;
  total: number;
}

interface GHLContactResponse {
  contact: {
    id: string;
    email: string;
    name: string;
  };
}

interface GHLProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  images: string[];
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    type: "ONE_TIME" | "RECURRING";
    interval?: "month" | "year";
  }>;
}

class GHLClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GHL_API_KEY || "";
    this.baseUrl = "https://services.leadconnectorhq.com";

    if (!this.apiKey) {
      console.warn("⚠️  GHL_API_KEY not configured - GHL integration disabled");
    } else {
      console.log(`GHL Token: ${this.apiKey.substring(0, 15)}...`);
    }
  }

  // Formatear número para compatibilidad con GoHighLevel
  private formatPhoneForGHL(phone: string): string {
    // Limpiar el número: solo dígitos
    const cleaned = phone.replace(/\D/g, '');

    // Si empieza con 1 y tiene 11 dígitos (formato US/PR), mantenerlo
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    // Si tiene 10 dígitos, agregar código de país US/PR
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // Si ya tiene código de país, mantenerlo con +
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }

    // Para números más cortos, devolver tal como está pero con +
    return `+${cleaned}`;
  }

  // Obtener variaciones del número para búsqueda
  private getPhoneVariations(phone: string): string[] {
    const cleaned = phone.replace(/\D/g, '');
    const variations = [
      phone, // Original
      cleaned, // Solo números
      `+${cleaned}`, // Con +
    ];

    // Si no tiene código de país, agregar variación con +1
    if (cleaned.length === 10) {
      variations.push(`+1${cleaned}`);
      variations.push(`1${cleaned}`);
    }

    // Si tiene código de país 1, agregar variación sin él
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      variations.push(cleaned.substring(1));
    }

    return Array.from(new Set(variations)); // Eliminar duplicados
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28",
    };
  }

  async searchContactByPhone(locationId: string, phone: string): Promise<string | null> {
    try {
      const phoneVariations = this.getPhoneVariations(phone);
      console.log("Searching for contact with phone variations:", phoneVariations);

      // Probar búsqueda con cada variación del número
      for (const variation of phoneVariations) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/contacts/`,
            {
              params: {
                locationId: locationId,
                query: variation
              },
              headers: this.getHeaders()
            }
          );

          if (response.data.contacts && response.data.contacts.length > 0) {
            // Buscar contacto que coincida con cualquier variación del teléfono
            const existingContact = response.data.contacts.find((contact: any) => {
              if (!contact.phone) return false;

              const contactVariations = this.getPhoneVariations(contact.phone);
              return phoneVariations.some(userVar =>
                contactVariations.some(contactVar => contactVar === userVar)
              );
            });

            if (existingContact) {
              console.log("Found existing contact with phone:", variation, "→ ID:", existingContact.id);
              return existingContact.id;
            }
          }
        } catch (searchError) {
          // Continuar con la siguiente variación si falla una búsqueda
          continue;
        }
      }

      return null;
    } catch (error: any) {
      console.log("No existing contact found for phone:", phone);
      return null;
    }
  }

  async addTagToContact(contactId: string, tag: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/contacts/${contactId}/tags`,
        {
          tags: [tag]
        },
        { headers: this.getHeaders() }
      );
      console.log(`Tag "${tag}" added to contact ${contactId}`);
    } catch (error: any) {
      console.error("Error adding tag to contact:", error.response?.data || error.message);
    }
  }

  async createContact(params: CreateContactParams): Promise<string> {
    try {
      const quotationTag = "eximia-cotizacion";

      // Primero, buscar contacto existente por teléfono
      const existingContactId = await this.searchContactByPhone(params.locationId, params.phone);
      if (existingContactId) {
        console.log("Found existing contact with phone:", params.phone, "ID:", existingContactId);

        // Agregar tag de cotización al contacto existente
        await this.addTagToContact(existingContactId, quotationTag);
        console.log("Added quotation tag to existing contact");

        return existingContactId;
      }

      // Si no existe, crear nuevo contacto con tag
      const formattedPhone = this.formatPhoneForGHL(params.phone);
      console.log("Creating new contact for phone:", params.phone, "→", formattedPhone);
      const response = await axios.post(
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

    } catch (error: any) {
      console.log("Error response:", error.response?.data);

      // Si el contacto ya existe, usar el ID del contacto existente y agregar tag
      if (error.response?.status === 400 && error.response?.data?.message?.includes("duplicated contacts")) {
        const existingContactId = error.response?.data?.meta?.contactId;

        if (existingContactId) {
          console.log("Contact already exists (from error), using existing contact ID:", existingContactId);

          // Agregar tag de cotización al contacto existente
          await this.addTagToContact(existingContactId, "eximia-cotizacion");
          console.log("Added quotation tag to existing contact from error");

          return existingContactId;
        }
      }

      console.error("GHL contact creation error:", error.response?.data || error);
      throw new Error("Failed to create contact in GoHighLevel");
    }
  }

  private normalizePhoneToE164(phone: string): string {
    // Usar la función formatPhoneForGHL para consistencia
    return this.formatPhoneForGHL(phone);
  }

  async createEstimate(params: CreateInvoiceParams): Promise<GHLEstimateResponse> {
    try {
      const today = new Date();

      // Normalize phone number to E.164 format
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
        items: params.items.map(item => ({
          name: item.name,
          description: item.description,
          amount: item.amount,
          qty: item.qty,
          currency: params.currency,
          type: "one_time"
        })),
        issueDate: today.toISOString().split('T')[0],
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

      // Use the correct GHL invoices endpoint
      const response = await axios.post(
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
    } catch (error: any) {
      console.error("GHL estimate creation error:", error.response?.data || error);
      console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.data?.error) {
        console.error("Specific errors:", error.response.data.error);
      }
      throw new Error("Failed to create estimate in GoHighLevel");
    }
  }

  async createInvoice(params: CreateInvoiceParams): Promise<GHLInvoiceResponse> {
    try {
      const today = new Date();
      const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      // Normalize phone number to E.164 format
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
        items: params.items.map(item => ({
          name: item.name,
          description: item.description,
          amount: item.amount,
          qty: item.qty,
          currency: params.currency
        })),
        issueDate: today.toISOString().split('T')[0],
        dueDate: params.dueDate || dueDate.toISOString().split('T')[0],
        liveMode: false,
        discount: {
          type: "percentage",
          value: 0
        },
        sentTo: {
          email: ["info@eximia.agency"]
        }
      };

      const response = await axios.post(
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
    } catch (error: any) {
      console.error("GHL invoice creation error:", error.response?.data || error);
      console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.data?.error) {
        console.error("Specific errors:", error.response.data.error);
      }
      throw new Error("Failed to create invoice in GoHighLevel");
    }
  }

  async getInvoice(invoiceId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/invoices/${invoiceId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("GHL get invoice error:", error);
      throw new Error("Failed to get invoice from GoHighLevel");
    }
  }

  async getProducts(): Promise<GHLProduct[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/products/?locationId=L3bLLVwvhdJ7A9WqkPxM`,
        { headers: this.getHeaders() }
      );
      return response.data.products || response.data || [];
    } catch (error) {
      console.error("GHL get products error:", error);
      throw new Error("Failed to get products from GoHighLevel");
    }
  }

  async sendInvoice(invoiceId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/invoices/${invoiceId}/send`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error("GHL send invoice error:", error);
      throw new Error("Failed to send invoice in GoHighLevel");
    }
  }

  async verifyWebhook(body: any, signature: string): Promise<boolean> {
    // TODO: Implement GHL webhook signature verification
    // GHL webhooks usually include a verification token or signature
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("GHL_WEBHOOK_SECRET not configured");
      return true; // Allow for now, but should implement proper verification
    }

    // For now, just return true - implement proper verification based on GHL docs
    return true;
  }
}

export const ghlClient = new GHLClient();

// Función exportada para formatear números de teléfono para webhook y otras funciones
export function formatPhoneForWebhook(phone: string): string {
  // Limpiar el número: solo dígitos
  const cleaned = phone.replace(/\D/g, '');

  // Si empieza con 1 y tiene 11 dígitos (formato US/PR), mantenerlo
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // Si tiene 10 dígitos, agregar código de país US/PR
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Si ya tiene código de país, mantenerlo con +
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Para números más cortos, devolver tal como está pero con +
  return `+${cleaned}`;
}