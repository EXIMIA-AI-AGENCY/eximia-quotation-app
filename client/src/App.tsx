import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Quote from "@/pages/Quote";
import Data from "@/pages/Data";
import Payment from "@/pages/Payment";
import Confirmation from "@/pages/Confirmation";
import TestInvoice from "@/pages/TestInvoice";
import PayPalTest from "@/pages/PayPalTest";
import AdminQuote from "@/pages/AdminQuote";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/cotizar" component={Quote} />
          <Route path="/datos" component={Data} />
          <Route path="/pago" component={Payment} />
          <Route path="/confirmacion" component={Confirmation} />
          <Route path="/test-invoice" component={TestInvoice} />
          <Route path="/paypal-test" component={PayPalTest} />
          <Route path="/adminquote" component={AdminQuote} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
