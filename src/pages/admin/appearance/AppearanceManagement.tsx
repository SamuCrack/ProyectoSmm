import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GripVertical, ShoppingCart, CreditCard, ShoppingBag, Package, Code, Users, Building, Ticket, RefreshCw, FileText, Loader2, Upload, Image, Trash2, Video, Plus, Edit, Youtube } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MenuItem {
  id: number;
  menu_key: string;
  label: string;
  icon_name: string;
  sort_order: number;
  enabled: boolean;
}

interface ImageConfig {
  key: string;
  label: string;
  value: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Package,
  Code,
  Users,
  Building,
  Ticket,
  RefreshCw,
  FileText,
  Video,
};

interface TutorialVideo {
  id: number;
  title: string;
  video_url: string;
  platform: string;
  sort_order: number;
  enabled: boolean;
}

interface SortableMenuItemProps {
  item: MenuItem;
  onToggle: (id: number, enabled: boolean) => void;
}

const SortableMenuItem = ({ item, onToggle }: SortableMenuItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconMap[item.icon_name] || ShoppingCart;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-2 flex-1">
        <div className={`p-2 rounded ${item.enabled ? "bg-primary/10" : "bg-muted"}`}>
          <IconComponent className={`h-4 w-4 ${item.enabled ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <span className={`font-medium ${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>
          {item.label}
        </span>
      </div>

      <Switch
        checked={item.enabled}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
      />
    </div>
  );
};

interface ImageUploaderProps {
  config: ImageConfig;
  onUpload: (key: string, url: string) => void;
  onDelete: (key: string) => void;
  uploading: string | null;
}

const ImageUploader = ({ config, onUpload, onDelete, uploading }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe superar 5MB");
      return;
    }

    const fileName = `${config.key}-${Date.now()}.${file.name.split(".").pop()}`;

    try {
      const { data, error } = await supabase.storage
        .from("appearance")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("appearance")
        .getPublicUrl(data.path);

      onUpload(config.key, publicUrl.publicUrl);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen: " + error.message);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <Label className="font-medium">{config.label}</Label>
      
      {config.value ? (
        <div className="space-y-3">
          <div className="relative w-full max-w-[200px] aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={config.value}
              alt={config.label}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading === config.key}
            >
              {uploading === config.key ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Cambiar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(config.key)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading === config.key ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Image className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click para subir imagen</p>
              <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

const AppearanceManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [imageConfigs, setImageConfigs] = useState<ImageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Tutorial videos state
  const [tutorialVideos, setTutorialVideos] = useState<TutorialVideo[]>([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);
  const [videoForm, setVideoForm] = useState({ title: "", video_url: "", platform: "youtube" });
  const [savingVideo, setSavingVideo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const imageLabels: Record<string, string> = {
    yape_qr_image: "QR de YAPE",
    plin_qr_image: "QR de PLIN",
    binance_qr_image: "QR de BINANCE",
    recargas_info_image: "Imagen de Precios de Recargas",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuResponse, configResponse, videosResponse] = await Promise.all([
        supabase.from("client_menu_config").select("*").order("sort_order", { ascending: true }),
        supabase.from("appearance_config").select("*"),
        supabase.from("tutorial_videos").select("*").order("sort_order", { ascending: true }),
      ]);

      if (menuResponse.error) throw menuResponse.error;
      if (configResponse.error) throw configResponse.error;
      if (videosResponse.error) throw videosResponse.error;

      setMenuItems(menuResponse.data || []);
      setTutorialVideos(videosResponse.data || []);

      // Transform config data
      const configs = (configResponse.data || [])
        .filter((c) => c.config_key.endsWith("_image"))
        .map((c) => ({
          key: c.config_key,
          label: imageLabels[c.config_key] || c.config_key,
          value: c.config_value,
        }));

      setImageConfigs(configs);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  // Tutorial video handlers
  const handleOpenVideoModal = (video?: TutorialVideo) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm({ title: video.title, video_url: video.video_url, platform: video.platform });
    } else {
      setEditingVideo(null);
      setVideoForm({ title: "", video_url: "", platform: "youtube" });
    }
    setVideoModalOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim() || !videoForm.video_url.trim()) {
      toast.error("Título y URL son requeridos");
      return;
    }

    setSavingVideo(true);
    try {
      if (editingVideo) {
        // Update existing
        const { error } = await supabase
          .from("tutorial_videos")
          .update({ title: videoForm.title, video_url: videoForm.video_url, platform: videoForm.platform })
          .eq("id", editingVideo.id);
        if (error) throw error;
        toast.success("Video actualizado");
      } else {
        // Create new - get max sort_order
        const maxSort = tutorialVideos.length > 0 ? Math.max(...tutorialVideos.map(v => v.sort_order)) : -1;
        const { error } = await supabase
          .from("tutorial_videos")
          .insert({ title: videoForm.title, video_url: videoForm.video_url, platform: videoForm.platform, sort_order: maxSort + 1 });
        if (error) throw error;
        toast.success("Video agregado");
      }
      setVideoModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving video:", error);
      toast.error("Error al guardar video");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    try {
      const { error } = await supabase.from("tutorial_videos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Video eliminado");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting video:", error);
      toast.error("Error al eliminar video");
    }
  };

  const handleToggleVideo = async (id: number, enabled: boolean) => {
    try {
      const { error } = await supabase.from("tutorial_videos").update({ enabled }).eq("id", id);
      if (error) throw error;
      setTutorialVideos(prev => prev.map(v => v.id === id ? { ...v, enabled } : v));
      toast.success(enabled ? "Video habilitado" : "Video deshabilitado");
    } catch (error: any) {
      console.error("Error toggling video:", error);
      toast.error("Error al actualizar video");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex((item) => item.id === active.id);
      const newIndex = menuItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(menuItems, oldIndex, newIndex);
      setMenuItems(newItems);

      setSaving(true);
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from("client_menu_config")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);

          if (error) throw error;
        }

        toast.success("Orden actualizado");
      } catch (error: any) {
        console.error("Error updating order:", error);
        toast.error("Error al actualizar el orden");
        fetchData();
      } finally {
        setSaving(false);
      }
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled } : item))
    );

    try {
      const { error } = await supabase
        .from("client_menu_config")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;
      toast.success(enabled ? "Elemento habilitado" : "Elemento deshabilitado");
    } catch (error: any) {
      console.error("Error toggling item:", error);
      toast.error("Error al actualizar el elemento");
      fetchData();
    }
  };

  const handleImageUpload = async (key: string, url: string) => {
    setUploading(key);

    try {
      const { error } = await supabase
        .from("appearance_config")
        .update({ config_value: url })
        .eq("config_key", key);

      if (error) throw error;

      setImageConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value: url } : c))
      );

      toast.success("Imagen actualizada");
    } catch (error: any) {
      console.error("Error updating image:", error);
      toast.error("Error al actualizar la imagen");
    } finally {
      setUploading(null);
    }
  };

  const handleImageDelete = async (key: string) => {
    try {
      const { error } = await supabase
        .from("appearance_config")
        .update({ config_value: null })
        .eq("config_key", key);

      if (error) throw error;

      setImageConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value: null } : c))
      );

      toast.success("Imagen eliminada");
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Apariencia</h2>
        <p className="text-muted-foreground">Personaliza la apariencia del panel de cliente</p>
      </div>

      {/* Menu Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Menú del Cliente
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            Arrastra para reordenar y usa el toggle para mostrar/ocultar elementos del menú lateral del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={menuItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Payment Images Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes de Pago</CardTitle>
          <CardDescription>
            Configura las imágenes QR y de información que se muestran en la sección "Agregar Fondos"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imageConfigs.map((config) => (
              <ImageUploader
                key={config.key}
                config={config}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                uploading={uploading}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Videos Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Videos Tutoriales
              </CardTitle>
              <CardDescription>
                Gestiona los videos que se muestran en la sección "Tutoriales" del panel de cliente
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenVideoModal()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tutorialVideos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay videos configurados</p>
              <p className="text-sm">Agrega videos de YouTube o TikTok para mostrar a tus clientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tutorialVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className={`p-2 rounded ${video.platform === 'youtube' ? 'bg-red-500/10' : 'bg-pink-500/10'}`}>
                    {video.platform === 'youtube' ? (
                      <Youtube className="h-4 w-4 text-red-500" />
                    ) : (
                      <Video className="h-4 w-4 text-pink-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{video.video_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={video.enabled}
                      onCheckedChange={(checked) => handleToggleVideo(video.id, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleOpenVideoModal(video)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteVideo(video.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa del menú</CardTitle>
          <CardDescription>
            Así se verá el menú en el panel del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card border border-border rounded-lg p-2 w-[200px]">
            {menuItems
              .filter((item) => item.enabled)
              .map((item) => {
                const IconComponent = iconMap[item.icon_name] || ShoppingCart;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Editar Video" : "Agregar Video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del Video</Label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Cómo hacer tu primer pedido"
              />
            </div>
            <div className="space-y-2">
              <Label>URL del Video</Label>
              <Input
                value={videoForm.video_url}
                onChange={(e) => setVideoForm(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={videoForm.platform} onValueChange={(value) => setVideoForm(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveVideo} disabled={savingVideo}>
              {savingVideo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingVideo ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppearanceManagement;
