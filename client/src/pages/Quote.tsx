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
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [monthlyAdSpend, setMonthlyAdSpend] = useState<number | undefined>(undefined);
  const [selectedTerm, setSelectedTerm] = useState<string>("1month");

  const { data: pricing, isLoading } = useQuery({
    queryKey: ["/api/pricing"],
  });

  // For bundle support: pass all packages or first package for backward compatibility
  const packageIdsArray = Array.from(selectedPackages);
  const primaryPackage = packageIdsArray.length > 0 ? packageIdsArray[0] : "";
  
  const totals = pricing && (selectedPackages.size > 0 || selectedAddons.size > 0)
    ? calculateTotalsClient(packageIdsArray.length > 1 ? packageIdsArray : primaryPackage, Array.from(selectedAddons), pricing, selectedTerm)
    : null;

  // Effect to clean up incompatible selections when addons change
  useEffect(() => {
    if (!pricing) return;
    
    const selectedPkgs = Array.from(selectedPackages).map(id => 
      (pricing as any).packages?.find((p: Package) => p.id === id)
    ).filter(Boolean);
    const addons = (pricing as any).addons || [];
    let hasIncompatibleAddons = false;
    const cleanedAddons = new Set(selectedAddons);
    
    addons.forEach((addon: Addon) => {
      // Remove addons that require a plan when no package is selected
      if (addon.requiresPlan && selectedPackages.size === 0 && cleanedAddons.has(addon.id)) {
        cleanedAddons.delete(addon.id);
        hasIncompatibleAddons = true;
      }
      
      // Remove addons that require non-AI plans when any package has AI
      const hasAIPackage = selectedPkgs.some(pkg => pkg?.hasAI);
      if (hasAIPackage && addon.requiresNonAI && cleanedAddons.has(addon.id)) {
        cleanedAddons.delete(addon.id);
        hasIncompatibleAddons = true;
      }
    });
    
    if (hasIncompatibleAddons) {
      setSelectedAddons(cleanedAddons);
    }
  }, [selectedPackages, selectedAddons, pricing]);

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
    
    // Check if new package has AI and clean up incompatible addons
    if (clickedPackage?.hasAI) {
      const newAddons = new Set(selectedAddons);
      const addons = (pricing as any)?.addons || [];
      
      addons.forEach((addon: Addon) => {
        if (addon.requiresNonAI && newAddons.has(addon.id)) {
          newAddons.delete(addon.id);
        }
      });
      
      setSelectedAddons(newAddons);
    }
  };

  const handleContinue = () => {
    // Allow continue if at least one package is selected
    if (selectedPackages.size === 0) return;
    
    // Store selection in sessionStorage for next page
    sessionStorage.setItem("quote", JSON.stringify({
      packageId: primaryPackage || null,
      packageIds: Array.from(selectedPackages),
      addonIds: Array.from(selectedAddons),
      monthlyAdSpend,
      contractTerm: selectedTerm,
    }));
    
    setLocation("/datos");
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

            {/* Add-ons Section */}
            <div className="mb-6 lg:mb-8">
              <h3 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4" data-testid="title-addons">{t('quote.addons.title')}</h3>
              <p className="text-muted-foreground mb-4 lg:mb-6">{t('quote.addons.subtitle')}</p>
              
              <div className="space-y-3 lg:space-y-4">
                {pricing && (pricing as any).addons ? (pricing as any).addons.map((addon: Addon) => {
                  // Check if any selected package has AI
                  const selectedPkgs = Array.from(selectedPackages).map(id => 
                    (pricing as any).packages?.find((p: Package) => p.id === id)
                  ).filter(Boolean);
                  const packageHasAI = selectedPkgs.some(pkg => pkg?.hasAI);
                  
                  // Check addon availability
                  const canSelect = (!addon.requiresNonAI || !packageHasAI) && (!addon.requiresPlan || selectedPackages.size > 0);
                  
                  return (
                    <AddonItem
                      key={addon.id}
                      addon={addon}
                      selected={selectedAddons.has(addon.id)}
                      canSelect={canSelect}
                      onToggle={(checked) => {
                        if (!canSelect) return; // Don't allow toggle if disabled
                        
                        const newAddons = new Set(selectedAddons);
                        if (checked) {
                          newAddons.add(addon.id);
                        } else {
                          newAddons.delete(addon.id);
                        }
                        setSelectedAddons(newAddons);
                      }}
                    />
                  );
                }) : []}
              </div>
            </div>

            {/* Contract Terms - Disabled if one-time payment plan selected */}
            {(() => {
              const selectedPkgs = Array.from(selectedPackages).map(id => 
                (pricing as any)?.packages?.find((p: Package) => p.id === id)
              ).filter(Boolean);
              const isOneTimePackage = selectedPkgs.some(pkg => pkg?.oneTime);
              
              return (
                <div className={`mb-6 lg:mb-8 bg-muted rounded-lg p-4 lg:p-6 ${isOneTimePackage ? 'opacity-50' : ''}`}>
                  <h3 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4" data-testid="title-contract-terms">{t('quote.contract.title')}</h3>
                  <p className="text-muted-foreground mb-4 lg:mb-6 text-sm lg:text-base">{t('quote.contract.subtitle')}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {pricing && (pricing as any).contractTerms ? (pricing as any).contractTerms.map((term: any) => (
                      <div 
                        key={term.id}
                        className={`border-2 rounded-lg p-3 lg:p-4 transition-all ${
                          isOneTimePackage 
                            ? 'border-muted cursor-not-allowed' 
                            : selectedTerm === term.id 
                              ? 'border-primary bg-primary/5 cursor-pointer' 
                              : 'border-border hover:border-primary/50 cursor-pointer'
                        }`}
                        onClick={() => !isOneTimePackage && setSelectedTerm(term.id)}
                        data-testid={`term-${term.id}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-sm lg:text-base">{t(`contract.term.${term.id}`) || term.name}</h4>
                            <p className="text-xs lg:text-sm text-muted-foreground">{t(`contract.label.${term.id}`) || term.label}</p>
                          </div>
                          {term.discount > 0 && (
                            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              -{Math.round(term.discount * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    )) : []}
                  </div>
                </div>
              );
            })()}

            {/* Monthly Ad Spend */}
            <div className="mb-6 lg:mb-8 bg-muted rounded-lg p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4" data-testid="title-adspend">{t('quote.adspend.title')}</h3>
              <p className="text-muted-foreground mb-3 lg:mb-4 text-sm lg:text-base">{t('quote.adspend.subtitle')}</p>
              
              <div className="w-full max-w-sm">
                <Label htmlFor="monthlyAdSpend" className="text-sm">{t('quote.adspend.label')}</Label>
                <Input 
                  id="monthlyAdSpend"
                  type="number"
                  placeholder={t('quote.adspend.placeholder')} 
                  value={monthlyAdSpend || ""}
                  onChange={(e) => setMonthlyAdSpend(e.target.value ? Number(e.target.value) : undefined)}
                  data-testid="input-monthly-adspend"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  {t('quote.adspend.help')}
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
                selectedAddons={pricing && (pricing as any).addons ? Array.from(selectedAddons).map(id => (pricing as any).addons?.find((a: Addon) => a.id === id)).filter(Boolean) : []}
                totals={totals}
                pricing={pricing}
                monthlyAdSpend={monthlyAdSpend}
                contractTerm={selectedTerm}
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
