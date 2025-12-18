import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  Users,
  Heart,
  Share2,
  Eye,
  TrendingUp,
  Radio,
  Twitch,
  Camera,
  Video,
  PlayCircle,
  ThumbsUp,
  Send,
  Linkedin,
  MessageSquare,
  Globe,
  Zap,
  Star,
  Award,
  Bell,
  Bookmark,
  Clock,
  Smile,
  Hash,
  Disc,
  Gamepad2,
  Ghost,
  Clapperboard,
  MonitorPlay,
  Pin,
  MessageSquareMore,
  AtSign,
  Headphones,
  Film,
  Megaphone,
  Aperture,
  Sparkles,
  Cloud,
  UserPlus,
  CircleDot,
  Rocket,
  BadgeCheck,
  Crown,
  Flame,
  Gift,
  DollarSign,
  Link,
  Shield,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const socialIcons = [
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
  { name: "Twitter", icon: Twitter },
  { name: "Youtube", icon: Youtube },
  { name: "TikTok", icon: "/tiktok-icon.png" },
  { name: "Kick", icon: MonitorPlay },
  { name: "Telegram", icon: Send },
  { name: "Twitch", icon: Twitch },
  { name: "LinkedIn", icon: Linkedin },
  { name: "WhatsApp", icon: MessageCircle },
  { name: "Messenger", icon: MessageSquare },
  { name: "Spotify", icon: Disc },
  { name: "Discord", icon: Gamepad2 },
  { name: "Snapchat", icon: Ghost },
  { name: "Pinterest", icon: Pin },
  { name: "Reddit", icon: MessageSquareMore },
  { name: "Threads", icon: AtSign },
  { name: "Clubhouse", icon: Headphones },
  { name: "Vimeo", icon: Film },
  { name: "Rumble", icon: Megaphone },
  { name: "BeReal", icon: Aperture },
  { name: "SoundCloud", icon: Cloud },
  { name: "Likee", icon: Sparkles },
];

const generalIcons = [
  { name: "Users", icon: Users },
  { name: "Heart", icon: Heart },
  { name: "Share", icon: Share2 },
  { name: "Eye", icon: Eye },
  { name: "Trending", icon: TrendingUp },
  { name: "Radio", icon: Radio },
  { name: "Camera", icon: Camera },
  { name: "Video", icon: Video },
  { name: "Play", icon: PlayCircle },
  { name: "Like", icon: ThumbsUp },
  { name: "Globe", icon: Globe },
  { name: "Zap", icon: Zap },
  { name: "Star", icon: Star },
  { name: "Award", icon: Award },
  { name: "Bell", icon: Bell },
  { name: "Bookmark", icon: Bookmark },
  { name: "Clock", icon: Clock },
  { name: "Emoji", icon: Smile },
  { name: "Hashtag", icon: Hash },
  { name: "Followers", icon: UserPlus },
  { name: "Reels", icon: Film },
  { name: "Stories", icon: CircleDot },
  { name: "Boost", icon: Rocket },
  { name: "Verified", icon: BadgeCheck },
  { name: "Crown", icon: Crown },
  { name: "Fire", icon: Flame },
  { name: "Gift", icon: Gift },
  { name: "Money", icon: DollarSign },
  { name: "Link", icon: Link },
  { name: "Shield", icon: Shield },
  { name: "Package", icon: Package },
];

interface IconSelectorProps {
  selectedIcon: string | null;
  onSelectIcon: (iconName: string) => void;
}

export const IconSelector = ({ selectedIcon, onSelectIcon }: IconSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomIcon = selectedIcon?.startsWith('http');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Usa PNG, JPG, SVG o WebP.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-icon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('appearance')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('appearance')
        .getPublicUrl(fileName);

      onSelectIcon(publicUrl);
      toast.success("Icono subido correctamente");
    } catch (error: any) {
      console.error('Error uploading icon:', error);
      toast.error("Error al subir el icono");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCustomIcon = () => {
    onSelectIcon('');
  };

  const filteredSocialIcons = socialIcons.filter((icon) =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGeneralIcons = generalIcons.filter((icon) =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const IconButton = ({ name, icon: IconOrUrl }: { name: string; icon: any }) => (
    <button
      type="button"
      onClick={() => onSelectIcon(name)}
      className={cn(
        "p-3 rounded-md border border-border hover:bg-muted transition-colors flex items-center justify-center",
        selectedIcon === name && "bg-primary/10 border-primary"
      )}
      title={name}
    >
      {typeof IconOrUrl === 'string' ? (
        <img src={IconOrUrl} alt={name} className="w-5 h-5 object-contain" />
      ) : (
        <IconOrUrl className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      <Label>Icon</Label>
      <Input
        placeholder="Search icons..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Tabs defaultValue={isCustomIcon ? "custom" : "social"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="custom">Personalizado</TabsTrigger>
        </TabsList>
        <TabsContent value="social" className="mt-3">
          <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto p-1">
            {filteredSocialIcons.map((icon) => (
              <IconButton key={icon.name} name={icon.name} icon={icon.icon} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="general" className="mt-3">
          <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto p-1">
            {filteredGeneralIcons.map((icon) => (
              <IconButton key={icon.name} name={icon.name} icon={icon.icon} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="custom" className="mt-3">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isCustomIcon ? (
              <div className="space-y-3">
                <img 
                  src={selectedIcon} 
                  alt="Custom icon" 
                  className="w-16 h-16 mx-auto object-contain rounded-md border border-border"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cambiar"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveCustomIcon}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:bg-muted/50 rounded-lg p-4 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                )}
                <p className="mt-2 text-sm font-medium">Click para subir imagen</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP hasta 5MB</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
