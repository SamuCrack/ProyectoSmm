import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { format } from "date-fns";

interface MobileAdminOrderCardProps {
  order: any;
  userEmail: string;
  serviceName: string;
  providerName: string | null;
  getStatusBadge: (status: string) => JSX.Element;
  onViewDetails: () => void;
  onRequestCancel: () => void;
  onSetStartCount: () => void;
  onSetPartial: () => void;
  onChangeStatus: () => void;
  onCancelAndRefund: () => void;
  isProcessing: boolean;
}

const MobileAdminOrderCard = ({
  order,
  userEmail,
  serviceName,
  providerName,
  getStatusBadge,
  onViewDetails,
  onRequestCancel,
  onSetStartCount,
  onSetPartial,
  onChangeStatus,
  onCancelAndRefund,
  isProcessing,
}: MobileAdminOrderCardProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-3">
        {/* Header: ID + Status */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">#{order.id}</span>
            {order.external_order_id && (
              <span className="text-xs text-muted-foreground">Ext: {order.external_order_id}</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(order.status)}
            {order.refunded && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                Refunded
              </Badge>
            )}
          </div>
        </div>

        {/* User */}
        <div className="text-sm">
          <span className="text-muted-foreground">Usuario: </span>
          <span className="text-foreground truncate">{userEmail}</span>
        </div>

        {/* Service */}
        <div className="text-sm font-medium text-foreground line-clamp-2">
          {serviceName}
          {providerName && (
            <span className="text-xs text-muted-foreground block">{providerName}</span>
          )}
        </div>

        {/* Link */}
        <div className="text-xs text-primary break-all line-clamp-2">
          <a href={order.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {order.link}
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Cantidad</span>
            <span className="font-semibold">{order.quantity}</span>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Inicio</span>
            <span className="font-semibold">{order.start_count ?? "-"}</span>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Resta</span>
            <span className="font-semibold">{order.remains ?? "-"}</span>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <span className="text-muted-foreground block">Cargo</span>
            <span className="font-semibold">${order.charge_user.toFixed(3)}</span>
          </div>
        </div>

        {/* Date + Mode */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}</span>
          <Badge variant="secondary">{order.mode || "Auto"}</Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10"
            onClick={onViewDetails}
          >
            Detalles
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem 
                onClick={onRequestCancel}
                disabled={!order.external_order_id || isProcessing}
              >
                Request cancel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSetStartCount}>
                Set start count
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSetPartial}>
                Set partial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onChangeStatus}>
                Change status
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onCancelAndRefund}
                className="text-destructive"
                disabled={order.refunded}
              >
                Cancel and refund
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default MobileAdminOrderCard;
