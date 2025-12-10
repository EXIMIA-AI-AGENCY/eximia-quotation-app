interface Package {
  id: string;
  name: string;
  monthly?: number;
  oneTime?: number;
  canBundleWith?: string[];
  hasAI?: boolean;
}

interface Addon {
  id: string;
  name: string;
  monthly?: number;
  oneTime?: number;
}

interface ContractTerm {
  id: string;
  name: string;
  months: number;
  discount: number;
  label: string;
}

interface PricingConfig {
  currency: string;
  collectFirstMonthToday: boolean;
  tax: {
    enabled: boolean;
    rate: number;
  };
  setupFee: {
    enabled: boolean;
    amount: number;
  };
  contractTerms?: ContractTerm[];
}

export interface CalculatedTotals {
  subtotalMonthly: number;
  discountedSubtotal: number;
  discount: number;
  discountPercentage: number;
  taxMonthly: number;
  setupFee: number;
  oneTimeFees: number;
  totalToday: number;
  totalMonthly: number;
  contractTerm?: ContractTerm;
}

export function calculateTotals(
  selectedPackage: Package,
  selectedAddons: Addon[],
  config: PricingConfig,
  contractTermId: string = "1month"
): CalculatedTotals {
  const subtotalMonthly = (selectedPackage.monthly || 0) + 
    selectedAddons.reduce((sum, addon) => sum + (addon.monthly || 0), 0);
  
  // Calculate one-time fees from package and addons
  const packageOneTime = selectedPackage.oneTime || 0;
  const addonOneTimeFees = selectedAddons.reduce((sum, addon) => sum + (addon.oneTime || 0), 0);
  const oneTimeFees = packageOneTime + addonOneTimeFees;
  
  // Apply contract discount
  const selectedTerm = config.contractTerms?.find(term => term.id === contractTermId);
  const discount = selectedTerm?.discount || 0;
  const discountedSubtotal = subtotalMonthly * (1 - discount);
  
  const taxMonthly = config.tax.enabled ? discountedSubtotal * config.tax.rate : 0;
  
  // Setup fee: NOT applied if package has one-time payment, waived for contracts of 3+ months, only applies to 1-month contracts
  const setupFee = !packageOneTime && config.setupFee.enabled && contractTermId === "1month" ? config.setupFee.amount : 0;
  
  const totalMonthly = discountedSubtotal + taxMonthly;
  const totalToday = config.collectFirstMonthToday 
    ? setupFee + totalMonthly + oneTimeFees
    : setupFee + oneTimeFees;

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
    contractTerm: selectedTerm,
  };
}

export function formatCurrency(amount: number, currency: string = "USD", locale: string = "es-PR"): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
