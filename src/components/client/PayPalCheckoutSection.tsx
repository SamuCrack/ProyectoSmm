import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PayPalCheckoutSection = () => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const grossAmount = parseFloat(amount) || 0;
  const commission = grossAmount * 0.05;
  const netAmount = grossAmount - commission;

  const handlePayPalCheckout = async () => {
    if (grossAmount < 5) {
      toast.error("El monto mínimo es $5 USD");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Por favor, inicia sesión nuevamente");
        setIsProcessing(false);
        return;
      }

      const baseUrl = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('paypal-set-checkout', {
        body: {
          amount: grossAmount,
          return_url: `${baseUrl}/client/paypal-return`,
          cancel_url: `${baseUrl}/client/dashboard?tab=agregar-fondos`,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || error?.message || "Error al iniciar PayPal");
        setIsProcessing(false);
        return;
      }

      // Redirect to PayPal
      window.location.href = data.redirect_url;

    } catch (err: any) {
      console.error("PayPal checkout error:", err);
      toast.error("Error inesperado al procesar PayPal");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <p className="text-sm text-muted-foreground mb-4">
        Recarga automática por PayPal - Mínimo $5 USD
      </p>
      
      <div className="space-y-4 w-full max-w-md">
        <div>
          <Label htmlFor="paypal-amount">Monto a pagar (USD)</Label>
          <Input 
            id="paypal-amount" 
            type="number" 
            placeholder="Ej: 10.00" 
            min="5" 
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
            disabled={isProcessing}
          />
        </div>
        
        {grossAmount >= 5 && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagas:</span>
              <span className="font-medium">${grossAmount.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comisión (5%):</span>
              <span className="text-red-500">-${commission.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium">Recibes:</span>
              <span className="font-bold text-green-600">${netAmount.toFixed(2)} USD</span>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full" 
          onClick={handlePayPalCheckout}
          disabled={isProcessing || grossAmount < 5}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Conectando con PayPal...
            </>
          ) : (
            "Pagar con PayPal"
          )}
        </Button>

        {grossAmount > 0 && grossAmount < 5 && (
          <p className="text-xs text-red-500 text-center">
            El monto mínimo es $5 USD
          </p>
        )}
      </div>
    </div>
  );
};

export default PayPalCheckoutSection;
