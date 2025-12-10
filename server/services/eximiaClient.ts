import axios from "axios";

interface UpsertContactParams {
  name: string;
  email: string;
  phone: string;
  company?: string;
  locationId: string;
  tags: string[];
}

interface CreateRecurringChargeParams {
  contactId?: string;
  locationId: string;
  description: string;
  amountMonthly: number;
  taxRate: number;
  setupFee: number;
}

interface CreateOpportunityParams {
  contactId: string;
  pipelineId: string;
  stageId: string;
  monetaryValue: number;
}

class EximiaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.EXIMIA_API_KEY || "";
    // TODO: Update with actual EXIMIA API base URL
    this.baseUrl = "https://api.eximia.com/v1"; // placeholder URL
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async upsertContact(params: UpsertContactParams): Promise<string> {
    try {
      // TODO: Update with actual EXIMIA CRM endpoint
      const response = await axios.post(
        `${this.baseUrl}/contacts/upsert`,
        {
          firstName: params.name.split(" ")[0],
          lastName: params.name.split(" ").slice(1).join(" "),
          email: params.email,
          phone: params.phone,
          companyName: params.company,
          locationId: params.locationId,
          tags: params.tags,
        },
        { headers: this.getHeaders() }
      );

      return response.data.contactId || response.data.id;
    } catch (error) {
      console.error("EXIMIA CRM upsert contact error:", error);
      throw new Error("Failed to create contact in EXIMIA CRM");
    }
  }

  async createRecurringCharge(params: CreateRecurringChargeParams): Promise<{
    paymentUrl: string;
    invoiceId: string;
  }> {
    try {
      // TODO: Update with actual EXIMIA Billing endpoint
      const response = await axios.post(
        `${this.baseUrl}/billing/recurring-charges`,
        {
          contactId: params.contactId,
          locationId: params.locationId,
          description: params.description,
          amount: Math.round(params.amountMonthly * 100), // Convert to cents
          currency: "USD",
          interval: "month",
          taxRate: params.taxRate,
          setupFee: Math.round(params.setupFee * 100),
        },
        { headers: this.getHeaders() }
      );

      return {
        paymentUrl: response.data.paymentUrl,
        invoiceId: response.data.invoiceId,
      };
    } catch (error) {
      console.error("EXIMIA Billing error:", error);
      throw new Error("Failed to create recurring charge in EXIMIA Billing");
    }
  }

  async addNote(contactId: string, text: string): Promise<void> {
    try {
      // TODO: Update with actual EXIMIA CRM notes endpoint
      await axios.post(
        `${this.baseUrl}/contacts/${contactId}/notes`,
        {
          body: text,
          userId: "system", // or get from context
        },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error("EXIMIA add note error:", error);
      throw new Error("Failed to add note to EXIMIA CRM");
    }
  }

  async createOrUpdateOpportunity(params: CreateOpportunityParams): Promise<string> {
    try {
      // TODO: Update with actual EXIMIA CRM opportunities endpoint
      const response = await axios.post(
        `${this.baseUrl}/opportunities`,
        {
          contactId: params.contactId,
          pipelineId: params.pipelineId,
          stageId: params.stageId,
          title: "EXIMIA Auto-cotización",
          monetaryValue: Math.round(params.monetaryValue * 100),
          currency: "USD",
        },
        { headers: this.getHeaders() }
      );

      return response.data.opportunityId || response.data.id;
    } catch (error) {
      console.error("EXIMIA opportunity error:", error);
      throw new Error("Failed to create opportunity in EXIMIA CRM");
    }
  }
}

export const eximiaClient = new EximiaClient();
