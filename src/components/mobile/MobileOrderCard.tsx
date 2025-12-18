import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MobileOrderCardProps {
  order: any;
  onCancel: (orderId: number) => void;
  onRefill: (orderId: number) => void;
  cancelingOrderId: number | null;
  getStatusColor: (status: string) => string;
}

const MobileOrderCard = ({ 
  order, 
  onCancel, 
  onRefill, 
  cancelingOrderId,
  getStatusColor 
}: MobileOrderCardProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-3">
        {/* Header: ID + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">#{order.id}</span>
            <span className="text-xs text-muted-foreground">ID: {order.service_id}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn("font-medium text-xs", getStatusColor(order.status))} variant="outline">
              {order.status}
            </Badge>
            {order.refunded && order.refund_amount && (
              <span className="text-xs text-green-500">
                Refund: ${Number(order.refund_amount).toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {/* Service Name */}
        <div className="text-sm font-medium text-foreground line-clamp-2">
          {order.services?.name || "Servicio desconocido"}
        </div>

        {/* Link */}
        <a 
          href={order.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline break-all line-clamp-2 block"
        >
          {order.link}
        </a>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Cantidad</span>
            <span className="font-semibold">{order.quantity.toLocaleString()}</span>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Inicio</span>
            <span className="font-semibold">{order.start_count ?? "-"}</span>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Costo</span>
            <span className="font-semibold text-primary">${Number(order.charge_user).toFixed(4)}</span>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {order.services?.refill && order.status === "Completed" && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onRefill(order.id)} 
              className="flex-1 h-10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refill
            </Button>
          )}
          
          {order.services?.cancel_allow && (
            order.cancel_requested_at ? (
              <Badge 
                variant="outline" 
                className={cn("flex-1 justify-center h-10 text-xs",
                  order.status === "Canceled" 
                    ? "bg-red-500/10 text-red-500 border-red-500/20" 
                    : order.status === "Partial"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}
              >
                {order.status === "Canceled" ? "Cancelado" : order.status === "Partial" ? "Parcial" : "Cancel solicitado"}
              </Badge>
            ) : (
              order.status === "Pending" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onCancel(order.id)} 
                  disabled={cancelingOrderId === order.id}
                  className="flex-1 h-10 text-destructive hover:text-destructive"
                >
                  {cancelingOrderId === order.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar"
                  )}
                </Button>
              )
            )
          )}
        </div>
      </div>
    </Card>
  );
};

export default MobileOrderCard;
