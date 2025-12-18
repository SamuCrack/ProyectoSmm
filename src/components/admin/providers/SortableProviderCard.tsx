import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import ProviderCard from "./ProviderCard";

interface Provider {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
  api_type: string;
  enabled: boolean;
  balance_cached: number | null;
  last_checked: string | null;
  sort_order: number;
}

interface SortableProviderCardProps {
  provider: Provider;
  onUpdate: () => void;
}

const SortableProviderCard = ({ provider, onUpdate }: SortableProviderCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `provider-${provider.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-2 rounded-md hover:bg-muted/50 transition-colors"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="pl-10">
        <ProviderCard provider={provider} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

export default SortableProviderCard;
