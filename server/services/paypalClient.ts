import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  CheckoutPaymentIntent
} from "@paypal/paypal-server-sdk";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID?.trim();
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET?.trim();

// PayPal configuration loaded successfully

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 30000, // 30 seconds timeout
  environment: Environment.Production, // Use LIVE/Production environment
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const ordersController = new OrdersController(client);

export class PayPalClient {

  // Create one-time payment order (keep for compatibility)
  async createOrder(amount: number, currency: string = "USD", description: string = "EXIMIA Services") {
    try {
      
      const collect = {
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              amount: {
                currencyCode: currency,
                value: amount.toFixed(2),
              },
              description: description,
            },
          ],
          applicationContext: {
            returnUrl: `https://${process.env.REPLIT_DEV_DOMAIN}/confirmacion?status=success`,
            cancelUrl: `https://${process.env.REPLIT_DEV_DOMAIN}/pago?status=cancelled`,
          },
        },
        prefer: "return=representation",
      };

      const { body, ...httpResponse } = await ordersController.createOrder(collect);
      const response = JSON.parse(String(body));
      
      return {
        orderId: response.id,
        approvalUrl: response.links?.find((link: any) => link.rel === "approve")?.href,
        response: response,
      };
    } catch (error: any) {
      console.error("PayPal order creation failed:", error.message);
      throw new Error(`PayPal Error: ${error.message || "Failed to create PayPal order"}`);
    }
  }

  // Capture completed order
  async captureOrder(orderId: string) {
    try {
      const collect = {
        id: orderId,
        prefer: "return=representation",
      };

      const { body, ...httpResponse } = await ordersController.captureOrder(collect);
      const response = JSON.parse(String(body));
      
      return response;
    } catch (error) {
      console.error("PayPal order capture failed:", error);
      throw new Error("Failed to capture PayPal order");
    }
  }

  // Create payment for term contracts (simplified approach)
  async createTermPayment(amount: number, months: number, currency: string = "USD", description: string = "EXIMIA Services") {
    // For term contracts, we'll create a single payment for the full term amount
    const totalAmount = amount * months;
    return this.createOrder(totalAmount, currency, `${description} - ${months} month(s)`);
  }
}

export const paypalClient = new PayPalClient();