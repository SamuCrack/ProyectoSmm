import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const PayPalReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Procesando tu pago...');
  const [details, setDetails] = useState<{
    gross_amount?: number;
    net_amount?: number;
    commission?: number;
    new_balance?: number;
    transaction_id?: string;
  }>({});

  useEffect(() => {
    const executePayment = async () => {
      const token = searchParams.get('token');
      const payerId = searchParams.get('PayerID');

      if (!token || !payerId) {
        setStatus('error');
        setMessage('Pago cancelado o parámetros inválidos');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setStatus('error');
          setMessage('Sesión expirada. Por favor, inicia sesión nuevamente.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('paypal-execute-payment', {
          body: {
            paypal_token: token,
            payer_id: payerId,
          },
        });

        if (error || !data?.success) {
          setStatus('error');
          setMessage(data?.error || error?.message || 'Error al procesar el pago');
          return;
        }

        setStatus('success');
        setMessage('¡Pago completado exitosamente!');
        setDetails({
          gross_amount: data.gross_amount,
          net_amount: data.net_amount,
          commission: data.commission,
          new_balance: data.new_balance,
          transaction_id: data.transaction_id,
        });

      } catch (err: any) {
        console.error('PayPal execute error:', err);
        setStatus('error');
        setMessage(err.message || 'Error inesperado al procesar el pago');
      }
    };

    executePayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-xl font-semibold mb-2">Procesando Pago</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-xl font-semibold mb-2 text-green-600">{message}</h1>
            
            <div className="bg-muted rounded-lg p-4 mt-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto pagado:</span>
                <span className="font-medium">${details.gross_amount?.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comisión (5%):</span>
                <span className="text-red-500">-${details.commission?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Saldo acreditado:</span>
                <span className="font-bold text-green-600">${details.net_amount?.toFixed(2)} USD</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-muted-foreground">Nuevo balance:</span>
                <span className="font-bold">${details.new_balance?.toFixed(2)} USD</span>
              </div>
              {details.transaction_id && (
                <div className="text-xs text-muted-foreground mt-2">
                  ID: {details.transaction_id}
                </div>
              )}
            </div>

            <Button 
              className="mt-6 w-full" 
              onClick={() => navigate('/client/dashboard?tab=agregar-fondos')}
            >
              Volver al Dashboard
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-semibold mb-2 text-red-600">Error en el Pago</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/client/dashboard?tab=agregar-fondos')}
              >
                Intentar de nuevo
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/client/dashboard')}
              >
                Volver al Dashboard
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PayPalReturn;
