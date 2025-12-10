import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import eximiaLogo from "@/assets/eximia-logo.png";
import { LanguageToggle } from "./LanguageToggle";

export default function Navigation() {
  const { t } = useLanguage();
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer" data-testid="link-home">
              <img 
                src={eximiaLogo} 
                alt="EXIMIA" 
                className="h-10 w-auto"
              />
            </div>
          </Link>
          
          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            <LanguageToggle />
            <Link href="/admin/login">
              <div className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2" data-testid="link-admin">
                <i className="fas fa-cog mr-1"></i>
                {t('admin.nav')}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
