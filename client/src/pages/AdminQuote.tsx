import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/pricing";
import { Quote, User } from "@shared/schema";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminQuote() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin authentication status
  useEffect(() => {
    fetch("/api/admin/status")
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          toast({
            title: "Acceso requerido",
            description: "Por favor inicia sesión",
            variant: "default",
          });
          setLocation("/admin/login");
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        setLocation("/admin/login");
      });
  }, [toast, setLocation]);
  
  const { data: quotes, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/admin/quotes"],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto refetch every minute
    enabled: isAdmin === true,
    retry: false,
  });

  // Handle unauthorized errors at the API level
  useEffect(() => {
    if (error && (error as Error).message.includes("401")) {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión nuevamente",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
  }, [error, toast, setLocation]);

  const filteredQuotes = quotes && Array.isArray(quotes) 
    ? quotes.filter((quote: Quote) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          quote.contact.name.toLowerCase().includes(searchLower) ||
          quote.contact.email.toLowerCase().includes(searchLower) ||
          quote.contact.phone.includes(searchTerm) ||
          (quote.contact.company || "").toLowerCase().includes(searchLower) ||
          quote.packageId.toLowerCase().includes(searchLower)
        );
      }).sort((a: Quote, b: Quote) => {
        switch (sortBy) {
          case "amount":
            return b.totals.totalMonthly - a.totals.totalMonthly;
          case "name":
            return a.contact.name.localeCompare(b.contact.name);
          case "date":
          default:
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }
      })
    : [];

  if (isAdmin === null || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAdmin) {
    return null;
  }

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2" data-testid="title-admin-quotes">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestiona todas las cotizaciones completadas • {filteredQuotes.length} cotizaciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              <i className="fas fa-user"></i>
              <span>Administrador</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  setLocation("/admin/login");
                }}
                className="ml-2"
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </Button>
              </div>
            <Button 
              onClick={refreshData} 
              variant="outline" 
              className="flex items-center gap-2 self-start lg:self-auto"
              data-testid="button-refresh"
            >
              <i className="fas fa-sync-alt text-sm"></i>
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, email, teléfono, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "date" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("date")}
              data-testid="button-sort-date"
            >
              <i className="fas fa-calendar mr-2"></i>
              Fecha
            </Button>
            <Button
              variant={sortBy === "amount" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("amount")}
              data-testid="button-sort-amount"
            >
              <i className="fas fa-dollar-sign mr-2"></i>
              Monto
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("name")}
              data-testid="button-sort-name"
            >
              <i className="fas fa-user mr-2"></i>
              Nombre
            </Button>
          </div>
        </div>
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-file-invoice text-muted-foreground text-xl"></i>
          </div>
          <h3 className="font-semibold mb-2">
            {searchTerm ? "No se encontraron cotizaciones" : "No hay cotizaciones"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm 
              ? "Intenta con otros términos de búsqueda" 
              : "Las cotizaciones aparecerán aquí cuando los clientes completen el proceso"
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6">
          {filteredQuotes.map((quote: Quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  const contact = quote.contact;
  const totals = quote.totals;
  
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('es-PR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatFullDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getPackageBadge = (packageId: string) => {
    const colors = {
      starter: "bg-blue-100 text-blue-800 border-blue-200",
      pro: "bg-purple-100 text-purple-800 border-purple-200",
      enterprise: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[packageId as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div 
      className="bg-card border border-border rounded-xl hover:shadow-md transition-all duration-200 hover:border-primary/20" 
      data-testid={`quote-card-${quote.id}`}
    >
      <div className="p-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg" data-testid={`text-contact-name-${quote.id}`}>
                {contact.name}
              </h3>
              <span 
                className={`px-2 py-1 rounded-md text-xs font-medium border ${getPackageBadge(quote.packageId)}`}
                data-testid={`badge-package-${quote.id}`}
              >
                {quote.packageId.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <i className="fas fa-envelope w-4"></i>
                <span data-testid={`text-contact-email-${quote.id}`}>{contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-phone w-4"></i>
                <span data-testid={`text-contact-phone-${quote.id}`}>{contact.phone}</span>
              </div>
              {contact.company && (
                <div className="flex items-center gap-2">
                  <i className="fas fa-building w-4"></i>
                  <span data-testid={`text-contact-company-${quote.id}`}>{contact.company}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary mb-1" data-testid={`text-total-monthly-${quote.id}`}>
              {formatCurrency(totals.totalMonthly)}<span className="text-sm font-normal text-muted-foreground">/mes</span>
            </div>
            <div className="text-xs text-muted-foreground" data-testid={`text-quote-date-${quote.id}`}>
              {quote.createdAt ? formatDate(quote.createdAt) : 'Sin fecha'}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border">
          {/* Package & Add-ons */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Servicios
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Paquete:</span>
                <span className="font-medium" data-testid={`text-package-detail-${quote.id}`}>
                  {quote.packageId}
                </span>
              </div>
              {quote.addonIds && Array.isArray(quote.addonIds) && quote.addonIds.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Add-ons:</div>
                  <div className="flex flex-wrap gap-1">
                    {quote.addonIds.map((addon, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-muted rounded text-xs"
                        data-testid={`addon-${addon}-${quote.id}`}
                      >
                        {addon}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Contrato:</span>
                <span className="font-medium" data-testid={`text-contract-term-${quote.id}`}>
                  {totals.contractTerm.name}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Desglose
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span data-testid={`text-subtotal-${quote.id}`}>
                  {formatCurrency(totals.subtotalMonthly)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Descuento:</span>
                  <span className="text-green-600" data-testid={`text-discount-${quote.id}`}>
                    -{formatCurrency(totals.discount)} ({totals.discountPercentage * 100}%)
                  </span>
                </div>
              )}
              {totals.totalToday !== totals.totalMonthly && (
                <div className="flex justify-between text-sm">
                  <span>Cobro inicial:</span>
                  <span className="font-medium" data-testid={`text-total-today-${quote.id}`}>
                    {formatCurrency(totals.totalToday)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Technical Info */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Información técnica
            </h4>
            <div className="space-y-2">
              {quote.ghlInvoiceId && (
                <div>
                  <div className="text-xs text-muted-foreground">GHL Invoice ID:</div>
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {quote.ghlInvoiceId}
                  </div>
                </div>
              )}
              {quote.ghlCustomerId && (
                <div>
                  <div className="text-xs text-muted-foreground">GHL Customer ID:</div>
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {quote.ghlCustomerId}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Fecha completa:</div>
                <div className="text-xs">
                  {quote.createdAt ? formatFullDate(quote.createdAt) : 'Sin fecha'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {contact.monthlyAdSpend && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-bullseye text-orange-500"></i>
              <span className="text-muted-foreground">Presupuesto publicitario:</span>
              <span className="font-medium" data-testid={`text-monthly-adspend-${quote.id}`}>
                {formatCurrency(contact.monthlyAdSpend)}/mes
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}