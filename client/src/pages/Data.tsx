import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactSchema, type ContactInfo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Data() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ContactInfo>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      website: "",
      taxId: "",
      businessName: "",
      billingAddress: "",
      needsBilling: false,
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/send-estimate", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store invoice and quote IDs for payment page
      sessionStorage.setItem("invoiceId", data.invoiceId);
      sessionStorage.setItem("quoteId", data.quoteId);
      setLocation("/pago");
    },
    onError: (error: any) => {
      toast({
        title: t('error.invoice.send'),
        description: error.message || t('error.invoice.send.desc'),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if we have a quote in sessionStorage
    const savedQuote = sessionStorage.getItem("quote");
    if (!savedQuote) {
      toast({
        title: t('error.quote.not.found'),
        description: t('error.quote.not.found.desc'),
        variant: "destructive",
      });
      setLocation("/cotizar");
      return;
    }
  }, [setLocation, toast]);

  const handleSubmit = (data: ContactInfo) => {
    // Get quote data
    const savedQuote = sessionStorage.getItem("quote");
    if (!savedQuote) {
      toast({
        title: t('common.error'),
        description: t('error.quote.info.missing'),
        variant: "destructive",
      });
      return;
    }

    const quoteData = JSON.parse(savedQuote);
    
    // Save contact data to sessionStorage
    const contactWithAdSpend = {
      ...data,
      monthlyAdSpend: quoteData.monthlyAdSpend,
    };
    sessionStorage.setItem("contact", JSON.stringify(contactWithAdSpend));

    // Send invoice immediately
    sendInvoiceMutation.mutate({
      packageId: quoteData.packageId,
      addonIds: quoteData.addonIds,
      contractTerm: quoteData.contractTerm || "1month",
      contact: contactWithAdSpend,
    });
  };

  const handleBack = () => {
    setLocation("/cotizar");
  };

  return (
    <div className="fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Progress Bar */}
        <div className="mb-6 lg:mb-8" data-testid="progress-bar">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('form.progress')}</span>
            <span className="text-sm font-medium text-muted-foreground">{t('form.progress.label')}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "50%" }}></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-2" data-testid="title-contact-info">{t('form.contact.title')}</h2>
          <p className="text-muted-foreground mb-6 lg:mb-8 text-sm lg:text-base">{t('form.contact.subtitle')}</p>

          <ContactForm 
            form={form}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={sendInvoiceMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
