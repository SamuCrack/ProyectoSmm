import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Send,
  Twitch,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Users,
  Heart,
  Share2,
  Eye,
  TrendingUp,
  Radio,
  Camera,
  Video,
  PlayCircle,
  ThumbsUp,
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
  type LucideIcon,
} from "lucide-react";

// Mapeo de nombres a componentes de iconos o URLs de imagen
export const iconMap: Record<string, LucideIcon | string> = {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  TikTok: "/tiktok-icon.png",
  Kick: MonitorPlay,
  Telegram: Send,
  Twitch,
  LinkedIn: Linkedin,
  WhatsApp: MessageCircle,
  Messenger: MessageSquare,
  Spotify: Disc,
  Discord: Gamepad2,
  Snapchat: Ghost,
  Pinterest: Pin,
  Reddit: MessageSquareMore,
  Threads: AtSign,
  Clubhouse: Headphones,
  Vimeo: Film,
  Rumble: Megaphone,
  BeReal: Aperture,
  SoundCloud: Cloud,
  Likee: Sparkles,
  Users,
  Heart,
  Share: Share2,
  Eye,
  Trending: TrendingUp,
  Radio,
  Camera,
  Video,
  Play: PlayCircle,
  Like: ThumbsUp,
  Globe,
  Zap,
  Star,
  Award,
  Bell,
  Bookmark,
  Clock,
  Emoji: Smile,
  Hashtag: Hash,
  Followers: UserPlus,
  Reels: Film,
  Stories: CircleDot,
  Boost: Rocket,
  Verified: BadgeCheck,
  Crown,
  Fire: Flame,
  Gift,
  Money: DollarSign,
  Link,
  Shield,
  Package,
};

// Helper para obtener el componente de icono
export const getIconComponent = (iconName: string | null | undefined): LucideIcon | string | null => {
  if (!iconName) return null;
  return iconMap[iconName] || null;
};

// Helper para renderizar el icono (soporta URLs de imágenes personalizadas)
export const renderIcon = (iconName: string | null | undefined, className?: string) => {
  if (!iconName) return null;
  
  // Si es una URL de imagen (relativa o absoluta), renderizar como <img>
  if (iconName.startsWith('http') || iconName.startsWith('/')) {
    return <img src={iconName} alt="icon" className={className || "w-4 h-4"} />;
  }
  
  // Si no, buscar en iconMap
  const iconValue = iconMap[iconName];
  if (!iconValue) return null;
  
  // Si el valor es una URL, renderizar como <img>
  if (typeof iconValue === 'string') {
    return <img src={iconValue} alt="icon" className={className || "w-4 h-4"} />;
  }
  
  // Si es un componente Lucide, renderizarlo
  const IconComponent = iconValue;
  return <IconComponent className={className || "w-4 h-4"} />;
};
