import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-language-toggle"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {language === 'es' ? 'ES' : 'EN'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem
          onClick={() => setLanguage('es')}
          className={`flex items-center gap-2 ${language === 'es' ? 'bg-accent' : ''}`}
          data-testid="option-language-es"
        >
          <span className="text-lg">🇪🇸</span>
          <span>Español</span>
          {language === 'es' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-2 ${language === 'en' ? 'bg-accent' : ''}`}
          data-testid="option-language-en"
        >
          <span className="text-lg">🇺🇸</span>
          <span>English</span>
          {language === 'en' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}