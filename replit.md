# Overview

EXIMIA is a Spanish-language web application for automated service quotation with recurring billing capabilities. The application provides a complete end-to-end flow for customers to select packages, customize with add-ons, view real-time pricing calculations including taxes and setup fees, and complete payment processing. Built as a full-stack solution, it integrates with EXIMIA CRM for contact management and supports both EXIMIA Billing API and Stripe as a fallback for recurring payment processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and build processes
- **Styling**: TailwindCSS with custom dark theme and purple accent colors for brand consistency
- **Component Library**: Radix UI components via shadcn/ui for accessible, customizable UI primitives
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Layout**: Responsive design with mobile-first approach using CSS Grid and Flexbox

## Backend Architecture
- **Runtime**: Node.js with Express framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud hosting
- **API Design**: RESTful endpoints for pricing, quote management, and payment processing
- **Error Handling**: Centralized error middleware with structured error responses

## Pricing and Calculation Engine
- **Configuration**: JSON-based pricing structure for easy updates without code changes
- **Calculation Logic**: Real-time client and server-side price calculations including:
  - Monthly subscription totals
  - Tax calculations (IVU at 11.5% rate)
  - One-time setup fees
  - Total payment amounts
- **Currency**: USD with Spanish (Puerto Rico) localization for formatting

## Authentication and Session Management
- **Session Storage**: Browser sessionStorage for multi-step quote process
- **Data Flow**: Progressive data collection across multiple pages (quote → contact → payment)
- **State Persistence**: Form data preserved between navigation steps

## Database Schema Design
- **Users Table**: Basic user management for future authentication features
- **Quotes Table**: Complete quote storage including:
  - Package and add-on selections
  - Contact information (JSON field)
  - Calculated totals (JSON field)
  - Payment processing IDs
  - Quote status tracking

## Form Validation and Data Processing
- **Validation**: Zod schemas shared between client and server for consistent validation
- **Contact Form**: Comprehensive business information collection with conditional billing fields
- **Error Handling**: User-friendly error messages in Spanish with proper form field highlighting

## Responsive Design Strategy
- **Breakpoints**: Mobile-first design with progressive enhancement
- **Component Adaptability**: Conditional rendering based on screen size
- **Navigation**: Responsive navigation with mobile-optimized layouts
- **Progress Indicators**: Visual progress tracking through multi-step process

# External Dependencies

## EXIMIA Services Integration
- **EXIMIA CRM API**: Contact creation and management with configurable pipeline and stage settings
- **EXIMIA Billing API**: Primary recurring payment processing system
- **Configuration**: Environment-based API keys, location IDs, and pipeline configuration

## Stripe Payment Processing
- **Purpose**: Fallback payment processor when EXIMIA Billing is unavailable
- **Integration**: Checkout Sessions for subscription creation
- **Webhook Support**: Payment status updates and subscription management
- **Security**: Server-side webhook signature verification

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Connection**: Environment-based DATABASE_URL configuration
- **Migration System**: Drizzle Kit for database schema management

## Development and Build Tools
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Full-stack type safety and development experience
- **ESBuild**: Fast backend bundling for production deployment
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

## UI and Component Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide Icons**: Consistent icon system throughout the application
- **Font Awesome**: Additional icon support for specific brand elements
- **Google Fonts**: Inter font family for clean, professional typography

## Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form state management with performance optimization
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation