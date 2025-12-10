import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface AddonItemProps {
  addon: Addon;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  canSelect?: boolean;
}

export default function AddonItem({ addon, selected, onToggle, canSelect = true }: AddonItemProps) {
  const { t } = useLanguage();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Handle disabled addons (announcements)
  if (addon.disabled || !canSelect) {
    return (
      <div 
        className={`bg-card border-2 rounded-xl p-4 sm:p-5 ${
          addon.disabled ? 'border-dashed border-muted opacity-70' : 'border-muted opacity-50'
        }`}
        data-testid={`addon-${addon.disabled ? 'announcement' : 'disabled'}-${addon.id}`}
      >
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`w-10 sm:w-12 h-10 sm:h-12 bg-${addon.iconColor}/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <i className={`${addon.icon} text-${addon.iconColor} text-base sm:text-lg`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base sm:text-lg leading-tight text-muted-foreground" data-testid={`text-announcement-name-${addon.id}`}>
                {t(`addon.${addon.id}.name`) || addon.name}
              </h4>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed" data-testid={`text-announcement-description-${addon.id}`}>
                {addon.disabled ? (t(`addon.${addon.id}.desc`) || addon.desc) : addon.requiresNonAI ? t('addon.non.ai.only') : addon.requiresPlan ? t('addon.requires.plan') : (t(`addon.${addon.id}.desc`) || addon.desc)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-card border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-200 touch-manipulation select-none ${
        selected 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
          : 'border-border hover:border-primary/50 hover:bg-primary/2 active:bg-primary/5'
      }`}
      onClick={() => onToggle(!selected)}
      data-testid={`addon-item-${addon.id}`}
    >
      <div className="flex items-start sm:items-center gap-4 sm:gap-5">
        <div className="flex-shrink-0 pt-1 sm:pt-0">
          <Checkbox 
            checked={selected}
            onCheckedChange={onToggle}
            data-testid={`checkbox-addon-${addon.id}`}
            className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none"
          />
        </div>
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`w-10 sm:w-12 h-10 sm:h-12 bg-${addon.iconColor}/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
            <i className={`${addon.icon} text-${addon.iconColor} text-base sm:text-lg`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base sm:text-lg leading-tight" data-testid={`text-addon-name-${addon.id}`}>
              {t(`addon.${addon.id}.name`) || addon.name}
            </h4>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed" data-testid={`text-addon-description-${addon.id}`}>
              {t(`addon.${addon.id}.desc`) || addon.desc}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="font-bold text-base sm:text-lg text-primary" data-testid={`text-addon-price-${addon.id}`}>
            {addon.oneTime ? formatPrice(addon.oneTime) : `+${formatPrice(addon.monthly || 0)}`}
          </span>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {addon.oneTime ? t('addon.pricing.one.time') : t('addon.pricing.monthly')}
          </div>
        </div>
      </div>
    </div>
  );
}
