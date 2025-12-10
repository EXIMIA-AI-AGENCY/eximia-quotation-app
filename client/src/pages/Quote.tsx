import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import PackageCard from "@/components/PackageCard";
import AddonItem from "@/components/AddonItem";
import Summary from "@/components/Summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateTotalsClient } from "@/lib/pricing";
import { Slider } from "@/components/ui/slider";

interface Package {
  id: string;
  name: string;
  monthly?: number;
  oneTime?: number;
  desc: string;
  features: string[];
  popular?: boolean;
  hasAI?: boolean;
  canBundleWith?: string[];
}

interface Addon {
  id: string;
  name: string;
  monthly?: number;
  oneTime?: number;
  desc: string;
  icon: string;
  iconColor: string;
  disabled?: boolean;
  requiresNonAI?: boolean;
  requiresPlan?: boolean;
}

export default function Quote() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());

  const [usageEstimate, setUsageEstimate] = useState({
    sms: 0,
    mms: 0,
    callMinutes: 0,
    aiWords: 0,
  });


  const { data: pricing, isLoading } = useQuery({
    queryKey: ["/api/pricing"],
  });

  // For bundle support: pass all packages or first package for backward compatibility
  const packageIdsArray = Array.from(selectedPackages);
  const primaryPackage = packageIdsArray.length > 0 ? packageIdsArray[0] : "";

  const totals = pricing && selectedPackages.size > 0
    ? calculateTotalsClient(packageIdsArray.length > 1 ? packageIdsArray : primaryPackage, [], pricing, "1month")
    : null;


  const handlePackageSelect = (packageId: string) => {
    const newPackages = new Set(selectedPackages);

    // If clicking the same package that's already selected, deselect it
    if (newPackages.has(packageId)) {
      newPackages.delete(packageId);
      setSelectedPackages(newPackages);
      return;
    }

    // Get the package being clicked
    const clickedPackage = (pricing as any)?.packages?.find((p: Package) => p.id === packageId);

    // Check if we can bundle this with existing selections
    const canBundle = Array.from(newPackages).every(existingId => {
      const existingPackage = (pricing as any)?.packages?.find((p: Package) => p.id === existingId);
      return (
        (clickedPackage?.canBundleWith?.includes(existingId)) ||
        (existingPackage?.canBundleWith?.includes(packageId))
      );
    });

    if (canBundle || newPackages.size === 0) {
      // Can add this package
      newPackages.add(packageId);
    } else {
      // Cannot bundle, replace selection
      newPackages.clear();
      newPackages.add(packageId);
    }

    setSelectedPackages(newPackages);


  };


  const handleContinue = () => {
    // Allow continue if at least one package is selected
    if (selectedPackages.size === 0) return;

    // Get the primary package (first selected or the one that's not bundlable)
    const selectedPackageId = primaryPackage || Array.from(selectedPackages)[0];

    // Find the selected package and get its payment link
    const pkg = (pricing as any)?.packages?.find((p: Package) => p.id === selectedPackageId);

    if (pkg?.paymentLink) {
      // Redirect to payment link
      window.location.href = pkg.paymentLink;
    } else {
      // Fallback: show alert if no payment link configured
      alert('Link de pago no configurado para este plan. Contacta soporte.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Progress Bar */}
        <div className="mb-6 lg:mb-8" data-testid="progress-bar">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('quote.progress')}</span>
            <span className="text-sm font-medium text-muted-foreground">{t('quote.progress.label')}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "25%" }}></div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2" data-testid="title-package-selection">{t('quote.title')}</h2>
            <p className="text-muted-foreground mb-6 lg:mb-8">{t('quote.subtitle')}</p>

            {/* Package Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
              {pricing && (pricing as any).packages ? (pricing as any).packages.map((pkg: Package) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  selected={selectedPackages.has(pkg.id)}
                  onSelect={() => handlePackageSelect(pkg.id)}
                />
              )) : []}
            </div>





            {/* Usage Costs Section */}
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-dollar-sign text-primary text-xl"></i>
                <h3 className="text-xl lg:text-2xl font-bold">Costos de Uso</h3>
              </div>
              <p className="text-muted-foreground mb-5 text-sm lg:text-base">
                Precios estándar por uso - Solo pagas lo que usas
              </p>

              {/* Pricing Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-4 font-semibold text-sm">Servicio</th>
                        <th className="text-right p-4 font-semibold text-sm">Costo por uso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* SMS */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-comment text-white text-xs"></i>
                            </div>
                            <span className="font-medium">SMS</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.05</td>
                      </tr>

                      {/* MMS */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-image text-white text-xs"></i>
                            </div>
                            <span className="font-medium">MMS</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.06</td>
                      </tr>

                      {/* Llamadas */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-phone text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Llamadas</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.04 / min</td>
                      </tr>

                      {/* Content AI */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-brain text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Content AI</span>
                            <span className="text-xs text-muted-foreground ml-2">(por 1,000 palabras)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.27</td>
                      </tr>

                      {/* Workflow AI GPT-4 */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-robot text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Workflow AI (GPT-4)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.09 / ejecución</td>
                      </tr>

                      {/* Workflow AI GPT-3.5 */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-cogs text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Workflow AI (GPT-3.5)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.045 / ejecución</td>
                      </tr>

                      {/* Conversation AI */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-comments text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Conversation AI</span>
                            <span className="text-xs text-muted-foreground ml-2">(Piloto automático)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.06 / mensaje</td>
                      </tr>

                      {/* Reviews AI */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-star text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Reviews AI</span>
                            <span className="text-xs text-muted-foreground ml-2">(Respuestas auto)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$0.24 / respuesta</td>
                      </tr>

                      {/* Emails */}
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-envelope text-white text-xs"></i>
                            </div>
                            <span className="font-medium">Emails</span>
                            <span className="text-xs text-muted-foreground ml-2">(por cada 1,000)</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-primary">$2.03 / 1k</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <i className="fas fa-info-circle text-primary"></i>
                  <span>Los costos de uso se aplican a todos los planes y se facturan mensualmente según tu consumo real</span>
                </p>
              </div>
            </div>

          </div>

          {/* Summary Sidebar - Mobile Last, Sticky on Desktop */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <Summary
                selectedPackage={primaryPackage && (pricing as any)?.packages ? (pricing as any).packages.find((p: Package) => p.id === primaryPackage) : null}
                selectedPackages={Array.from(selectedPackages).map(id => (pricing as any)?.packages?.find((p: Package) => p.id === id)).filter(Boolean)}
                selectedAddons={[]}
                totals={totals}
                pricing={pricing}
                usageEstimate={usageEstimate}
                contractTerm="1month"
                onContinue={handleContinue}
                onBack={() => setLocation("/")}
                canContinue={selectedPackages.size > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
