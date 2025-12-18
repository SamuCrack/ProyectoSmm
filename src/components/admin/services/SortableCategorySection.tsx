import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  icon: string | null;
  enabled: boolean;
  sort_order: number;
}

interface Service {
  id: number;
  name: string;
  category_id: number | null;
  service_type: string | null;
  provider_id: number | null;
  provider_service_id: string | null;
  rate_per_1000: number;
  min_qty: number;
  max_qty: number;
  enabled: boolean;
  sync_with_provider: boolean;
  input_type: string | null;
  refill: boolean;
  cancel_allow: boolean;
}

interface SortableCategorySectionProps {
  categoryName: string;
  category: Category;
  services: Service[];
  allSelected: boolean;
  someSelected: boolean;
  selectedServices: number[];
  onSelectAll: (services: Service[], checked: boolean) => void;
  onEditCategory: (category: Category) => void;
  children: React.ReactNode;
}

const SortableCategorySection = ({
  categoryName,
  category,
  services,
  allSelected,
  someSelected,
  selectedServices,
  onSelectAll,
  onEditCategory,
  children,
}: SortableCategorySectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: `category-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "space-y-2 transition-all duration-200 rounded-lg",
        isDragging && "opacity-50 scale-[0.98]",
        isOver && !isDragging && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !category.enabled && "opacity-60"
      )}
    >
      {/* Indicador de posición de drop */}
      {isOver && !isDragging && (
        <div className="h-1 bg-primary rounded-full animate-pulse mx-4" />
      )}
      
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-t-lg border-b select-none transition-colors",
        category.enabled 
          ? "bg-muted/30 border-border" 
          : "bg-destructive/10 border-destructive/20"
      )}>
        {/* Drag handle - área más grande */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-3 hover:bg-muted rounded-lg touch-none flex items-center justify-center transition-colors"
          role="button"
          tabIndex={0}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground pointer-events-none select-none" />
        </div>

        {/* Área interactiva separada del drag */}
        <div className="flex items-center gap-3 flex-1" onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(services, checked as boolean)}
            className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          
          <h3 className={cn(
            "text-lg font-semibold flex-1 pointer-events-none select-none",
            category.enabled ? "text-foreground" : "text-muted-foreground"
          )}>
            {categoryName}
          </h3>
          
          {category.id !== 0 && (
            <Badge 
              variant={category.enabled ? "default" : "destructive"}
              className="text-xs"
            >
              {category.enabled ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Activa
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Deshabilitada
                </>
              )}
            </Badge>
          )}
          
          {category.id !== 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditCategory(category)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default SortableCategorySection;
