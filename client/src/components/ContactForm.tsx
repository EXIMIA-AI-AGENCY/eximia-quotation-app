import { UseFormReturn } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContactInfo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ContactFormProps {
  form: UseFormReturn<ContactInfo>;
  onSubmit: (data: ContactInfo) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function ContactForm({ form, onSubmit, onBack, isLoading }: ContactFormProps) {
  const { t } = useLanguage();
  const { watch, setValue } = form;
  const needsBilling = watch("needsBilling");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{t('form.name')} *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('form.name.placeholder')} 
                    {...field} 
                    data-testid="input-name"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{t('form.email')} *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder={t('form.email.placeholder')} 
                    {...field} 
                    data-testid="input-email"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{t('form.phone')} *</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder={t('form.phone.placeholder')} 
                    {...field} 
                    data-testid="input-phone"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{t('form.company')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('form.company.placeholder')} 
                    {...field} 
                    data-testid="input-company"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.website')}</FormLabel>
              <FormControl>
                <Input 
                  type="url"
                  placeholder={t('form.website.placeholder')} 
                  {...field} 
                  data-testid="input-website"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Billing Data Toggle */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <Checkbox 
              checked={needsBilling}
              onCheckedChange={(checked) => setValue("needsBilling", checked as boolean)}
              data-testid="checkbox-billing-toggle"
            />
            <Label className="font-medium">{t('form.billing.needs')}</Label>
          </div>

          {needsBilling && (
            <div className="space-y-6" data-testid="billing-data-section">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.billing.id')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('form.billing.id.placeholder')} 
                          {...field} 
                          data-testid="input-tax-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.billing.name')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('form.billing.name.placeholder')} 
                          {...field} 
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.billing.address')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('form.billing.address.placeholder')} 
                        rows={3}
                        {...field} 
                        data-testid="textarea-billing-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              required 
              className="mt-0.5"
              data-testid="checkbox-terms"
            />
            <Label className="text-sm leading-relaxed">
              {t('form.terms.accept')}{" "}
              <a href="#" className="text-primary hover:underline" data-testid="link-terms">
                {t('form.terms.link')}
              </a>{" "}
              {t('form.terms.and')}{" "}
              <a href="#" className="text-primary hover:underline" data-testid="link-cancellation-policy">
                {t('form.terms.cancellation')}
              </a>{" "}
              {t('form.terms.of')}
            </Label>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox 
              required 
              className="mt-0.5"
              data-testid="checkbox-privacy"
            />
            <Label className="text-sm leading-relaxed">
              {t('form.privacy.accept')}{" "}
              <a href="#" className="text-primary hover:underline" data-testid="link-privacy-policy">
                {t('form.privacy.link')}
              </a>{" "}
              {t('form.privacy.text')} *
            </Label>
          </div>
        </div>

        <div className="flex space-x-4 pt-6">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onBack} 
            className="flex-1"
            data-testid="button-back-quote"
          >
            {t('form.back')}
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isLoading}
            data-testid="button-send-invoice"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                {t('form.submit.loading')}
              </>
            ) : (
              t('form.submit')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
