import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/pricing";

export default function TestInvoice() {
  const { toast } = useToast();
  
  const testInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-invoice", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "¡Factura de prueba exitosa!",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear factura",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-flask text-primary text-2xl"></i>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Prueba de Facturación</h1>
        
        <p className="text-muted-foreground mb-8">
          Crear una factura de prueba y enviarla a info@eximia.agency
        </p>

        <div className="bg-muted p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Datos de prueba:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Email:</strong> info@eximia.agency</p>
            <p><strong>Paquete:</strong> Starter</p>
            <p><strong>Add-on:</strong> Analytics</p>
            <p><strong>Presupuesto anuncios:</strong> {formatCurrency(1000)}/mes</p>
          </div>
        </div>

        {!testInvoiceMutation.isPending ? (
          <div className="space-y-4">
            <Button 
              onClick={() => testInvoiceMutation.mutate()}
              className="w-full"
              size="lg"
              data-testid="button-create-test-invoice"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Crear y Enviar Factura de Prueba
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="loading-dots">Creando factura de prueba...</span>
            </div>
          </div>
        )}

        {testInvoiceMutation.data && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Resultado:</h4>
            <p className="text-sm text-green-700">{testInvoiceMutation.data.message}</p>
            {testInvoiceMutation.data.testData && (
              <div className="text-xs text-green-600 mt-2">
                <pre>{JSON.stringify(testInvoiceMutation.data.testData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}