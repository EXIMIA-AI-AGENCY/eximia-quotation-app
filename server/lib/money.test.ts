import { calculateTotals } from "./money";

// Mock pricing config
const mockConfig = {
  currency: "USD",
  collectFirstMonthToday: true,
  tax: { enabled: true, rate: 0.115 },
  setupFee: { enabled: true, amount: 199 },
};

const packages = {
  starter: { id: "starter", name: "Starter", monthly: 197 },
  pro: { id: "pro", name: "Pro", monthly: 497 },
  enterprise: { id: "enterprise", name: "Enterprise", monthly: 997 },
};

const addons = {
  whatsapp: { id: "whatsapp", name: "WhatsApp Business API", monthly: 49 },
  ai_voice: { id: "ai_voice", name: "Agente de Voz IA", monthly: 149 },
  leads: { id: "leads", name: "Gestión de Anuncios + Leads", monthly: 299 },
};

// Test cases
console.log("Testing money calculations...\n");

// Test 1: Starter without add-ons
const test1 = calculateTotals(packages.starter, [], mockConfig);
console.log("Test 1 - Starter sin add-ons:");
console.log(`  Subtotal mensual: $${test1.subtotalMonthly}`);
console.log(`  IVU: $${test1.taxMonthly}`);
console.log(`  Setup fee: $${test1.setupFee}`);
console.log(`  Total hoy: $${test1.totalToday}`);
console.log(`  Total mensual: $${test1.totalMonthly}\n`);

// Test 2: Pro + WhatsApp add-on
const test2 = calculateTotals(packages.pro, [addons.whatsapp], mockConfig);
console.log("Test 2 - Pro + WhatsApp:");
console.log(`  Subtotal mensual: $${test2.subtotalMonthly}`);
console.log(`  IVU: $${test2.taxMonthly}`);
console.log(`  Setup fee: $${test2.setupFee}`);
console.log(`  Total hoy: $${test2.totalToday}`);
console.log(`  Total mensual: $${test2.totalMonthly}\n`);

// Test 3: Enterprise + all add-ons
const test3 = calculateTotals(packages.enterprise, Object.values(addons), mockConfig);
console.log("Test 3 - Enterprise + todos los add-ons:");
console.log(`  Subtotal mensual: $${test3.subtotalMonthly}`);
console.log(`  IVU: $${test3.taxMonthly}`);
console.log(`  Setup fee: $${test3.setupFee}`);
console.log(`  Total hoy: $${test3.totalToday}`);
console.log(`  Total mensual: $${test3.totalMonthly}\n`);

// Test 4: IVU disabled
const configNoTax = { ...mockConfig, tax: { enabled: false, rate: 0 } };
const test4 = calculateTotals(packages.pro, [], configNoTax);
console.log("Test 4 - Pro sin IVU:");
console.log(`  Total hoy: $${test4.totalToday}`);
console.log(`  Total mensual: $${test4.totalMonthly}\n`);

// Test 5: Setup fee disabled
const configNoSetup = { ...mockConfig, setupFee: { enabled: false, amount: 0 } };
const test5 = calculateTotals(packages.pro, [], configNoSetup);
console.log("Test 5 - Pro sin setup fee:");
console.log(`  Total hoy: $${test5.totalToday}`);
console.log(`  Total mensual: $${test5.totalMonthly}\n`);

// Test 6: No first month collection
const configNoFirstMonth = { ...mockConfig, collectFirstMonthToday: false };
const test6 = calculateTotals(packages.pro, [], configNoFirstMonth);
console.log("Test 6 - Pro sin cobrar primer mes hoy:");
console.log(`  Total hoy: $${test6.totalToday}`);
console.log(`  Total mensual: $${test6.totalMonthly}\n`);

console.log("All tests completed!");
