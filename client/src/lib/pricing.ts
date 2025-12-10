export function calculateTotalsClient(packageId: string | string[], addonIds: string[], pricing: any, contractTerm: string = "1month") {
  // Support both single packageId and array of packageIds (for bundles)
  const packageIds = Array.isArray(packageId) ? packageId : (packageId ? [packageId] : []);
  const selectedPackages = packageIds.map(id => pricing.packages.find((p: any) => p.id === id)).filter(Boolean);
  
  // Allow calculation with only addons (no package) if there are addons selected
  if (selectedPackages.length === 0 && addonIds.length === 0) return null;

  const selectedAddons = pricing.addons.filter((addon: any) => addonIds.includes(addon.id));
  const selectedContractTerm = pricing.contractTerms?.find((term: any) => term.id === contractTerm);
  
  // Calculate monthly subtotal from all packages and addons
  const packagesMonthly = selectedPackages.reduce((sum: number, pkg: any) => sum + (pkg?.monthly || 0), 0);
  let subtotalMonthly = packagesMonthly + 
    selectedAddons.reduce((sum: number, addon: any) => sum + (addon.monthly || 0), 0);
  
  // Calculate one-time fees from all packages and addons
  const packagesOneTime = selectedPackages.reduce((sum: number, pkg: any) => sum + (pkg?.oneTime || 0), 0);
  const addonOneTimeFees = selectedAddons.reduce((sum: number, addon: any) => sum + (addon.oneTime || 0), 0);
  const oneTimeFees = packagesOneTime + addonOneTimeFees;
  
  // Apply contract discount (only for monthly packages, not one-time payment packages)
  const discount = selectedContractTerm?.discount || 0;
  const discountedSubtotal = subtotalMonthly * (1 - discount);
  
  const taxMonthly = pricing.tax.enabled ? discountedSubtotal * pricing.tax.rate : 0;
  
  // Setup fee: NOT applied if any package has one-time payment, waived for contracts of 3+ months, only applies to 1-month contracts
  const hasOneTimePackage = packagesOneTime > 0;
  const setupFee = !hasOneTimePackage && pricing.setupFee.enabled && contractTerm === "1month" ? pricing.setupFee.amount : 0;
  
  const totalMonthly = discountedSubtotal + taxMonthly;
  const totalToday = pricing.collectFirstMonthToday 
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
    contractTerm: selectedContractTerm,
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
