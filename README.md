# EXIMIA Auto-cotización Web App

Una aplicación web full-stack en español para auto-cotización de servicios EXIMIA con facturación recurrente integrada.

## 🚀 Características

- **Cotización automática**: Flujo completo de selección de paquetes y add-ons
- **Cálculos en tiempo real**: Precios, impuestos (IVU), y cuotas de configuración
- **Integración EXIMIA CRM**: Creación/actualización automática de contactos
- **Facturación recurrente**: EXIMIA Billing API con fallback a Stripe
- **Interfaz en español**: Completamente localizada para el mercado hispano
- **Diseño responsivo**: Dark theme elegante con acentos morados

## 🏗️ Stack Tecnológico

**Frontend:**
- React + TypeScript + Vite
- TailwindCSS con tema dark personalizado
- React Hook Form + Zod para validaciones
- TanStack Query para estado del servidor
- Wouter para enrutamiento

**Backend:**
- Node.js + Express + TypeScript
- Integración con EXIMIA CRM API
- EXIMIA Billing API
- Stripe como Plan B
- Webhooks para actualizaciones de estado

## 📦 Instalación

1. **Clona el repositorio y instala dependencias:**
```bash
npm install
