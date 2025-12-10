import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/pricing";

export default function Confirmation() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [quoteId, setQuoteId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const sessionId = params.get("session_id");
    const storedQuoteId = sessionStorage.getItem("quoteId");
    
    if (storedQuoteId) {
      setQuoteId(storedQuoteId);
    } else if (sessionId) {
      // Handle GHL success redirect
      console.log("GHL invoice completed:", sessionId);
    }
  }, [location]);

  const { data: quote } = useQuery({
    queryKey: ["/api/quotes", quoteId],
    enabled: !!quoteId,
  });

  const generateOrderId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    return `EXIMIA-${year}-${randomNum.toString().padStart(6, '0')}`;
  };

  const getNextPaymentDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    const locale = t('common.locale') === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fade-in">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8" data-testid="progress-bar">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('confirmation.progress')}</span>
            <span className="text-sm font-medium text-muted-foreground">{t('confirmation.progress.label')}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-green-500 text-3xl"></i>
          </div>
          
          <h2 className="text-3xl font-bold mb-4" data-testid="title-confirmation">{t('confirmation.title')}</h2>
          <p className="text-lg text-muted-foreground mb-8" data-testid="text-confirmation-subtitle">
            {t('confirmation.subtitle')}
          </p>

          {/* Order Details */}
          <div className="bg-muted rounded-lg p-6 mb-8 text-left" data-testid="order-details">
            <h3 className="font-semibold mb-4 text-center">{t('confirmation.order.title')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('confirmation.order.id')}</span>
                <span className="font-mono text-sm" data-testid="text-order-id">{generateOrderId()}</span>
              </div>
              {quote && (quote as any).totals && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('confirmation.order.plan')}</span>
                    <span data-testid="text-order-package">{(quote as any)?.packageId || t('confirmation.order.unspecified')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('confirmation.order.addons')}</span>
                    <span data-testid="text-order-addons">
                      {(quote as any).addonIds && (quote as any).addonIds.length > 0 ? (quote as any).addonIds.join(", ") : t('confirmation.order.addons.none')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('confirmation.order.total')}</span>
                    <span className="font-semibold text-primary" data-testid="text-order-total">
                      {(quote as any).totals ? formatCurrency((quote as any).totals.totalToday) : '$0.00'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('confirmation.order.next')}</span>
                <span data-testid="text-next-payment">{getNextPaymentDate()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8" data-testid="next-steps">
            <h3 className="font-semibold mb-3">{t('confirmation.steps.title')}</h3>
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center space-x-2">
                <i className="fas fa-envelope text-primary text-xs"></i>
                <span>{t('confirmation.steps.email')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-credit-card text-primary text-xs"></i>
                <span>{t('confirmation.steps.payment')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-cog text-primary text-xs"></i>
                <span>{t('confirmation.steps.setup')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => window.open("mailto:soporte@eximia.com", "_blank")}
              className="w-full"
              data-testid="button-contact-support"
            >
              <i className="fas fa-headset mr-2"></i>
              {t('confirmation.support.button')}
            </Button>
            <Link href="/">
              <Button variant="secondary" className="w-full" data-testid="button-back-home">
                {t('confirmation.home.button')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
