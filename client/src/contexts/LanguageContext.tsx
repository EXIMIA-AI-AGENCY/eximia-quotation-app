import { createContext, useContext, useState, useEffect } from "react";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Translation keys and their values
const translations = {
  es: {
    // Home page
    "hero.title": "Auto-cotiza tu plan",
    "hero.title.brand": "EXIMIA",
    "hero.subtitle": "Elige tu paquete, personaliza con add-ons y activa tu suscripción hoy. Transforma tu negocio con la plataforma de automatización más avanzada.",
    "hero.cta": "Empieza tu cotización",
    
    // Features
    "features.crm.title": "CRM Inteligente",
    "features.crm.description": "Automatiza tu gestión de clientes con IA avanzada",
    "features.chatbot.title": "Chatbots Avanzados", 
    "features.chatbot.description": "Conversaciones naturales las 24 horas",
    "features.automation.title": "Automatizaciones",
    "features.automation.description": "Workflows que convierten más y mejor",
    
    // Quote page
    "quote.progress": "Paso 1 de 4",
    "quote.progress.label": "Cotización",
    "quote.title": "Elige tu paquete",
    "quote.subtitle": "Selecciona el plan que mejor se adapte a tus necesidades",
    "quote.addons.title": "Add-ons disponibles",
    "quote.addons.subtitle": "Potencia tu plan con estas funcionalidades adicionales",
    "quote.contract.title": "Término de contrato",
    "quote.contract.subtitle": "Mientras más te comprometas, mayor descuento obtienes",
    "quote.adspend.title": "Presupuesto para anuncios (Opcional)",
    "quote.adspend.subtitle": "¿Cuál es tu presupuesto mensual aproximado para anuncios?",
    "quote.adspend.label": "Presupuesto mensual para anuncios (USD)",
    "quote.adspend.placeholder": "1000",
    "quote.adspend.help": "Esta información nos ayuda a recomendarte el mejor plan. No afecta el precio.",
    
    // Data/Contact form page
    "form.progress": "Paso 2 de 4",
    "form.progress.label": "Información de contacto",
    "form.contact.title": "Información de contacto",
    "form.contact.subtitle": "Necesitamos algunos datos para procesar tu cotización",
    "form.name": "Nombre completo",
    "form.email": "Email",
    "form.phone": "Teléfono",
    "form.company": "Empresa",
    "form.website": "Sitio web",
    "form.name.placeholder": "Tu nombre completo",
    "form.email.placeholder": "tu@email.com",
    "form.phone.placeholder": "+1 (555) 123-4567",
    "form.company.placeholder": "Tu empresa",
    "form.website.placeholder": "https://tuempresa.com",
    "form.billing.needs": "¿Necesitas factura con datos fiscales?",
    "form.billing.id": "NIF/RUT/Tax ID",
    "form.billing.name": "Razón social",
    "form.billing.address": "Dirección fiscal",
    "form.billing.id.placeholder": "Número de identificación fiscal",
    "form.billing.name.placeholder": "Nombre legal de tu empresa",
    "form.billing.address.placeholder": "Dirección completa para facturación",
    "form.terms.accept": "Acepto los",
    "form.terms.link": "Términos y Condiciones",
    "form.terms.cancellation": "Política de Cancelación",
    "form.terms.and": "y la",
    "form.terms.of": "de EXIMIA. *",
    "form.privacy.accept": "Acepto la",
    "form.privacy.link": "Política de Privacidad",
    "form.privacy.text": "y autorizo el tratamiento de mis datos personales.",
    "form.back": "Volver",
    "form.submit": "Enviar",
    "form.submit.loading": "Enviando...",
    
    // Payment/Confirmation page
    "payment.progress": "Paso 3 de 3",
    "payment.progress.label": "Cotización completada",
    "payment.success.title": "¡Cotización completada exitosamente!",
    "payment.contact.title": "INFORMACIÓN DE CONTACTO",
    "payment.contact.name": "Nombre:",
    "payment.contact.email": "Email:",
    "payment.contact.phone": "Teléfono:",
    "payment.contact.company": "Empresa:",
    "payment.package.title": "PAQUETE SELECCIONADO",
    "payment.package.name": "Paquete:",
    "payment.package.term": "Término del contrato:",
    "payment.package.discount": "Descuento aplicado:",
    "payment.package.price": "Precio mensual base:",
    "payment.addons.title": "ADD-ONS SELECCIONADOS",
    "payment.breakdown.title": "DESGLOSE DE PRECIOS",
    "payment.breakdown.subtotal": "Subtotal mensual:",
    "payment.breakdown.discount": "Descuento por contrato",
    "payment.breakdown.total": "Total mensual:",
    "payment.adspend.label": "Presupuesto publicitario (informativo):",
    "payment.adspend.info": "Este presupuesto es solo informativo",
    "payment.quote.completed": "Cotización completada",
    "payment.expert.contact": "Un Experto de EXIMIA estara en contacto con usted pronto",
    "payment.security": "Cotización generada de forma segura mediante EXIMIA",
    "payment.schedule.button": "Agenda una cita",
    
    // Confirmation page
    "confirmation.title": "¡Gracias por tu pago!",
    "confirmation.subtitle": "Tu pago ha sido procesado exitosamente. Te hemos enviado la confirmación por correo electrónico.",
    "confirmation.order.title": "Detalles del pedido",
    "confirmation.order.id": "ID de pedido:",
    "confirmation.order.plan": "Plan:",
    "confirmation.order.addons": "Add-ons:",
    "confirmation.order.total": "Total a pagar:",
    "confirmation.order.next": "Próximo pago recurrente:",
    "confirmation.progress": "Paso 4 de 4",
    "confirmation.progress.label": "Confirmación",
    "confirmation.order.addons.none": "Ninguno",
    "confirmation.order.unspecified": "No especificado",
    "confirmation.steps.email": "Revisa tu email para la factura y detalles de pago",
    "confirmation.steps.payment": "Realiza el pago según las instrucciones de la factura",
    "confirmation.steps.setup": "Tu cuenta será configurada una vez confirmemos el pago",
    "confirmation.support.button": "Contactar soporte",
    "confirmation.home.button": "Volver al inicio",
    "confirmation.steps.title": "Próximos pasos",
    
    // Admin pages
    "admin.login.title": "Panel de Administración",
    "admin.login.subtitle": "Ingresa tus credenciales para acceder",
    "admin.login.username": "Usuario",
    "admin.login.password": "Contraseña",
    "admin.login.username.placeholder": "Ingresa tu usuario",
    "admin.login.password.placeholder": "Ingresa tu contraseña",
    "admin.login.submit": "Iniciar Sesión",
    "admin.login.loading": "Verificando...",
    "admin.login.back": "Volver al inicio",
    "admin.login.auth.error": "Error de autenticación",
    "admin.login.connection.error": "Error de conexión. Por favor intenta de nuevo.",
    "admin.quotes.title": "Panel de Administración",
    "admin.quotes.subtitle": "Gestiona todas las cotizaciones completadas",
    "admin.quotes.count": "cotizaciones",
    "admin.quotes.refresh": "Actualizar",
    "admin.user": "Administrador",
    "admin.nav": "Admin",
    
    // NotFound page
    "notfound.title": "404 Página No Encontrada",
    "notfound.subtitle": "¿Olvidaste agregar la página al router?",
    
    // Summary component
    "summary.title": "Resumen de cotización",
    "summary.package": "Paquete seleccionado:",
    "summary.packages": "Paquetes seleccionados:",
    "summary.bundle": "BUNDLE",
    "summary.addons": "Add-ons:",
    "summary.contract": "Término de contrato:",
    "summary.adspend": "Presupuesto anuncios:",
    "summary.subtotal": "Subtotal mensual:",
    "summary.discount": "Descuento",
    "summary.subtotal.discounted": "Subtotal con descuento:",
    "summary.setup.free": "¡Genial! Tu cuota de configuración ($99) está incluida GRATIS por seleccionar contrato de",
    "summary.contract.3months": "3 meses",
    "summary.contract.6months": "6 meses", 
    "summary.contract.12months": "1 año",
    "summary.setup.fee": "Cuota de configuración:",
    "summary.setup.free.short": "(GRATIS)",
    "summary.onetime.fees": "Pagos únicos:",
    "summary.total.today": "Total hoy:",
    "summary.total.monthly.services": "Total mensual (servicios):",
    "summary.total.monthly.global": "Total mensual global:",
    "summary.taxes.note": "Precios en USD. Impuestos aplicables pueden variar según el servicio.",
    "summary.save.tip": "¡Ahorra $99! Selecciona un contrato de 3+ meses y obtén la configuración GRATIS.",
    "summary.setup.included": "por seleccionar contrato de",
    
    // Package card
    "package.popular": "Más Popular",
    "package.bundle.available": "Se puede combinar con otros planes",
    
    // Package names
    "package.starter.name": "EXIMIA CRM",
    "package.chatbot.name": "EXIMIA AI", 
    "package.ai_crm.name": "EXIMIA CRM + AI",
    "package.pro.name": "EXIMIA MARKETING SUITE",
    "package.enterprise.name": "EXIMIA MARKETING AND AI SUITE",
    
    // Package descriptions
    "package.starter.desc": "Automatización de CRM completa + número interno",
    "package.chatbot.desc": "AI Chatbot + Voice calls automatizado para atención al cliente",
    "package.ai_crm.desc": "CRM automatizado + Inteligencia Artificial sin mercadeo",
    "package.pro.desc": "Todo del Starter + Website + Marketing Service + Artes",
    "package.enterprise.desc": "Todo del Pro + AI avanzado + desarrollo personalizado",
    
    // Package features - Starter
    "package.starter.feature.0": "Automatización de CRM completa",
    "package.starter.feature.1": "Incluye 1 número interno mensual", 
    "package.starter.feature.2": "Uso del teléfono: $0.03/min llamadas, $0.01/SMS",
    "package.starter.feature.3": "Configuración inicial incluida",
    "package.starter.feature.4": "Soporte email",
    
    // Package features - Chatbot 
    "package.chatbot.feature.0": "AI Chatbot inteligente 24/7",
    "package.chatbot.feature.1": "AI Voice calls automatizadas",
    "package.chatbot.feature.2": "Respuestas automatizadas personalizadas",
    "package.chatbot.feature.3": "Agendamiento de citas automático",
    "package.chatbot.feature.4": "Integración con tu página web",
    "package.chatbot.feature.5": "Uso de AI: $0.02/mensaje, $0.05/llamada",
    "package.chatbot.feature.6": "Configuración inicial incluida",
    "package.chatbot.feature.7": "Soporte email",
    
    // Package features - AI CRM
    "package.ai_crm.feature.0": "Automatización de CRM completa",
    "package.ai_crm.feature.1": "AI Chatbot para agendar citas",
    "package.ai_crm.feature.2": "Llamadas de AI automatizadas",
    "package.ai_crm.feature.3": "Incluye 1 número interno mensual",
    "package.ai_crm.feature.4": "Uso del teléfono: $0.03/min llamadas, $0.01/SMS",
    "package.ai_crm.feature.5": "Uso de AI: $0.02/mensaje, $0.05/llamada",
    "package.ai_crm.feature.6": "Configuración inicial incluida",
    "package.ai_crm.feature.7": "Soporte email",
    
    // Package features - Pro
    "package.pro.feature.0": "Todo lo del CRM Starter",
    "package.pro.feature.1": "Website profesional incluido",
    "package.pro.feature.2": "Marketing Service completo",
    "package.pro.feature.3": "3 artes gráficas mensuales (si es necesario)",
    "package.pro.feature.4": "Primer mes: 3 artes garantizados",
    "package.pro.feature.5": "Soporte prioritario",
    
    // Package features - Enterprise
    "package.enterprise.feature.0": "Todo lo del paquete Pro",
    "package.enterprise.feature.1": "AI Chatbot para agendar citas",
    "package.enterprise.feature.2": "Llamadas de AI automatizadas",
    "package.enterprise.feature.3": "Artes ilimitadas para campañas de generación de leads (<strong>mientras sea necesario para la eficiencia de la campaña.</strong>)",
    "package.enterprise.feature.4": "Leads garantizados cada mes",
    "package.enterprise.feature.5": "1 video al mes de alta calidad para social media",
    "package.enterprise.feature.6": "Integraciones personalizadas al CRM",
    "package.enterprise.feature.7": "Web app si es necesario para el negocio",
    "package.enterprise.feature.8": "Gestor de cuenta dedicado",
    
    // Package features - AI Ultimate
    "package.ai_ultimate.name": "EXIMIA AI ULTIMATE",
    "package.ai_ultimate.desc": "AI Premium Voice + AI Messages + CRM gratis - Solo pagas uso de AI",
    "package.ai_ultimate.feature.0": "AI Premium Voice incluido (LIFETIME)",
    "package.ai_ultimate.feature.1": "AI Messages premium incluido (LIFETIME)",
    "package.ai_ultimate.feature.2": "CRM completo GRATIS",
    "package.ai_ultimate.feature.3": "1 número interno incluido",
    "package.ai_ultimate.feature.4": "Uso de AI: $0.02/mensaje, $0.05/llamada",
    "package.ai_ultimate.feature.5": "Uso del teléfono: $0.03/min llamadas, $0.01/SMS",
    "package.ai_ultimate.feature.6": "Configuración inicial incluida",
    "package.ai_ultimate.feature.7": "Soporte prioritario",
    
    // Package features - AI Basic
    "package.ai_basic.name": "EXIMIA AI BASIC",
    "package.ai_basic.desc": "AI Basic Voice + AI Messages + CRM gratis - Solo pagas uso de AI",
    "package.ai_basic.feature.0": "AI Basic Voice incluido (LIFETIME)",
    "package.ai_basic.feature.1": "AI Messages incluido (LIFETIME)",
    "package.ai_basic.feature.2": "Voz más robótica que Ultimate",
    "package.ai_basic.feature.3": "CRM completo GRATIS",
    "package.ai_basic.feature.4": "1 número interno incluido",
    "package.ai_basic.feature.5": "Uso de AI: $0.02/mensaje, $0.05/llamada",
    "package.ai_basic.feature.6": "Uso del teléfono: $0.03/min llamadas, $0.01/SMS",
    "package.ai_basic.feature.7": "Configuración inicial incluida",
    
    // Add-on names
    "addon.whatsapp.name": "WhatsApp Business API",
    "addon.ai_integration.name": "Integración de AI Completa",
    "addon.hipaa_compliance.name": "Cumplimiento con HIPAA (para doctores)",
    "addon.coming_soon.name": "Más addons en camino...",
    
    // Add-on descriptions
    "addon.whatsapp.desc": "Integra WhatsApp a tus automatizaciones",
    "addon.ai_integration.desc": "Integra AI calls y chatbot LIFETIME - Incluye REGISTRATION para SMS + 1 número interno - Uso: $0.03/min llamadas, $0.01/SMS, $0.02/mensaje AI, $0.05/llamada AI - Se puede obtener solo sin plan (pago único)",
    "addon.hipaa_compliance.desc": "Configuración completa para cumplimiento HIPAA",
    "addon.coming_soon.desc": "Próximamente más integraciones y funcionalidades",
    
    // Add-on pricing labels
    "addon.pricing.one.time": "único",
    "addon.pricing.monthly": "/mes",
    
    // Add-on availability messages
    "addon.non.ai.only": "Solo disponible para planes sin IA",
    "addon.requires.plan": "Requiere un paquete base primero",
    
    // Contract terms
    "contract.term.1month": "1 mes",
    "contract.term.3months": "3 meses",
    "contract.term.6months": "6 meses",
    "contract.term.1year": "1 año",
    "contract.label.1month": "Mes a mes",
    "contract.label.3months": "3 meses (7% descuento)",
    "contract.label.6months": "6 meses (10% descuento)",
    "contract.label.1year": "1 año (15% descuento)",
    
    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    
    // Error messages
    "error.data.incomplete": "Datos incompletos",
    "error.data.incomplete.desc": "Por favor completa el proceso desde el inicio",
    "error.calculating.totals": "Error calculando totales",
    "error.invoice.send": "Error al enviar factura",
    "error.invoice.send.desc": "Ha ocurrido un error al enviar la factura",
    "error.quote.not.found": "Cotización no encontrada",
    "error.quote.not.found.desc": "Por favor selecciona un paquete primero",
    "error.quote.info.missing": "No se encontró información de la cotización",
    "common.success": "Éxito",
    "common.cancel": "Cancelar",
    "common.continue": "Continuar",
    "common.back": "Volver",
    "common.next": "Siguiente",
    "common.save": "Guardar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.close": "Cerrar",
    "common.per.month": "/mes",
    "common.one.time": "único",
    "common.no.selected": "No seleccionado",
    "common.ai.tooltip": "Incluye Inteligencia Artificial",
    "common.ai.only": "Solo integración de IA",
    "common.locale": "es",
    
    // Toast messages
    "toast.welcome": "Bienvenido",
    "toast.access.granted": "Acceso autorizado al panel de administración",
    "toast.invoice.test.success": "¡Factura de prueba exitosa!",
    "toast.invoice.create.error": "Error al crear factura",
    "toast.error.generic": "Ha ocurrido un error"
  },
  en: {
    // Home page
    "hero.title": "Auto-quote your",
    "hero.title.brand": "EXIMIA",
    "hero.subtitle": "Choose your package, customize with add-ons and activate your subscription today. Transform your business with the most advanced automation platform.",
    "hero.cta": "Start your quote",
    
    // Features
    "features.crm.title": "Smart CRM",
    "features.crm.description": "Automate your customer management with advanced AI",
    "features.chatbot.title": "Advanced Chatbots", 
    "features.chatbot.description": "Natural conversations 24/7",
    "features.automation.title": "Automations",
    "features.automation.description": "Workflows that convert better",
    
    // Quote page
    "quote.progress": "Step 1 of 4",
    "quote.progress.label": "Quote",
    "quote.title": "Choose your package",
    "quote.subtitle": "Select the plan that best fits your needs",
    "quote.addons.title": "Available add-ons",
    "quote.addons.subtitle": "Enhance your plan with these additional features",
    "quote.contract.title": "Contract term",
    "quote.contract.subtitle": "The more you commit, the greater discount you get",
    "quote.adspend.title": "Advertising budget (Optional)",
    "quote.adspend.subtitle": "What is your approximate monthly budget for advertising?",
    "quote.adspend.label": "Monthly advertising budget (USD)",
    "quote.adspend.placeholder": "1000",
    "quote.adspend.help": "This information helps us recommend the best plan. It does not affect pricing.",
    
    // Data/Contact form page
    "form.progress": "Step 2 of 4",
    "form.progress.label": "Contact information",
    "form.contact.title": "Contact information",
    "form.contact.subtitle": "We need some information to process your quote",
    "form.name": "Full name",
    "form.email": "Email",
    "form.phone": "Phone",
    "form.company": "Company",
    "form.website": "Website",
    "form.name.placeholder": "Your full name",
    "form.email.placeholder": "your@email.com",
    "form.phone.placeholder": "+1 (555) 123-4567",
    "form.company.placeholder": "Your company",
    "form.website.placeholder": "https://yourcompany.com",
    "form.billing.needs": "Do you need an invoice with tax information?",
    "form.billing.id": "Tax ID",
    "form.billing.name": "Business name",
    "form.billing.address": "Billing address",
    "form.billing.id.placeholder": "Tax identification number",
    "form.billing.name.placeholder": "Legal name of your business",
    "form.billing.address.placeholder": "Complete billing address",
    "form.terms.accept": "I accept the",
    "form.terms.link": "Terms and Conditions",
    "form.terms.cancellation": "Cancellation Policy",
    "form.terms.and": "and the",
    "form.terms.of": "of EXIMIA. *",
    "form.privacy.accept": "I accept the",
    "form.privacy.link": "Privacy Policy",
    "form.privacy.text": "and authorize the processing of my personal data.",
    "form.back": "Back",
    "form.submit": "Send",
    "form.submit.loading": "Sending...",
    
    // Payment/Confirmation page
    "payment.progress": "Step 3 of 3",
    "payment.progress.label": "Quote completed",
    "payment.success.title": "Quote completed successfully!",
    "payment.contact.title": "CONTACT INFORMATION",
    "payment.contact.name": "Name:",
    "payment.contact.email": "Email:",
    "payment.contact.phone": "Phone:",
    "payment.contact.company": "Company:",
    "payment.package.title": "SELECTED PACKAGE",
    "payment.package.name": "Package:",
    "payment.package.term": "Contract term:",
    "payment.package.discount": "Applied discount:",
    "payment.package.price": "Base monthly price:",
    "payment.addons.title": "SELECTED ADD-ONS",
    "payment.breakdown.title": "PRICE BREAKDOWN",
    "payment.breakdown.subtotal": "Monthly subtotal:",
    "payment.breakdown.discount": "Contract discount",
    "payment.breakdown.total": "Monthly total:",
    "payment.adspend.label": "Advertising budget (informational):",
    "payment.adspend.info": "This budget is informational only",
    "payment.quote.completed": "Quote completed",
    "payment.expert.contact": "An EXIMIA Expert will be in touch with you soon",
    "payment.security": "Quote generated securely by EXIMIA",
    "payment.schedule.button": "Schedule an appointment",
    
    // Confirmation page
    "confirmation.title": "Thank you for your payment!",
    "confirmation.subtitle": "Your payment has been processed successfully. We have sent you the confirmation via email.",
    "confirmation.order.title": "Order details",
    "confirmation.order.id": "Order ID:",
    "confirmation.order.plan": "Plan:",
    "confirmation.order.addons": "Add-ons:",
    "confirmation.order.total": "Total to pay:",
    "confirmation.order.next": "Next recurring payment:",
    "confirmation.progress": "Step 4 of 4",
    "confirmation.progress.label": "Confirmation",
    "confirmation.order.addons.none": "None",
    "confirmation.order.unspecified": "Not specified",
    "confirmation.steps.email": "Check your email for invoice and payment details",
    "confirmation.steps.payment": "Make payment according to invoice instructions",
    "confirmation.steps.setup": "Your account will be set up once we confirm payment",
    "confirmation.support.button": "Contact support",
    "confirmation.home.button": "Back to home",
    "confirmation.steps.title": "Next steps",
    
    // Admin pages
    "admin.login.title": "Administration Panel",
    "admin.login.subtitle": "Enter your credentials to access",
    "admin.login.username": "Username",
    "admin.login.password": "Password",
    "admin.login.username.placeholder": "Enter your username",
    "admin.login.password.placeholder": "Enter your password",
    "admin.login.submit": "Login",
    "admin.login.loading": "Verifying...",
    "admin.quotes.title": "Administration Panel",
    "admin.quotes.subtitle": "Manage all completed quotes",
    "admin.quotes.count": "quotes",
    "admin.quotes.refresh": "Refresh",
    "admin.user": "Administrator",
    "admin.nav": "Admin",
    "admin.login.back": "Back to home",
    "admin.login.auth.error": "Authentication error",
    "admin.login.connection.error": "Connection error. Please try again.",
    
    // NotFound page
    "notfound.title": "404 Page Not Found",
    "notfound.subtitle": "Did you forget to add the page to the router?",
    
    // Summary component
    "summary.title": "Quote summary",
    "summary.package": "Selected package:",
    "summary.packages": "Selected packages:",
    "summary.bundle": "BUNDLE",
    "summary.addons": "Add-ons:",
    "summary.contract": "Contract term:",
    "summary.adspend": "Ads budget:",
    "summary.subtotal": "Monthly subtotal:",
    "summary.discount": "Discount",
    "summary.subtotal.discounted": "Discounted subtotal:",
    "summary.setup.free": "Great! Your setup fee ($99) is included FREE for selecting",
    "summary.contract.3months": "3 months",
    "summary.contract.6months": "6 months",
    "summary.contract.12months": "1 year",
    "summary.setup.fee": "Setup fee:",
    "summary.setup.free.short": "(FREE)",
    "summary.onetime.fees": "One-time payments:",
    "summary.total.today": "Total today:",
    "summary.total.monthly.services": "Monthly total (services):",
    "summary.total.monthly.global": "Global monthly total:",
    "summary.taxes.note": "Prices in USD. Applicable taxes may vary by service.",
    "summary.save.tip": "Save $99! Select a 3+ month contract and get setup FREE.",
    "summary.setup.included": "contract",
    
    // Package card
    "package.popular": "Most Popular",
    "package.bundle.available": "Can be combined with other plans",
    
    // Package names
    "package.starter.name": "EXIMIA CRM",
    "package.chatbot.name": "EXIMIA AI",
    "package.ai_crm.name": "EXIMIA CRM + AI",
    "package.pro.name": "EXIMIA MARKETING SUITE",
    "package.enterprise.name": "EXIMIA MARKETING AND AI SUITE",
    
    // Package descriptions  
    "package.starter.desc": "Complete CRM automation + internal number",
    "package.chatbot.desc": "AI Chatbot + automated Voice calls for customer service",
    "package.ai_crm.desc": "Automated CRM + Artificial Intelligence without marketing",
    "package.pro.desc": "Everything from Starter + Website + Marketing Service + Graphics",
    "package.enterprise.desc": "Everything from Pro + advanced AI + custom development",
    
    // Package features - Starter
    "package.starter.feature.0": "Complete CRM automation",
    "package.starter.feature.1": "Includes 1 monthly internal number",
    "package.starter.feature.2": "Phone usage: $0.03/min calls, $0.01/SMS",
    "package.starter.feature.3": "Initial setup included",
    "package.starter.feature.4": "Email support",
    
    // Package features - Chatbot
    "package.chatbot.feature.0": "Intelligent AI Chatbot 24/7",
    "package.chatbot.feature.1": "Automated AI Voice calls",
    "package.chatbot.feature.2": "Personalized automated responses",
    "package.chatbot.feature.3": "Automatic appointment scheduling",
    "package.chatbot.feature.4": "Integration with your website", 
    "package.chatbot.feature.5": "AI usage: $0.02/message, $0.05/call",
    "package.chatbot.feature.6": "Initial setup included",
    "package.chatbot.feature.7": "Email support",
    
    // Package features - AI CRM
    "package.ai_crm.feature.0": "Complete CRM automation",
    "package.ai_crm.feature.1": "AI Chatbot for appointment scheduling",
    "package.ai_crm.feature.2": "Automated AI calls",
    "package.ai_crm.feature.3": "Includes 1 monthly internal number",
    "package.ai_crm.feature.4": "Phone usage: $0.03/min calls, $0.01/SMS",
    "package.ai_crm.feature.5": "AI usage: $0.02/message, $0.05/call",
    "package.ai_crm.feature.6": "Initial setup included",
    "package.ai_crm.feature.7": "Email support",
    
    // Package features - Pro
    "package.pro.feature.0": "Everything from CRM Starter",
    "package.pro.feature.1": "Professional website included",
    "package.pro.feature.2": "Complete Marketing Service",
    "package.pro.feature.3": "3 monthly graphics (if needed)",
    "package.pro.feature.4": "First month: 3 graphics guaranteed",
    "package.pro.feature.5": "Priority support",
    
    // Package features - Enterprise
    "package.enterprise.feature.0": "Everything from Pro package",
    "package.enterprise.feature.1": "AI Chatbot for appointment scheduling",
    "package.enterprise.feature.2": "Automated AI calls",
    "package.enterprise.feature.3": "Unlimited graphics for lead generation campaigns (<strong>as needed for campaign efficiency.</strong>)",
    "package.enterprise.feature.4": "Guaranteed leads every month",
    "package.enterprise.feature.5": "1 high-quality social media video per month",
    "package.enterprise.feature.6": "Custom CRM integrations",
    "package.enterprise.feature.7": "Web app if needed for business",
    "package.enterprise.feature.8": "Dedicated account manager",
    
    // Package features - AI Ultimate
    "package.ai_ultimate.name": "EXIMIA AI ULTIMATE",
    "package.ai_ultimate.desc": "AI Premium Voice + AI Messages + Free CRM - Only pay for AI usage",
    "package.ai_ultimate.feature.0": "AI Premium Voice included (LIFETIME)",
    "package.ai_ultimate.feature.1": "Premium AI Messages included (LIFETIME)",
    "package.ai_ultimate.feature.2": "Complete CRM FREE",
    "package.ai_ultimate.feature.3": "1 internal number included",
    "package.ai_ultimate.feature.4": "AI usage: $0.02/message, $0.05/call",
    "package.ai_ultimate.feature.5": "Phone usage: $0.03/min calls, $0.01/SMS",
    "package.ai_ultimate.feature.6": "Initial setup included",
    "package.ai_ultimate.feature.7": "Priority support",
    
    // Package features - AI Basic
    "package.ai_basic.name": "EXIMIA AI BASIC",
    "package.ai_basic.desc": "AI Basic Voice + AI Messages + Free CRM - Only pay for AI usage",
    "package.ai_basic.feature.0": "AI Basic Voice included (LIFETIME)",
    "package.ai_basic.feature.1": "AI Messages included (LIFETIME)",
    "package.ai_basic.feature.2": "More robotic voice than Ultimate",
    "package.ai_basic.feature.3": "Complete CRM FREE",
    "package.ai_basic.feature.4": "1 internal number included",
    "package.ai_basic.feature.5": "AI usage: $0.02/message, $0.05/call",
    "package.ai_basic.feature.6": "Phone usage: $0.03/min calls, $0.01/SMS",
    "package.ai_basic.feature.7": "Initial setup included",
    
    // Add-on names
    "addon.whatsapp.name": "WhatsApp Business API",
    "addon.ai_integration.name": "Complete AI Integration",
    "addon.hipaa_compliance.name": "HIPAA Compliance (for doctors)",
    "addon.coming_soon.name": "More addons coming...",
    
    // Add-on descriptions
    "addon.whatsapp.desc": "Integrate WhatsApp into your automations",
    "addon.ai_integration.desc": "Integrate AI calls and chatbot LIFETIME - Includes REGISTRATION for SMS + 1 internal number - Usage: $0.03/min calls, $0.01/SMS, $0.02/AI message, $0.05/AI call - Can be obtained standalone without plan (one-time payment)",
    "addon.hipaa_compliance.desc": "Complete setup for HIPAA compliance",
    "addon.coming_soon.desc": "More integrations and functionalities coming soon",
    
    // Add-on pricing labels
    "addon.pricing.one.time": "one-time",
    "addon.pricing.monthly": "/mo",
    
    // Add-on availability messages
    "addon.non.ai.only": "Only available for non-AI plans",
    "addon.requires.plan": "Requires a base package first",
    
    // Contract terms
    "contract.term.1month": "1 month",
    "contract.term.3months": "3 months",
    "contract.term.6months": "6 months", 
    "contract.term.1year": "1 year",
    "contract.label.1month": "Month to month",
    "contract.label.3months": "3 months (7% discount)",
    "contract.label.6months": "6 months (10% discount)",
    "contract.label.1year": "1 year (15% discount)",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    
    // Error messages
    "error.data.incomplete": "Incomplete data",
    "error.data.incomplete.desc": "Please complete the process from the beginning",
    "error.calculating.totals": "Error calculating totals",
    "error.invoice.send": "Error sending invoice",
    "error.invoice.send.desc": "An error occurred while sending the invoice",
    "error.quote.not.found": "Quote not found",
    "error.quote.not.found.desc": "Please select a package first",
    "error.quote.info.missing": "Quote information not found",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.continue": "Continue",
    "common.back": "Back",
    "common.next": "Next",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.per.month": "/mo",
    "common.one.time": "one-time",
    "common.no.selected": "Not selected",
    "common.ai.tooltip": "Includes Artificial Intelligence",
    "common.ai.only": "AI integration only",
    "common.locale": "en",
    
    // Toast messages
    "toast.welcome": "Welcome",
    "toast.access.granted": "Authorized access to the administration panel",
    "toast.invoice.test.success": "Test invoice successful!",
    "toast.invoice.create.error": "Error creating invoice",
    "toast.error.generic": "An error has occurred"
  }
};

