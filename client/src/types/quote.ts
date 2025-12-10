export interface QuoteState {
  packageId: string;
  addonIds: string[];
  contact?: ContactInfo;
  totals?: QuoteTotals;
}

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
}

export interface QuoteTotals {
  subtotalMonthly: number;
  taxMonthly: number;
  setupFee: number;
  totalToday: number;
  totalMonthly: number;
}

export interface Package {
  id: string;
  name: string;
  monthly?: number;
  oneTime?: number;
  desc: string;
  features: string[];
  popular?: boolean;
  hasAI?: boolean;
  canBundleWith?: string[];
  ghlPriceId: string;
}

export interface Addon {
  id: string;
  name: string;
  monthly: number;
  desc: string;
  icon: string;
  iconColor: string;
}

export interface PricingConfig {
  currency: string;
  collectFirstMonthToday: boolean;
  tax: {
    enabled: boolean;
    label: string;
    rate: number;
  };
  setupFee: {
    enabled: boolean;
    label: string;
    amount: number;
  };
  packages: Package[];
  addons: Addon[];
}
