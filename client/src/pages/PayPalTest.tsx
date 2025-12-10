import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function PayPalTest() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testPayPalDirect = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Create a test quote first
      const quoteRes = await fetch("/api/test-paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 100, // Test with $100
          description: "EXIMIA Test Payment"
        })
      });
      
      const data = await quoteRes.json();
      
      if (data.approvalUrl) {
        setResponse(data);
        // Open PayPal in new tab for testing
        window.open(data.approvalUrl, '_blank');
      } else {
        setError(data.message || "No approval URL received");
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "Error testing PayPal");
      console.error("PayPal test error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PayPal Test Page</h1>
        
        <div className="bg-card border rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Quick PayPal Test</h2>
          <p className="text-muted-foreground mb-4">
            Click the button below to test PayPal integration directly with a $100 test payment.
          </p>
          
          <Button
            onClick={testPayPalDirect}
            disabled={loading}
            className="bg-[#0070ba] hover:bg-[#005ea6] text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Testing PayPal...
              </>
            ) : (
              "Test PayPal ($100)"
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Error:</h3>
            <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        {response && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Response:</h3>
            <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
            {response.approvalUrl && (
              <div className="mt-4">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  ✅ PayPal URL generated successfully! Opening in new tab...
                </p>
                <a 
                  href={response.approvalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {response.approvalUrl}
                </a>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <ul className="text-sm space-y-1">
            <li>Environment: <span className="font-mono">Production (LIVE)</span></li>
            <li>Client ID: <span className="font-mono">Aci1j-ganF...</span></li>
            <li>Test Amount: <span className="font-mono">$100.00 USD</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}