import { formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface SummaryProps {
  selectedPackage: any;
  selectedPackages?: any[];
  selectedAddons: any[];
  totals: any;
  pricing: any;
  monthlyAdSpend?: number;
  contractTerm?: string;
  onContinue?: () => void;
  onBack?: () => void;
  canContinue?: boolean;
}

export default function Summary({ selectedPackage, selectedPackages, selectedAddons, totals, pricing, monthlyAdSpend, contractTerm, onContinue, onBack, canContinue }: SummaryProps) {
  const { t } = useLanguage();
  
  const packagesDisplay = selectedPackages && selectedPackages.length > 0 ? selectedPackages : (selectedPackage ? [selectedPackage] : []);
  
  return (
    <div className="bg-card border border-border rounded-xl p-6" data-testid="pricing-summary">
      <h3 className="text-lg font-semibold mb-4">{t('summary.title')}</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{packagesDisplay.length > 1 ? t('summary.packages') : t('summary.package')}</span>
          <span data-testid="text-selected-package" className="text-right">
            {packagesDisplay.length > 0 ? (
              packagesDisplay.length > 1 ? (
                <div className="flex flex-col items-end gap-1">
                  {packagesDisplay.map((pkg: any) => (
                    <div key={pkg.id}>{pkg.name}</div>
                  ))}
                  <span className="text-xs text-primary font-semibold">{t('summary.bundle')}</span>
                </div>
              ) : (
                packagesDisplay[0].name
              )
            ) : (
              selectedAddons.some(addon => addon?.id === 'ai_integration') ? t('common.ai.only') : t('common.no.selected')
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('summary.addons')}</span>
          <span data-testid="text-selected-addons-count">
            {selectedAddons.filter(Boolean).length}
          </span>
        </div>
        {contractTerm && totals?.contractTerm && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('summary.contract')}</span>
            <span data-testid="text-contract-term">
              {totals.contractTerm.name}
              {totals.discountPercentage > 0 && (
                <span className="text-green-600 ml-2">(-{totals.discountPercentage}%)</span>
              )}
            </span>
          </div>
        )}
        {monthlyAdSpend && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('summary.adspend')}</span>
            <span data-testid="text-monthly-adspend">
              {formatCurrency(monthlyAdSpend)}{t('common.per.month')}
            </span>
          </div>
        )}
      </div>

      {totals && (
        <>
          <div className="border-t border-border pt-4 space-y-2">
            {totals.subtotalMonthly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('summary.subtotal')}</span>
                <span data-testid="text-subtotal-monthly">{formatCurrency(totals.subtotalMonthly)}</span>
              </div>
            )}
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('summary.discount')} ({totals.discountPercentage}%):</span>
                <span className="text-green-600" data-testid="text-discount">
                  -{formatCurrency(totals.discount)}
                </span>
              </div>
            )}
            {totals.discountedSubtotal !== totals.subtotalMonthly && (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">{t('summary.subtotal.discounted')}</span>
                <span data-testid="text-discounted-subtotal">{formatCurrency(totals.discountedSubtotal)}</span>
              </div>
            )}
            {totals.oneTimeFees > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('summary.onetime.fees')}</span>
                <span className="text-orange-600" data-testid="text-onetime-fees">
                  {formatCurrency(totals.oneTimeFees)}
                </span>
              </div>
            )}
            
            {/* Setup Fee Display */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('summary.setup.fee')}
                {contractTerm !== "1month" && (
                  <span className="text-green-600 ml-1">{t('summary.setup.free.short')}</span>
                )}
              </span>
              <span data-testid="text-setup-fee" className={totals.setupFee === 0 ? "text-green-600 line-through" : ""}>
                {totals.setupFee === 0 ? (
                  <>
                    <span className="line-through text-muted-foreground">$99.00</span>
                    <span className="ml-2 text-green-600">$0.00</span>
                  </>
                ) : (
                  formatCurrency(totals.setupFee)
                )}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between font-semibold text-lg mb-2">
              <span>{t('summary.total.today')}</span>
              <span className="text-primary" data-testid="text-total-today">
                {formatCurrency(totals.totalToday)}
              </span>
            </div>
            {totals.totalMonthly > 0 && (
              <div className="flex justify-between font-semibold mb-2">
                <span>{t('summary.total.monthly.services')}</span>
                <span data-testid="text-total-monthly">
                  {formatCurrency(totals.totalMonthly)}
                </span>
              </div>
            )}
            {monthlyAdSpend && (
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                <span>{t('summary.total.monthly.global')}</span>
                <span className="text-primary" data-testid="text-total-monthly-global">
                  {formatCurrency(totals.totalMonthly + monthlyAdSpend)}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-6 space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <i className="fas fa-info-circle mr-1"></i>
            {t('summary.taxes.note')}
          </p>
        </div>
        
        {contractTerm === "1month" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <i className="fas fa-star mr-1"></i>
              {t('summary.save.tip')}
            </p>
          </div>
        )}
        
        {contractTerm !== "1month" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              <i className="fas fa-check-circle mr-1"></i>
              {t('summary.setup.free')} {contractTerm === "3months" ? t('summary.contract.3months') : contractTerm === "6months" ? t('summary.contract.6months') : t('summary.contract.12months')} {t('summary.setup.included')}.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {onContinue && onBack && (
        <div className="mt-8 space-y-4">
          <Button 
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full py-3 font-medium text-base"
            data-testid="button-continue-quote"
          >
            <i className="fas fa-arrow-right mr-2"></i>
            {t('common.continue')}
          </Button>
          
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="w-full py-3 font-medium text-base" data-testid="button-back-home">
                <i className="fas fa-arrow-left mr-2"></i>
                {t('common.back')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
