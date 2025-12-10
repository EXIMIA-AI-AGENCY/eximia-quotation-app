import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2" data-testid="title-hero">
            {t('hero.title')}{" "}
            <span className="gradient-text">{t('hero.title.brand')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0" data-testid="text-hero-subtitle">
            {t('hero.subtitle')}
          </p>
          <Link href="/cotizar">
            <button 
              className="bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto max-w-xs mx-auto"
              data-testid="button-start-quote"
            >
              <i className="fas fa-calculator mr-2"></i>
              {t('hero.cta')}
            </button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-0">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 text-center card-glow" data-testid="feature-card-crm">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-robot text-primary text-lg sm:text-xl"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('features.crm.title')}</h3>
            <p className="text-muted-foreground text-sm sm:text-base">{t('features.crm.description')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 text-center card-glow" data-testid="feature-card-chatbot">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-comments text-primary text-lg sm:text-xl"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('features.chatbot.title')}</h3>
            <p className="text-muted-foreground text-sm sm:text-base">{t('features.chatbot.description')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 text-center card-glow sm:col-span-2 lg:col-span-1" data-testid="feature-card-automation">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-chart-line text-primary text-lg sm:text-xl"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('features.automation.title')}</h3>
            <p className="text-muted-foreground text-sm sm:text-base">{t('features.automation.description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
