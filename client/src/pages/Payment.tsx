import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateTotalsClient } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

export default function Payment() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [estimateId, setEstimateId] = useState<string | null>(null);

  // Fetch pricing configuration
  const { data: pricing } = useQuery({
    queryKey: ["/api/pricing"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const savedQuote = sessionStorage.getItem("quote");
    const savedContact = sessionStorage.getItem("contact");
    const savedEstimateId = sessionStorage.getItem("invoiceId"); // keeping same key for compatibility
    
    if (!savedQuote || !savedContact) {
      toast({
        title: t('error.data.incomplete'),
        description: t('error.data.incomplete.desc'),
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    const parsedQuote = JSON.parse(savedQuote);
    const parsedContact = JSON.parse(savedContact);
    
    setQuoteData(parsedQuote);
    setContactData(parsedContact);
    setEstimateId(savedEstimateId);
  }, [setLocation, toast]);

  // No more navigation needed - this is the final step

  if (!quoteData || !contactData || !pricing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Calculate totals
  const totals = calculateTotalsClient(
    quoteData.packageId,
    quoteData.addonIds,
    pricing,
    quoteData.contractTerm
  );

  if (!totals) {
    return <div>{t('error.calculating.totals')}</div>;
  }

  // Find selected package and addons with proper type checking
  const selectedPackageObj = pricing && (pricing as any).packages ? (pricing as any).packages.find((p: any) => p.id === quoteData.packageId) : null;
  const selectedAddonsObj = pricing && (pricing as any).addons ? (pricing as any).addons.filter((addon: any) => quoteData.addonIds.includes(addon.id)) : [];
  const contractTerm = pricing && (pricing as any).contractTerms ? (pricing as any).contractTerms.find((term: any) => term.id === quoteData.contractTerm) : null || 
                     { id: "1month", months: 1, name: "1 mes" };

  return (
    <div className="fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Progress Bar */}
        <div className="mb-6 lg:mb-8" data-testid="progress-bar">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('payment.progress')}</span>
            <span className="text-sm font-medium text-muted-foreground">{t('payment.progress.label')}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 lg:mb-8">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-check-circle text-green-600 text-xl sm:text-2xl"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="title-estimate-sent">{t('payment.success.title')}</h2>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-3">{t('payment.contact.title')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.contact.name')}</span>
                <span data-testid="text-contact-name" className="font-medium">{contactData.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.contact.email')}</span>
                <span data-testid="text-contact-email" className="font-medium break-all">{contactData.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.contact.phone')}</span>
                <span data-testid="text-contact-phone" className="font-medium">{contactData.phone}</span>
              </div>
              {contactData.company && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-muted-foreground">{t('payment.contact.company')}</span>
                  <span data-testid="text-contact-company" className="font-medium">{contactData.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Package Information */}
          <div className="mb-4 sm:mb-6">
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-3">{t('payment.package.title')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.package.name')}</span>
                <span data-testid="text-selected-package" className="font-medium">{selectedPackageObj?.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.package.term')}</span>
                <span data-testid="text-contract-term" className="font-medium">{contractTerm.label}</span>
              </div>
              {contractTerm.discount > 0 && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-muted-foreground">{t('payment.package.discount')}</span>
                  <span data-testid="text-contract-discount" className="font-medium text-green-600">
                    -{(contractTerm.discount * 100).toFixed(0)}% ({formatCurrency(totals.discountAmount || 0)})
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">{t('payment.package.price')}</span>
                <span data-testid="text-package-price" className="font-medium">{formatCurrency(selectedPackageObj?.monthly)}</span>
              </div>
            </div>
          </div>

          {/* Add-ons Information */}
          {selectedAddonsObj && selectedAddonsObj.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-3">{t('payment.addons.title')}</h4>
              <div className="space-y-2 text-sm">
                {selectedAddonsObj.map((addon: any, index: number) => (
                  <div key={addon.id} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">{addon.name}:</span>
                    <span data-testid={`text-addon-price-${index}`} className="font-medium">{formatCurrency(addon.monthly)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-3">{t('payment.breakdown.title')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span>{t('payment.breakdown.subtotal')}</span>
                <span data-testid="text-subtotal" className="font-medium">{formatCurrency(totals.subtotalMonthly)}</span>
              </div>
              {contractTerm.discount > 0 && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-green-600">{t('payment.breakdown.discount')} ({(contractTerm.discount * 100).toFixed(0)}%):</span>
                  <span data-testid="text-discount-amount" className="font-medium text-green-600">-{formatCurrency(totals.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-border pt-2 mt-2 font-bold text-base">
                <span>{t('payment.breakdown.total')}</span>
                <span data-testid="text-total-monthly" className="text-primary">{formatCurrency(totals.totalMonthly)}</span>
              </div>
              {contactData.monthlyAdSpend && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span>{t('payment.adspend.label')}</span>
                    <span data-testid="text-ad-spend" className="font-medium">{formatCurrency(contactData.monthlyAdSpend)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    {t('payment.adspend.info')}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                <i className="fas fa-file-invoice text-blue-600 text-xl sm:text-2xl mb-2"></i>
                <h5 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">{t('payment.quote.completed')}</h5>
                <p className="text-xs sm:text-sm text-blue-700">
                  {t('payment.expert.contact')}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4 sm:mb-6 text-center">
            <i className="fas fa-shield-alt mr-1"></i>
            {t('payment.security')}
          </p>

          {/* Actions */}
          <div className="flex justify-center">
            <Button 
              onClick={() => window.location.href = "https://www.eximia.agency/cita"} 
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary hover:bg-primary/90"
              data-testid="button-schedule-appointment"
            >
              <i className="fas fa-calendar-plus mr-2"></i>
              {t('payment.schedule.button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}