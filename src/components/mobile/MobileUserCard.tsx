import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Key, Ban, Wallet, ShoppingCart, CreditCard, History, Users, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  whatsapp?: string;
  balance: number;
  custom_discount: number;
  enabled: boolean;
  created_at: string;
  last_auth?: string;
  last_ip?: string;
}

interface MobileUserCardProps {
  user: User;
  onEdit: () => void;
  onChangePassword: () => void;
  onBanIP: () => void;
  onManageBalance: () => void;
  onViewOrders: () => void;
  onViewRecharges: () => void;
  onViewLoginHistory: () => void;
  onViewSameIP: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onCustomRates: () => void;
  actionLoading: boolean;
}

const MobileUserCard = ({
  user,
  onEdit,
  onChangePassword,
  onBanIP,
  onManageBalance,
  onViewOrders,
  onViewRecharges,
  onViewLoginHistory,
  onViewSameIP,
  onToggleStatus,
  onDelete,
  onCustomRates,
  actionLoading,
}: MobileUserCardProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-3">
        {/* Header: Email + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground">@{user.email?.split("@")[0]}</p>
          </div>
          <Badge 
            variant={user.enabled ? "default" : "destructive"}
            className={user.enabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
          >
            {user.enabled ? "Activo" : "Suspendido"}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Balance</span>
            <span className="font-semibold text-primary">${user.balance.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Descuento</span>
            <Badge variant="secondary">{user.custom_discount || 0}%</Badge>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Creado</span>
            <span className="text-xs">{format(new Date(user.created_at), "dd/MM/yyyy")}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Último acceso</span>
            <span className="text-xs">{user.last_auth ? format(new Date(user.last_auth), "dd/MM/yy HH:mm") : "Nunca"}</span>
          </div>
        </div>

        {/* WhatsApp */}
        {user.whatsapp && (
          <div className="text-xs text-muted-foreground">
            WhatsApp: {user.whatsapp}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10"
            onClick={onCustomRates}
          >
            Tarifas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10"
            onClick={onManageBalance}
          >
            <Wallet className="w-4 h-4 mr-1" />
            Balance
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar usuario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onChangePassword}>
                <Key className="mr-2 h-4 w-4" />
                Cambiar contraseña
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBanIP} disabled={actionLoading}>
                <Ban className="mr-2 h-4 w-4" />
                Banear por IP
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onViewOrders}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ver órdenes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewRecharges}>
                <CreditCard className="mr-2 h-4 w-4" />
                Ver recargas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onViewLoginHistory}>
                <History className="mr-2 h-4 w-4" />
                Historial de login
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewSameIP}>
                <Users className="mr-2 h-4 w-4" />
                Usuarios misma IP
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleStatus}>
                {user.enabled ? "Suspender" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default MobileUserCard;
