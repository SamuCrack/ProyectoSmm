import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface MobilePaymentCardProps {
  payment: {
    id: number;
    user_id: string;
    amount: number;
    payment_method: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  };
  userEmail: string;
  userBalance: number;
}

const MobilePaymentCard = ({ payment, userEmail, userBalance }: MobilePaymentCardProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Completed: "default",
      Pending: "secondary",
      Failed: "destructive",
      Expired: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-3">
        {/* Header: ID + Status */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">#{payment.id}</span>
          {getStatusBadge(payment.status)}
        </div>

        {/* User */}
        <div className="text-sm">
          <span className="text-muted-foreground">Usuario: </span>
          <span className="text-foreground truncate">{userEmail}</span>
        </div>

        {/* Amount + Method */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Monto</span>
            <span className="font-bold text-lg text-primary">${payment.amount.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Método</span>
            <span className="font-medium">{payment.payment_method || "-"}</span>
          </div>
        </div>

        {/* Balance */}
        <div className="text-xs">
          <span className="text-muted-foreground">Balance actual: </span>
          <span className="text-foreground">${userBalance.toFixed(2)}</span>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {payment.notes}
          </div>
        )}

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {format(new Date(payment.created_at), "yyyy-MM-dd HH:mm")}
        </div>
      </div>
    </Card>
  );
};

export default MobilePaymentCard;
