// Stripe client disabled - using GHL instead
// This file is kept for reference but not used

export const stripeClient = {
  createSubscriptionCheckout: () => {
    throw new Error("Stripe integration disabled - using GHL instead");
  },
  verifySignature: () => {
    throw new Error("Stripe integration disabled - using GHL instead");
  }
};
