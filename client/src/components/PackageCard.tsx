import { useLanguage } from "@/contexts/LanguageContext";

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

interface PackageCardProps {
  package: Package;
  selected: boolean;
  onSelect: () => void;
}

export default function PackageCard({ package: pkg, selected, onSelect }: PackageCardProps) {
  const { t } = useLanguage();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div 
      className={`bg-card rounded-xl p-4 sm:p-6 cursor-pointer transition-all card-glow relative ${
        selected ? 'border-2 border-primary' : 'border border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
      data-testid={`package-card-${pkg.id}`}
    >
      {pkg.popular && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
{t('package.popular')}
          </span>
        </div>
      )}
      
      {pkg.canBundleWith && pkg.canBundleWith.length > 0 && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full" title={t('package.bundle.available')}>
            <i className="fas fa-layer-group text-green-600 dark:text-green-400 text-xs"></i>
          </span>
        </div>
      )}
      
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center justify-center gap-2" data-testid={`text-package-name-${pkg.id}`}>
          {t(`package.${pkg.id}.name`) || pkg.name}
          {pkg.hasAI && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full" title={t('common.ai.tooltip')}>
              <i className="fas fa-robot text-blue-600 dark:text-blue-400 text-sm"></i>
            </span>
          )}
        </h3>
        <div className="text-2xl sm:text-3xl font-bold mb-2" data-testid={`text-package-price-${pkg.id}`}>
          {pkg.oneTime && pkg.monthly ? (
            <>
              <div>{formatPrice(pkg.oneTime)} <span className="text-sm sm:text-base font-normal text-muted-foreground">{t('common.one.time')}</span></div>
              <div className="text-lg sm:text-xl">+ {formatPrice(pkg.monthly)} <span className="text-sm font-normal text-muted-foreground">{t('common.per.month')}</span></div>
            </>
          ) : pkg.oneTime ? (
            <>
              {formatPrice(pkg.oneTime)}
              <span className="text-sm sm:text-base font-normal text-muted-foreground"> {t('common.one.time')}</span>
            </>
          ) : (
            <>
              {formatPrice(pkg.monthly || 0)}
              <span className="text-sm sm:text-base font-normal text-muted-foreground">{t('common.per.month')}</span>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm" data-testid={`text-package-description-${pkg.id}`}>
          {t(`package.${pkg.id}.desc`) || pkg.desc}
        </p>
      </div>
      
      <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {pkg.features.map((feature, index) => (
          <li key={index} className="flex items-start text-xs sm:text-sm" data-testid={`text-package-feature-${pkg.id}-${index}`}>
            <i className="fas fa-check text-primary mr-2 mt-0.5 flex-shrink-0"></i>
            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: t(`package.${pkg.id}.feature.${index}`) || feature }}></span>
          </li>
        ))}
      </ul>
      
      <div className="flex justify-center">
        <div 
          className={`w-4 h-4 rounded-full border-2 ${
            selected 
              ? 'bg-primary border-primary' 
              : 'border-muted'
          }`}
          data-testid={`radio-package-${pkg.id}`}
        />
      </div>
    </div>
  );
}