// Function to detect user's country based on IP
async function detectUserCountry(): Promise<string> {
  try {
    // Use ipapi.co for free IP geolocation
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'XX'; // Return country code or 'XX' if unavailable
  } catch (error) {
    console.warn('Could not detect user location:', error);
    return 'XX'; // Default fallback
  }
}

// Function to determine language based on country
function getLanguageForCountry(countryCode: string): Language {
  // US -> English, PR -> Spanish, everything else -> Spanish (default)
  if (countryCode === 'US') {
    return 'en';
  } else if (countryCode === 'PR') {
    return 'es';
  }
  // Default to Spanish for all other countries
  return 'es';
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('es'); // Default to Spanish
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language based on localStorage or IP detection
  useEffect(() => {
    const initializeLanguage = async () => {
      // Check if user has manually selected a language (has flag indicating manual selection)
      const savedLanguage = localStorage.getItem('eximia-language');
      const isManualSelection = localStorage.getItem('eximia-language-manual') === 'true';
      
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en') && isManualSelection) {
        // User manually selected this language, use it
        setLanguageState(savedLanguage);
      } else {
        // Detect based on IP (either no saved language or it was auto-detected before)
        const countryCode = await detectUserCountry();
        const detectedLanguage = getLanguageForCountry(countryCode);
        setLanguageState(detectedLanguage);
        localStorage.setItem('eximia-language', detectedLanguage);
        // Don't set manual flag - this was auto-detected
        localStorage.removeItem('eximia-language-manual');
      }
      
      setIsInitialized(true);
    };

    initializeLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eximia-language', lang);
    localStorage.setItem('eximia-language-manual', 'true'); // Mark as manual selection
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  // Don't render children until language is initialized
  if (!isInitialized) {
    // Show loading text in the default language (Spanish) since translations aren't available yet
    return <div>{language === 'en' ? 'Loading...' : 'Cargando...'}</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}