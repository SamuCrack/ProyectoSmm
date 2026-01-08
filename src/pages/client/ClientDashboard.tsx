import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import recargasInfo from "@/assets/recargas-info.jpg";
import yapeQR from "@/assets/yape-qr.jpg";
import plinQR from "@/assets/plin-qr.jpg";
import binanceQR from "@/assets/binance-qr.jpg";
import marketxpressLogo from "@/assets/marketxpress-logo.png";
import { ShoppingCart, Wallet, Package, LogOut, Plus, Search, Bell, User, ChevronDown, Home, CreditCard, ShoppingBag, Code, Users, Building, Ticket, RefreshCw, FileText, Calendar as CalendarIcon, Filter, CheckCircle, Loader2, MoreHorizontal, Send, Instagram, Youtube, Facebook, Twitter, MessageCircle, Music, Video, Menu, Settings, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { renderIcon } from "@/lib/iconUtils";
import UserRechargesModal from "@/components/admin/users/UserRechargesModal";
import MobileOrderCard from "@/components/mobile/MobileOrderCard";
import PayPalCheckoutSection from "@/components/client/PayPalCheckoutSection";
// Icon map for dynamic menu items
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
  Settings,
  MessageCircle,
};

const ClientDashboard = () => {
  useAuthGuard('user');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    accountStatus: "Regular"
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [customRates, setCustomRates] = useState<Record<number, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionModal, setDescriptionModal] = useState<{
    open: boolean;
    service: any | null;
  }>({ open: false, service: null });
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    open: boolean;
    orderId: number | null;
    serviceName: string;
    link: string;
    quantity: number;
    charge: number;
    newBalance: number;
  }>({ open: false, orderId: null, serviceName: "", link: "", quantity: 0, charge: 0, newBalance: 0 });
  const orderFormRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>(searchParams.get("tab") || "nueva-orden");
  const [menuConfig, setMenuConfig] = useState<any[]>([]);
  const [paymentImages, setPaymentImages] = useState<Record<string, string | null>>({});
  const [socialFilter, setSocialFilter] = useState<string | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState("nuevo");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [bulkOrderText, setBulkOrderText] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Account settings states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ tab: section });
  };

  // Orders history states
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [orderSearchText, setOrderSearchText] = useState<string>("");
  const [orderPlatformFilter, setOrderPlatformFilter] = useState<string>("all");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);

  // Recharges modal state
  const [showRechargesModal, setShowRechargesModal] = useState(false);

  // Service updates states
  const [serviceUpdates, setServiceUpdates] = useState<any[]>([]);
  const [updatesFilter, setUpdatesFilter] = useState("all");
  const [updatesSearch, setUpdatesSearch] = useState("");
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Tutorial videos states
  const [tutorialVideos, setTutorialVideos] = useState<any[]>([]);
  const [tutorialFilter, setTutorialFilter] = useState<string>("all");
  const [loadingTutorials, setLoadingTutorials] = useState(false);

  // Filtered updates based on search
  const filteredUpdates = serviceUpdates.filter(update => {
    if (!updatesSearch.trim()) return true;
    const search = updatesSearch.toLowerCase();
    return (
      update.service_name.toLowerCase().includes(search) ||
      update.service_id.toString().includes(search)
    );
  });

  // Fetch menu configuration
  const fetchMenuConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("client_menu_config")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setMenuConfig(data || []);
    } catch (error) {
      console.error("Error fetching menu config:", error);
    }
  };

  // Fetch payment images configuration
  const fetchPaymentImages = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_config")
        .select("config_key, config_value")
        .in("config_key", ["yape_qr_image", "plin_qr_image", "binance_qr_image", "recargas_info_image"]);

      if (error) throw error;

      const images: Record<string, string | null> = {};
      data?.forEach((item) => {
        images[item.config_key] = item.config_value;
      });
      setPaymentImages(images);
    } catch (error) {
      console.error("Error fetching payment images:", error);
    }
  };

  // Fetch service updates
  const fetchServiceUpdates = async () => {
    try {
      setLoadingUpdates(true);
      let query = supabase
        .from('service_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (updatesFilter !== 'all') {
        query = query.eq('update_type', updatesFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setServiceUpdates(data || []);
    } catch (error) {
      console.error("Error fetching service updates:", error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  // Fetch tutorial videos
  const fetchTutorialVideos = async () => {
    try {
      setLoadingTutorials(true);
      let query = supabase
        .from('tutorial_videos')
        .select('*')
        .eq('enabled', true)
        .order('sort_order', { ascending: true });
      
      if (tutorialFilter !== 'all') {
        query = query.eq('platform', tutorialFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setTutorialVideos(data || []);
    } catch (error) {
      console.error("Error fetching tutorial videos:", error);
    } finally {
      setLoadingTutorials(false);
    }
  };

  // Helper to extract YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Helper to extract TikTok embed URL
  const getTikTokEmbedUrl = (url: string) => {
    // TikTok embed requires video ID extraction
    const match = url.match(/\/video\/(\d+)/);
    return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : url;
  };

  useEffect(() => {
    fetchUserData();
    fetchCategories();
    fetchCustomRates();
    fetchMenuConfig();
    fetchPaymentImages();
  }, []);
  useEffect(() => {
    if (activeSection === "ordenes") {
      fetchOrders();
    }
    if (activeSection === "actualizaciones") {
      fetchServiceUpdates();
    }
    if (activeSection === "tutoriales") {
      fetchTutorialVideos();
    }
  }, [activeSection, updatesFilter, tutorialFilter]);
  useEffect(() => {
    filterOrders();
  }, [orders, orderStatusFilter, dateFrom, dateTo, orderSearchText, orderPlatformFilter, categories]);
  useEffect(() => {
    if (selectedCategory) {
      fetchServicesByCategory(selectedCategory).then(() => {
        // Si hay un servicio pendiente, seleccionarlo después de cargar
        if (pendingServiceId) {
          setSelectedService(pendingServiceId);
          setPendingServiceId(null);
        }
      });
    }
  }, [selectedCategory]);
  useEffect(() => {
    if (selectedService) {
      fetchServiceInfo(selectedService);
    } else {
      setServiceInfo(null);
    }
  }, [selectedService]);
  const fetchUserData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const email = user.email || "";
        setUserName(email.split('@')[0]);
        const {
          data: profile
        } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
        if (profile) {
          setBalance(Number(profile.balance));
        }

        // Fetch orders stats
        const {
          data: orders
        } = await supabase.from("orders").select("charge_user").eq("user_id", user.id);
        if (orders) {
          setStats({
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + order.charge_user, 0),
            accountStatus: "Regular"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };
  // Compute categories that have at least one active service
  const categoriesWithServices = categories.filter(category => 
    allServices.some(s => s.category_id === category.id)
  );

  const fetchCategories = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      console.log("🔍 [DEBUG] Current user ID:", user.id);
      console.log("🔍 [DEBUG] Current user email:", user.email);

      // Fetch all enabled categories
      const {
        data: allCategories,
        error: categoriesError
      } = await supabase.from("service_categories").select("*").eq("enabled", true).order("sort_order", {
        ascending: true
      });
      if (categoriesError) throw categoriesError;
      console.log("🔍 [DEBUG] All enabled categories:", allCategories?.map(c => ({
        id: c.id,
        name: c.name
      })));

      // Fetch category IDs that have access restrictions using the security definer function
      const {
        data: restrictedCategories,
        error: restrictedError
      } = await supabase.rpc("get_restricted_category_ids");
      if (restrictedError) throw restrictedError;

      // Get unique category IDs that have access restrictions
      const restrictedCategoryIds = new Set(restrictedCategories?.map(r => r.category_id) || []);
      console.log("🔍 [DEBUG] Categories with restrictions:", Array.from(restrictedCategoryIds));

      // Fetch categories the current user has explicit access to
      const {
        data: userAccess,
        error: userAccessError
      } = await supabase.from("category_user_access").select("category_id").eq("user_id", user.id);
      if (userAccessError) throw userAccessError;
      const userAccessCategoryIds = new Set(userAccess?.map(a => a.category_id) || []);
      console.log("🔍 [DEBUG] Categories user has access to:", Array.from(userAccessCategoryIds));

      // Filter categories:
      // - Show if category has NO restrictions (not in restrictedCategoryIds)
      // - OR show if category is restricted BUT user has explicit access
      const filteredCategories = allCategories?.filter(cat => {
        const hasRestrictions = restrictedCategoryIds.has(cat.id);
        const userHasAccess = userAccessCategoryIds.has(cat.id);
        const shouldShow = !hasRestrictions || userHasAccess;
        console.log(`🔍 [DEBUG] Category "${cat.name}" (ID: ${cat.id}): hasRestrictions=${hasRestrictions}, userHasAccess=${userHasAccess}, shouldShow=${shouldShow}`);

        // If no restrictions, show to everyone
        if (!hasRestrictions) return true;

        // If has restrictions, only show if user has explicit access
        return userHasAccess;
      }) || [];
      console.log("🔍 [DEBUG] Final filtered categories:", filteredCategories.map(c => ({
        id: c.id,
        name: c.name
      })));
      setCategories(filteredCategories);

      // Fetch all services for all visible categories
      if (filteredCategories && filteredCategories.length > 0) {
        const categoryIds = filteredCategories.map((c: any) => c.id);
        const {
          data: allServicesData,
          error: servicesError
        } = await supabase.from("services").select("*").in("category_id", categoryIds).eq("enabled", true).order("service_sort", {
          ascending: true
        });
        if (servicesError) throw servicesError;
        console.log("🔍 [DEBUG] All services loaded:", allServicesData?.length);
        setAllServices(allServicesData || []);
        
        // Auto-select first category that has services
        const firstCategoryWithServices = filteredCategories.find(cat => 
          allServicesData?.some(s => s.category_id === cat.id)
        );
        if (firstCategoryWithServices && !selectedCategory) {
          setSelectedCategory(firstCategoryWithServices.id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error al cargar categorías");
    }
  };
  const fetchCustomRates = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from("pricing_rules").select("service_id, custom_rate").eq("user_id", user.id);
      if (error) throw error;
      const ratesMap: Record<number, number> = {};
      data?.forEach(rate => {
        ratesMap[rate.service_id] = rate.custom_rate;
      });
      setCustomRates(ratesMap);
    } catch (error) {
      console.error("Error fetching custom rates:", error);
    }
  };
  const getServiceRate = (service: any) => {
    return customRates[service.id] || service.rate_per_1000;
  };
  const fetchServicesByCategory = async (categoryId: string): Promise<void> => {
    try {
      const {
        data,
        error
      } = await supabase.from("services").select("*").eq("category_id", parseInt(categoryId)).eq("enabled", true).order("service_sort", {
        ascending: true
      });
      if (error) throw error;
      setServices(data || []);
      // Auto-select first service if no pending service
      if (!pendingServiceId && data && data.length > 0) {
        setSelectedService(data[0].id.toString());
      } else if (!pendingServiceId) {
        setSelectedService("");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar servicios");
    }
  };
  const fetchServiceInfo = async (serviceId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("services").select("*").eq("id", parseInt(serviceId)).single();
      if (error) throw error;
      setServiceInfo(data);
    } catch (error) {
      console.error("Error fetching service info:", error);
      toast.error("Error al cargar información del servicio");
    }
  };
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from("orders").select(`
          *,
          services (
            name,
            cancel_allow,
            refill,
            category_id
          )
        `).eq("user_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoadingOrders(false);
    }
  };
  const handleCancelOrder = async (orderId: number) => {
    try {
      setCancelingOrderId(orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order?.external_order_id) {
        toast.error("Esta orden no puede ser cancelada");
        return;
      }

      // Check if order can be canceled (Pending only - provider restriction)
      if (order.status !== "Pending") {
        toast.error("Solo se pueden cancelar órdenes en estado Pending.");
        return;
      }

      // Check if cancel was already requested
      if (order.cancel_requested_at) {
        toast.error("Ya se solicitó la cancelación de esta orden.");
        return;
      }
      
      const {
        data,
        error
      } = await supabase.functions.invoke("provider-cancel-order", {
        body: {
          provider_id: order.provider_id,
          order_id: order.id
        }
      });
      if (error) throw error;
      if (data.success) {
        toast.success("Cancelación solicitada. El reembolso se procesará cuando el proveedor confirme.");
        fetchOrders();
      } else {
        toast.error(data.error || "No se pudo cancelar la orden");
        fetchOrders(); // Refresh to show current status
      }
    } catch (error: any) {
      console.error("Error canceling order:", error);
      toast.error("Error al cancelar la orden");
      fetchOrders(); // Refresh to show current status
    } finally {
      setCancelingOrderId(null);
    }
  };
  const handleRefillOrder = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order?.external_order_id) {
        toast.error("Esta orden no puede ser refilleada");
        return;
      }
      const {
        data,
        error
      } = await supabase.functions.invoke("provider-refill-order", {
        body: {
          provider_id: order.provider_id,
          order_id: order.id
        }
      });
      if (error) throw error;
      if (data.success) {
        toast.success(`Refill creado exitosamente. ID: ${data.refill_id}`);
        fetchOrders();
      } else {
        toast.error(data.error || "No se pudo crear el refill");
      }
    } catch (error: any) {
      console.error("Error creating refill:", error);
      toast.error("Error al crear el refill");
    }
  };

  // Handle bulk order submission
  const handleBulkSubmit = async () => {
    if (!bulkOrderText.trim() || !userId) return;
    
    setIsBulkSubmitting(true);
    const lines = bulkOrderText.trim().split('\n').filter(line => line.trim());
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      
      if (parts.length !== 3) {
        errorCount++;
        errors.push(`Línea inválida: "${line}" - Debe tener 3 campos separados por |`);
        continue;
      }
      
      const [serviceId, orderLink, orderQuantity] = parts;
      const service = allServices.find(s => s.id.toString() === serviceId);
      
      if (!service) {
        errorCount++;
        errors.push(`Servicio #${serviceId} no encontrado`);
        continue;
      }
      
      const qty = parseInt(orderQuantity);
      if (isNaN(qty) || qty < service.min_qty || qty > service.max_qty) {
        errorCount++;
        errors.push(`Cantidad inválida para servicio #${serviceId} (Min: ${service.min_qty}, Max: ${service.max_qty})`);
        continue;
      }
      
      // Crear la orden llamando al edge function
      try {
        const { data, error } = await supabase.functions.invoke('client-create-order', {
          body: {
            user_id: userId,
            service_id: service.id,
            link: orderLink,
            quantity: qty
          }
        });
        
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`Error en servicio #${serviceId}: ${err.message}`);
      }
    }
    
    // Refrescar datos
    await fetchUserData();
    if (activeSection === "ordenes") {
      await fetchOrders();
    }
    
    // Mostrar resumen
    if (successCount > 0 && errorCount === 0) {
      toast.success(`✅ ${successCount} órdenes creadas exitosamente`);
      setBulkOrderText("");
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`${successCount} órdenes creadas, ${errorCount} errores`);
      console.error("Bulk order errors:", errors);
    } else {
      toast.error(`Error: ${errorCount} órdenes fallaron`);
      console.error("Bulk order errors:", errors);
    }
    
    setIsBulkSubmitting(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by text search
    if (orderSearchText.trim()) {
      const searchLower = orderSearchText.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchLower) ||
        order.link.toLowerCase().includes(searchLower) ||
        (order.services?.name || "").toLowerCase().includes(searchLower) ||
        order.service_id.toString().includes(searchLower)
      );
    }

    // Filter by platform
    if (orderPlatformFilter !== "all") {
      filtered = filtered.filter(order => {
        const categoryId = order.services?.category_id;
        if (!categoryId) return false;
        const category = categories.find(c => c.id === categoryId);
        return category?.name?.toLowerCase().includes(orderPlatformFilter.toLowerCase());
      });
    }

    // Filter by status
    if (orderStatusFilter !== "all") {
      filtered = filtered.filter(order => order.status === orderStatusFilter);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(order => new Date(order.created_at) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= endOfDay);
    }
    setFilteredOrders(filtered);
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "in progress":
        return "default";
      case "completed":
        return "default";
      case "partial":
        return "default";
      case "canceled":
        return "destructive";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "partial":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "canceled":
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };
  const handleBuyNow = async (service: any) => {
    // Cambiar a la sección de nueva orden
    handleSectionChange("nueva-orden");

    // Establecer la categoría y el servicio pendiente
    const categoryId = service.category_id?.toString() || "";
    setSelectedCategory(categoryId);
    setPendingServiceId(service.id.toString());

    // Limpiar campos
    setLink("");
    setQuantity("");

    // Scroll al formulario
    setTimeout(() => {
      orderFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 200);
    toast.success(`Servicio "${service.name}" seleccionado. Completa el link y la cantidad.`);
  };
  const handleShowDescription = (service: any) => {
    setDescriptionModal({
      open: true,
      service
    });
  };
  const calculateTotal = () => {
    if (!serviceInfo || !quantity) return "0.00000";
    const qty = parseInt(quantity);
    const rate = getServiceRate(serviceInfo);
    return (rate * qty / 1000).toFixed(5);
  };
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validaciones
      if (!selectedService || !link || !quantity) {
        toast.error("Por favor completa todos los campos");
        return;
      }
      const qty = parseInt(quantity);
      if (!serviceInfo || qty < serviceInfo.min_qty || qty > serviceInfo.max_qty) {
        toast.error(`La cantidad debe estar entre ${serviceInfo?.min_qty} y ${serviceInfo?.max_qty}`);
        return;
      }
      const totalCost = parseFloat(calculateTotal());

      // Verificar saldo suficiente
      if (balance < totalCost) {
        toast.error("Saldo insuficiente para realizar esta orden");
        return;
      }

      // Validate link length (input validation)
      const trimmedLink = link.trim();
      if (trimmedLink.length > 500) {
        toast.error("El link es demasiado largo (máximo 500 caracteres)");
        return;
      }

      // Call secure edge function for atomic order creation
      // This fixes both: input validation and client-side balance updates
      const {
        data,
        error
      } = await supabase.functions.invoke('client-create-order', {
        body: {
          service_id: parseInt(selectedService),
          link: trimmedLink,
          quantity: qty
        }
      });
      if (error) {
        throw new Error(error.message || 'Error al crear la orden');
      }
      if (data.error) {
        throw new Error(data.error);
      }

      // Update local balance
      setBalance(data.new_balance);
      
      // Show success modal instead of toast
      setOrderSuccessModal({
        open: true,
        orderId: data.order_id,
        serviceName: serviceInfo?.name || "",
        link: trimmedLink,
        quantity: qty,
        charge: totalCost,
        newBalance: data.new_balance
      });

      // Limpiar formulario
      setLink("");
      setQuantity("");
      setSelectedService("");
      setSelectedCategory("");
      setServiceInfo(null);

      // Actualizar estadísticas
      setStats({
        totalOrders: stats.totalOrders + 1,
        totalSpent: stats.totalSpent + totalCost,
        accountStatus: "Regular"
      });
    } catch (error: any) {
      console.error("Error al crear la orden:", error);
      toast.error("Error al crear la orden: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle username change
  const handleUsernameChange = async () => {
    if (isUpdatingUsername) return;
    
    try {
      setIsUpdatingUsername(true);
      
      const trimmedUsername = newUsername.trim();
      
      // Validate format
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmedUsername)) {
        toast.error("El username debe tener 3-30 caracteres alfanuméricos o guión bajo");
        return;
      }
      
      // Check uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .neq("id", userId)
        .maybeSingle();
        
      if (existing) {
        toast.error("Este nombre de usuario ya está en uso");
        return;
      }
      
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmedUsername })
        .eq("id", userId);
        
      if (error) throw error;
      
      setUserName(trimmedUsername);
      setNewUsername("");
      toast.success("Username actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating username:", error);
      toast.error("Error al actualizar username: " + error.message);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (isUpdatingPassword) return;
    
    try {
      setIsUpdatingPassword(true);
      
      if (newPassword.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada exitosamente");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Error al actualizar contraseña: " + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Default sidebar items as fallback
  const defaultSidebarItems = [
    { icon: ShoppingCart, label: "Nueva Orden", section: "nueva-orden" },
    { icon: CreditCard, label: "Agregar Fondos", section: "agregar-fondos" },
    { icon: ShoppingBag, label: "Servicios", section: "servicios" },
    { icon: Package, label: "Ordenes", section: "ordenes" },
    { icon: Code, label: "API", section: "api" },
    { icon: Users, label: "Afiliados", section: "afiliados" },
    { icon: Building, label: "Arrendar Panel", section: "arrendar-panel" },
    { icon: Ticket, label: "Tickets", section: "tickets" },
    { icon: RefreshCw, label: "Actualizaciones", section: "actualizaciones" },
    { icon: FileText, label: "Blog", section: "blog" },
    { icon: Settings, label: "Mi Cuenta", section: "cuenta" },
  ];

  // Use menu config from database if available, otherwise use default
  const sidebarItems = menuConfig.length > 0
    ? menuConfig.map((item) => ({
        icon: iconMap[item.icon_name] || ShoppingCart,
        label: item.label,
        section: item.menu_key,
        externalUrl: item.external_url || null,
      }))
    : defaultSidebarItems.map(item => ({ ...item, externalUrl: null }));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="px-1 py-4 border-b border-border">
            <img 
              src={marketxpressLogo} 
              alt="MarketXpress" 
              className="w-full h-auto scale-110 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => { setActiveSection("nueva-orden"); setMobileMenuOpen(false); }}
            />
          </div>
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">Mi Cuenta</p>
                <p className="text-xs text-muted-foreground truncate">{userName}</p>
              </div>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <nav className="py-2">
              {sidebarItems.map(item => (
                <button 
                  key={item.label} 
                  onClick={() => {
                    if (item.externalUrl) {
                      window.open(item.externalUrl, '_blank');
                    } else {
                      handleSectionChange(item.section);
                    }
                    setMobileMenuOpen(false);
                  }} 
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${activeSection === item.section && !item.externalUrl ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[180px] bg-card border-r border-border flex-col">
        {/* Logo */}
        <div className="px-1 py-4 border-b border-border">
          <img 
            src={marketxpressLogo} 
            alt="MarketXpress" 
            className="w-full h-auto scale-110 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setActiveSection("nueva-orden")}
          />
        </div>

        {/* User Info */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Mi Cuenta</p>
              <p className="text-xs text-muted-foreground truncate">{userName}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {sidebarItems.map(item => (
            <button 
              key={item.label} 
              onClick={() => {
                if (item.externalUrl) {
                  window.open(item.externalUrl, '_blank');
                } else {
                  handleSectionChange(item.section);
                }
              }} 
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activeSection === item.section && !item.externalUrl ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base md:text-lg font-bold text-foreground">
                  {sidebarItems.find(i => i.section === activeSection)?.label || "Dashboard"}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Place your order</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm" className="gap-1 md:gap-2 hover:bg-accent transition-colors text-xs md:text-sm px-2 md:px-3" onClick={() => handleSectionChange("agregar-fondos")} title="Click para agregar fondos">
                <Wallet className="h-4 w-4" />
                <span className="font-semibold">${balance.toFixed(2)}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div> : <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 1. Saldo Actual */}
                <Card className="bg-card border-border">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-success" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Saldo Actual</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">${balance.toFixed(2)}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => handleSectionChange("agregar-fondos")}>
                      Agregar Fondos
                    </Button>
                  </div>
                </Card>

                {/* 2. Balance Gastado */}
                <Card className="bg-card border-border">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-secondary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Balance Gastado</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">${stats.totalSpent.toFixed(2)}</p>
                  </div>
                </Card>

                {/* 3. Órdenes Totales */}
                <Card className="bg-card border-border">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Órdenes Totales</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => handleSectionChange("ordenes")}>
                      Mis Órdenes
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Social Network Quick Filter - Only show in Nueva Orden tab */}
              {activeSection === "nueva-orden" && (
                <div className="flex items-center justify-start md:justify-center gap-1 sm:gap-2 mb-6 p-2 sm:p-3 bg-card rounded-lg border border-border overflow-x-auto">
                  <Button
                    variant={socialFilter === null ? "default" : "ghost"}
                    size="icon"
                    className="h-10 w-10 min-w-10 rounded-full"
                    onClick={() => {
                      setSocialFilter(null);
                      setSelectedCategory("");
                      setSelectedService("");
                      setServices([]);
                      setServiceInfo(null);
                    }}
                    title="Todos los servicios"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                  
                  {[
                    { name: "Telegram", icon: Send, colorClass: "text-blue-400" },
                    { name: "Instagram", icon: Instagram, colorClass: "text-pink-500" },
                    { name: "Youtube", icon: Youtube, colorClass: "text-red-500" },
                    { name: "Facebook", icon: Facebook, colorClass: "text-blue-600" },
                    { name: "WhatsApp", icon: MessageCircle, colorClass: "text-green-500" },
                    { name: "TikTok", icon: "/tiktok-icon.png", colorClass: "text-pink-400" },
                  ].map((social) => (
                    <Button
                      key={social.name}
                      variant={socialFilter === social.name ? "default" : "ghost"}
                      size="icon"
                      className="h-10 w-10 rounded-full transition-all"
                      onClick={async () => {
                        setSocialFilter(social.name);
                        
                        // Find first category matching the social filter
                        const filteredCategories = categoriesWithServices.filter(
                          category => category.name.toLowerCase().includes(social.name.toLowerCase())
                        );
                        
                        if (filteredCategories.length > 0) {
                          const firstCategory = filteredCategories[0];
                          setSelectedCategory(firstCategory.id.toString());
                          
                          // Fetch services for that category and select the first one
                          const { data: categoryServices } = await supabase
                            .from("services")
                            .select("*")
                            .eq("category_id", firstCategory.id)
                            .eq("enabled", true)
                            .order("service_sort", { ascending: true });
                          
                          if (categoryServices && categoryServices.length > 0) {
                            setServices(categoryServices);
                            setSelectedService(categoryServices[0].id.toString());
                          } else {
                            setServices([]);
                            setSelectedService("");
                          }
                        } else {
                          setSelectedCategory("");
                          setSelectedService("");
                          setServices([]);
                        }
                      }}
                      title={`Filtrar por ${social.name}`}
                    >
                      {typeof social.icon === 'string' ? (
                        <img src={social.icon} alt={social.name} className={cn("h-5 w-5 object-contain", socialFilter === social.name ? "" : "opacity-80")} />
                      ) : (
                        <social.icon className={cn("h-5 w-5", socialFilter === social.name ? "" : social.colorClass)} />
                      )}
                    </Button>
                  ))}
                </div>
              )}

              {/* Conditional Content Based on Active Section */}
              {activeSection === "servicios" && <Card className="bg-card border-border mb-6">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Servicios</h3>
                    <p className="text-xs text-muted-foreground mt-1">Explora todos los servicios disponibles por categoría</p>
                  </div>
                  
                  <div className="p-4">
                    {categoriesWithServices.length === 0 ? <p className="text-muted-foreground text-center py-8 text-sm">No hay servicios disponibles</p> : <div className="space-y-6">
                        {categoriesWithServices.map(category => {
                  const categoryServices = allServices.filter(s => s.category_id === category.id);
                  return <div key={category.id} className="space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b border-border">
                                {renderIcon(category.icon, "w-5 h-5 text-primary")}
                                <h4 className="text-base font-semibold text-foreground">{category.name}</h4>
                                <Badge variant="secondary" className="text-xs">{categoryServices.length}</Badge>
                              </div>
                              
                              <div className="space-y-2">
                                {categoryServices.map(service => <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/5 transition-colors">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        {renderIcon(category.icon, "w-4 h-4 text-muted-foreground")}
                                        <Badge variant="outline" className="text-xs">
                                          #{service.id}
                                        </Badge>
                                        <h5 className="font-medium text-sm text-foreground">{service.name}</h5>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <span className="text-primary font-semibold">${getServiceRate(service).toFixed(5)}</span>
                                          <span>por 1000</span>
                                        </div>
                                        <div>Min: {service.min_qty}</div>
                                        <div>Max: {service.max_qty.toLocaleString()}</div>
                                        {service.refill && <Badge variant="secondary" className="text-xs">Refill</Badge>}
                                        {service.cancel_allow && <Badge variant="secondary" className="text-xs">Cancelable</Badge>}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                      <Button variant="outline" size="sm" onClick={() => handleShowDescription(service)}>
                                        <FileText className="w-3 h-3 mr-1" />
                                        Descripción
                                      </Button>
                                      <Button size="sm" onClick={() => {
                            handleBuyNow(service);
                            handleSectionChange("nueva-orden");
                          }}>
                                        <ShoppingCart className="w-3 h-3 mr-1" />
                                        Comprar Ahora
                                      </Button>
                                    </div>
                                  </div>)}
                              </div>
                            </div>;
                })}
                      </div>}
                  </div>
                </Card>}

              {activeSection === "nueva-orden" && <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
                {/* Haga Su Pedido */}
                <Card className="bg-card border-border min-w-0 overflow-hidden" ref={orderFormRef}>
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Haga Su Pedido</h3>
                    </div>
                    <Tabs value={activeOrderTab} onValueChange={setActiveOrderTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="nuevo">Nuevo Pedido</TabsTrigger>
                        <TabsTrigger value="buscar">Buscar</TabsTrigger>
                        <TabsTrigger value="orden">Orden Por Mayor</TabsTrigger>
                      </TabsList>
                      <TabsContent value="nuevo" className="mt-4 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Buscar por ID o nombre de servicio" 
                            className="pl-9 bg-background border-border"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              const term = e.target.value;
                              setSearchTerm(term);
                              if (!term.trim()) {
                                setSearchResults([]);
                                setShowSearchResults(false);
                                return;
                              }
                              const filtered = allServices.filter(service => {
                                const searchLower = term.toLowerCase();
                                const matchesId = service.id.toString().includes(term);
                                const matchesName = service.name.toLowerCase().includes(searchLower);
                                return matchesId || matchesName;
                              }).slice(0, 10);
                              setSearchResults(filtered);
                              setShowSearchResults(filtered.length > 0);
                            }}
                            onFocus={() => searchTerm && searchResults.length > 0 && setShowSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                          />
                          {showSearchResults && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                              {searchResults.map(service => (
                                <div
                                  key={service.id}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                                  onMouseDown={() => {
                                    setSelectedCategory(service.category_id.toString());
                                    setPendingServiceId(service.id.toString());
                                    setSearchTerm("");
                                    setShowSearchResults(false);
                                    toast.success(`Servicio #${service.id} seleccionado`);
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-white font-mono">#{service.id}</span>
                                      <p className="text-sm font-medium text-foreground truncate">{service.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {categories.find(c => c.id === service.category_id)?.name || 'Sin categoría'}
                                      </p>
                                    </div>
                                    <span className="text-xs font-semibold text-green-500 ml-2">
                                      ${getServiceRate(service).toFixed(4)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Categoría</Label>
                            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setSearchTerm(""); }}>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder={socialFilter ? `Categorías de ${socialFilter}` : "Selecciona una categoría"} />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriesWithServices
                                  .filter(category => !socialFilter || category.name.toLowerCase().includes(socialFilter.toLowerCase()))
                                  .map(category => <SelectItem key={category.id} value={category.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      {renderIcon(category.icon, "w-4 h-4")}
                                      <span>{category.name}</span>
                                    </div>
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Servicio</Label>
                            <Select 
                              value={selectedService} 
                              onValueChange={setSelectedService}
                              disabled={!selectedCategory || services.length === 0}
                            >
                              <SelectTrigger className="bg-background border-2 border-primary/70 overflow-hidden">
                                {selectedService ? (
                                  (() => {
                                    const service = services.find(s => s.id.toString() === selectedService);
                                    if (!service) return <SelectValue placeholder="Selecciona un servicio" />;
                                    return (
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {renderIcon(categories.find(c => c.id === service.category_id)?.icon, "w-5 h-5 flex-shrink-0")}
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                          {service.id}
                                        </span>
                                        <span className="text-sm text-foreground truncate">
                                          - {service.name}
                                        </span>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <SelectValue placeholder={!selectedCategory ? "Primero selecciona categoría" : "Selecciona un servicio"} />
                                )}
                              </SelectTrigger>
                              <SelectContent className="max-w-[95vw] min-w-[280px]">
                                {services.map(service => (
                                  <SelectItem key={service.id} value={service.id.toString()}>
                                    <div className="flex items-start gap-2 py-1 min-w-0 max-w-full">
                                      {renderIcon(categories.find(c => c.id === service.category_id)?.icon, "w-5 h-5 flex-shrink-0 mt-0.5")}
                                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                        {service.id}
                                      </span>
                                      <span className="text-sm text-foreground whitespace-normal break-words">
                                        - {service.name} - <span className="text-primary font-medium">${getServiceRate(service).toFixed(4)} por 1000</span>
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Link</Label>
                            <Input 
                              placeholder="Ingresa el enlace" 
                              value={link} 
                              onChange={e => setLink(e.target.value)} 
                              className="bg-background border-border"
                              disabled={!selectedService}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Cantidad</Label>
                            <Input 
                              type="number" 
                              placeholder={serviceInfo ? `Min: ${serviceInfo.min_qty} - Max: ${serviceInfo.max_qty}` : "Selecciona un servicio"} 
                              value={quantity} 
                              onChange={e => setQuantity(e.target.value)} 
                              className="bg-background border-border" 
                              min={serviceInfo?.min_qty} 
                              max={serviceInfo?.max_qty}
                              disabled={!selectedService}
                            />
                            {serviceInfo && <p className="text-xs text-muted-foreground">
                                Min: {serviceInfo.min_qty} - Max: {serviceInfo.max_qty.toLocaleString()}
                              </p>}
                          </div>

                          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <span className="text-sm font-medium text-foreground">Cantidad Total</span>
                            <span className="text-lg font-bold text-foreground">{quantity || 0}</span>
                          </div>

                          <Button 
                            className="w-full gap-2" 
                            size="lg" 
                            disabled={!selectedService || !link || !quantity || isSubmitting} 
                            onClick={handleSubmitOrder}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                Enviar
                                <Plus className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="buscar" className="mt-4">
                        <div className="space-y-4">
                          {/* Buscador */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Buscar servicio por ID o nombre..." 
                              className="pl-9 bg-background border-border"
                              value={serviceSearchTerm}
                              onChange={(e) => setServiceSearchTerm(e.target.value)}
                            />
                          </div>
                          
                          {/* Lista de servicios scrolleable */}
                          <div className="border border-border rounded-lg max-h-[400px] overflow-y-auto bg-background">
                            {allServices
                              .filter(service => {
                                if (!serviceSearchTerm.trim()) return true;
                                const searchLower = serviceSearchTerm.toLowerCase();
                                return service.id.toString().includes(serviceSearchTerm) || 
                                       service.name.toLowerCase().includes(searchLower);
                              })
                              .map(service => {
                                const category = categories.find(c => c.id === service.category_id);
                                return (
                                  <div
                                    key={service.id}
                                    className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors"
                                    onClick={() => {
                                      setSelectedCategory(service.category_id.toString());
                                      setPendingServiceId(service.id.toString());
                                      setServiceSearchTerm("");
                                      setActiveOrderTab("nuevo");
                                      toast.success(`Servicio #${service.id} seleccionado`);
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                        {renderIcon(category?.icon, "w-4 h-4 text-muted-foreground flex-shrink-0")}
                                        <span className="text-primary font-mono text-sm flex-shrink-0">#{service.id}</span>
                                        <span className="text-sm font-medium text-foreground truncate">{service.name}</span>
                                      </div>
                                      <div className="flex items-center flex-wrap gap-1 sm:gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="truncate max-w-[80px] sm:max-w-none">{category?.name}</span>
                                        <span>•</span>
                                        <span className="text-green-500 font-semibold whitespace-nowrap">${getServiceRate(service).toFixed(5)}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="hidden sm:inline whitespace-nowrap">Min: {service.min_qty} | Max: {service.max_qty.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            
                            {/* Estado vacío */}
                            {allServices.filter(s => {
                              if (!serviceSearchTerm.trim()) return true;
                              const searchLower = serviceSearchTerm.toLowerCase();
                              return s.id.toString().includes(serviceSearchTerm) || s.name.toLowerCase().includes(searchLower);
                            }).length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No se encontraron servicios
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground text-center">
                            Haz click en un servicio para seleccionarlo y realizar un pedido
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="orden" className="mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-foreground">Una orden por línea en formato</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              <code className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs sm:text-sm break-all">service_id | link | quantity</code>
                            </p>
                          </div>
                          
                          <Textarea 
                            placeholder={"service_id | link | quantity\nservice_id | link | quantity\nservice_id | link | quantity"}
                            className="min-h-[250px] bg-background border-border font-mono text-sm"
                            value={bulkOrderText}
                            onChange={(e) => setBulkOrderText(e.target.value)}
                          />
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {bulkOrderText.trim() 
                                ? `${bulkOrderText.trim().split('\n').filter(line => line.trim()).length} órdenes detectadas`
                                : "0 órdenes"
                              }
                            </span>
                            <span>Formato: ID | Link | Cantidad</span>
                          </div>
                          
                          <Button 
                            className="w-full gap-2" 
                            size="lg" 
                            disabled={!bulkOrderText.trim() || isBulkSubmitting}
                            onClick={handleBulkSubmit}
                          >
                            {isBulkSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Procesando órdenes...
                              </>
                            ) : (
                              <>
                                Enviar
                                <Plus className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </Card>

                {/* Información sobre el servicio */}
                <Card className="bg-card border-border">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded bg-secondary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-secondary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Información sobre el servicio</h3>
                    </div>
                    
                    {serviceInfo ? <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">{serviceInfo.name}</h4>
                          <p className="text-xs text-muted-foreground">ID: {serviceInfo.id}</p>
                        </div>

                        {serviceInfo.notes && <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Descripción:</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {serviceInfo.notes}
                            </p>
                          </div>}

                        {!serviceInfo.notes && <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              No hay descripción disponible para este servicio.
                            </p>
                          </div>}

                        {quantity && <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-foreground">Costo Total</span>
                              <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
                            </div>
                          </div>}
                      </div> : <div className="text-center py-12 text-muted-foreground text-sm">
                        Selecciona un servicio para ver la información
                      </div>}
                  </div>
                </Card>
              </div>}

              {/* Orders History Section */}
              {activeSection === "ordenes" && <div className="space-y-4">
                  <Card className="bg-card border-border">
                    <div className="p-4 border-b border-border">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Historial de Órdenes
                      </h2>
                    </div>
                    
                    {/* Filters */}
                    <div className="p-4 border-b border-border bg-accent/30 space-y-4">
                      {/* Search Input */}
                      <div>
                        <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                          <Search className="w-4 h-4" />
                          Buscar
                        </Label>
                        <Input
                          placeholder="Buscar por ID, link o nombre del servicio..."
                          value={orderSearchText}
                          onChange={(e) => setOrderSearchText(e.target.value)}
                          className="bg-background border-border"
                        />
                      </div>

                      {/* Platform Filter */}
                      <div>
                        <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                          Filtrar por plataforma
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "all", label: "Todos", icon: null },
                            { value: "tiktok", label: "TikTok", icon: "/tiktok-icon.png" },
                            { value: "instagram", label: "Instagram", icon: Instagram },
                            { value: "facebook", label: "Facebook", icon: Facebook },
                            { value: "youtube", label: "YouTube", icon: Youtube },
                            { value: "twitter", label: "Twitter/X", icon: Twitter },
                          ].map((platform) => (
                            <Button
                              key={platform.value}
                              size="sm"
                              variant={orderPlatformFilter === platform.value ? "default" : "outline"}
                              onClick={() => setOrderPlatformFilter(platform.value)}
                              className="flex items-center gap-1.5"
                            >
                              {platform.icon && (
                                typeof platform.icon === "string" 
                                  ? <img src={platform.icon} alt={platform.label} className="w-4 h-4" />
                                  : <platform.icon className="w-4 h-4" />
                              )}
                              {platform.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Estado
                          </Label>
                          <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="Pending">Pendiente</SelectItem>
                              <SelectItem value="In progress">En progreso</SelectItem>
                              <SelectItem value="Completed">Completado</SelectItem>
                              <SelectItem value="Partial">Parcial</SelectItem>
                              <SelectItem value="Canceled">Cancelado</SelectItem>
                              <SelectItem value="Failed">Fallido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date From Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Desde
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background border-border", !dateFrom && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "PPP", {
                            locale: es
                          }) : <span>Seleccionar fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Date To Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Hasta
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background border-border", !dateTo && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "PPP", {
                            locale: es
                          }) : <span>Seleccionar fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(orderStatusFilter !== "all" || dateFrom || dateTo || orderSearchText || orderPlatformFilter !== "all") && <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={() => {
                    setOrderStatusFilter("all");
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setOrderSearchText("");
                    setOrderPlatformFilter("all");
                  }}>
                            Limpiar filtros
                          </Button>
                        </div>}
                    </div>

                    {/* Orders Table */}
                    <div className="p-4">
                      {loadingOrders ? <div className="space-y-4">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                        </div> : filteredOrders.length === 0 ? <div className="text-center py-12">
                          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-semibold mb-2 text-foreground">No hay órdenes</h3>
                          <p className="text-sm text-muted-foreground">
                            {orders.length === 0 ? "Aún no has realizado ninguna orden" : "No se encontraron órdenes con los filtros seleccionados"}
                          </p>
                        </div> : <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead className="w-[80px]">ID Servicio</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead className="text-right px-0">Cantidad</TableHead>
                                <TableHead className="text-right">Inicio</TableHead>
                                <TableHead className="text-right">Restante</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="mx-0 px-0">Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredOrders.map(order => <TableRow key={order.id}>
                                  <TableCell className="font-medium">#{order.id}</TableCell>
                                  <TableCell className="text-muted-foreground">{order.service_id}</TableCell>
                                  <TableCell className="max-w-[200px] mx-0 px-0 py-0 my-0">
                                    <div className="truncate text-sm">
                                      {order.services?.name || "Servicio desconocido"}
                                    </div>
                                  </TableCell>
                              <TableCell className="max-w-[250px]">
                                <a 
                                  href={order.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-sm text-primary hover:underline block"
                                >
                                  {order.link}
                                </a>
                              </TableCell>
                                  <TableCell className="text-right">
                                    {order.quantity.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {order.start_count !== null ? order.start_count.toLocaleString() : "-"}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {order.remains !== null ? order.remains.toLocaleString() : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${Number(order.charge_user).toFixed(5)}
                                  </TableCell>
                                                  <TableCell className="px-px">
                                                    <div className="flex flex-col gap-1">
                                                      <Badge className={cn("font-medium", getStatusColor(order.status))} variant="outline">
                                                        {order.status}
                                                      </Badge>
                                                      {order.refunded && order.refund_amount && (
                                                        <span className="text-xs text-green-500">
                                                          Refund: ${Number(order.refund_amount).toFixed(5)}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", {
                            locale: es
                          })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {order.services?.refill && order.status === "Completed" && <Button size="sm" variant="outline" onClick={() => handleRefillOrder(order.id)} className="text-xs">
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Refill
                                        </Button>}
                                                       {/* Cancel button/badge logic */}
                                                       {order.services?.cancel_allow && (
                                                         order.cancel_requested_at ? (
                                                           // Show status based on final order status
                                                           order.status === "Canceled" || order.status === "Partial" ? (
                                                             <Badge variant="outline" className={cn("text-xs", 
                                                               order.status === "Canceled" 
                                                                 ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                                                 : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                                             )}>
                                                               {order.status === "Canceled" ? "Cancelado" : "Cancelación parcial"}
                                                             </Badge>
                                                           ) : (
                                                             <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                               Cancel solicitado
                                                             </Badge>
                                                           )
                                                         ) : (
                                                           // Show cancel button only for Pending orders
                                                           order.status === "Pending" && (
                                                             <Button 
                                                               size="sm" 
                                                               variant="outline" 
                                                               onClick={() => handleCancelOrder(order.id)} 
                                                               disabled={cancelingOrderId === order.id}
                                                               className="text-xs text-destructive hover:text-destructive"
                                                             >
                                                               {cancelingOrderId === order.id ? (
                                                                 <>
                                                                   <Loader2 className="w-3 h-3 mr-1 animate-spin" />
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
                                  </TableCell>
                                </TableRow>)}
                            </TableBody>
                          </Table>
                        </div>}

                      {/* Summary */}
                      {filteredOrders.length > 0 && <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Mostrando {filteredOrders.length} de {orders.length} órdenes
                            </span>
                            <span className="font-medium text-foreground">
                              Total gastado: ${filteredOrders.reduce((sum, order) => sum + Number(order.charge_user), 0).toFixed(5)}
                            </span>
                          </div>
                        </div>}
                    </div>
                  </Card>
                </div>}

              {activeSection === "agregar-fondos" && <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Agregar Fondos
                      </h2>
                      <p className="text-muted-foreground">
                        Selecciona tu método de pago preferido
                      </p>
                    </div>
                    <Button onClick={() => setShowRechargesModal(true)} variant="outline" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Ver Historial de Recargas
                    </Button>
                  </div>

                  {/* Payment Methods Section */}
                  <Card className="bg-card border-border p-6">
                    <h3 className="text-xl font-semibold mb-4">Método</h3>
                    <Tabs defaultValue="yape" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="yape">YAPE</TabsTrigger>
                        <TabsTrigger value="plin">PLIN</TabsTrigger>
                        <TabsTrigger value="paypal">PayPal</TabsTrigger>
                        <TabsTrigger value="binance">BINANCE</TabsTrigger>
                      </TabsList>

                      <TabsContent value="yape" className="space-y-4">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-muted-foreground mb-4">Recarga con YAPE - Mínimo 5 soles</p>
                          <img src={paymentImages.yape_qr_image || yapeQR} alt="QR YAPE" className="w-[500px] h-[500px] rounded-lg object-contain" />
                          <div className="mt-4 text-center">
                            <p className="text-sm font-medium">⚡ Poner en la Descripción su nombre de Usuario</p>
                            <p className="text-sm text-destructive mt-2">
                              <a href="http://wa.me/51940390504" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold">
                                ⚡ Enviar la Captura AQUÍ ( PRESIONAR AQUI )
                              </a>
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="plin" className="space-y-4">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-muted-foreground mb-4">Pago con PLIN - Mínimo 5 soles</p>
                          <img src={paymentImages.plin_qr_image || plinQR} alt="QR PLIN" className="w-[500px] h-[500px] rounded-lg object-contain" />
                          <div className="mt-4 text-center">
                            <p className="text-sm font-medium">⚡ Poner en la Descripción su nombre de Usuario</p>
                            <p className="text-sm mt-2">
                              <a href="http://wa.me/51940390504" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold underline transition-colors">
                                ⚡ Enviar la Captura AQUÍ ( PRESIONAR AQUI )
                              </a>
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="paypal" className="space-y-4">
                        <PayPalCheckoutSection />
                      </TabsContent>

                      <TabsContent value="binance" className="space-y-4">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-muted-foreground mb-4">BINANCE (USDT) - Mínimo 1 Dólar</p>
                          <img src={paymentImages.binance_qr_image || binanceQR} alt="QR BINANCE" className="w-[500px] h-[500px] rounded-lg object-contain" />
                          <div className="mt-4 text-center">
                            <p className="text-sm font-medium">⚡ Indicar su nombre de usuario para agregar su recarga exitosa</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">Instrucción</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Las recargas se procesan manualmente</li>
                        <li>• Envíe su comprobante con su nombre de usuario</li>
                        <li>• El saldo se acreditará en máximo 24 horas</li>
                      </ul>
                    </div>
                  </Card>

                  {/* Pricing Information Section */}
                  <Card className="bg-card border-border p-6">
                    <h3 className="text-xl font-semibold mb-4">Precios de Recargas</h3>
                    <div className="mb-4">
                      <img src={paymentImages.recargas_info_image || recargasInfo} alt="Precios de recargas y recomendaciones" className="w-full rounded-lg" />
                    </div>
                  </Card>
                </div>}

              {activeSection === "api" && <Card className="bg-card border-border">
                  <div className="p-8 text-center">
                    <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">API</h3>
                    <p className="text-sm text-muted-foreground">Documentación de API estará disponible pronto</p>
                  </div>
                </Card>}

              {activeSection === "actualizaciones" && (
                <Card className="bg-card border-border">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Actualizaciones de Servicios</h2>
                    
                    {/* Filtros */}
                    <div className="flex gap-4 mb-4">
                      <Select value={updatesFilter} onValueChange={setUpdatesFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Todo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todo</SelectItem>
                          <SelectItem value="created">Nuevos</SelectItem>
                          <SelectItem value="rate_increased">Tarifa Aumentada</SelectItem>
                          <SelectItem value="rate_decreased">Tarifa Reducida</SelectItem>
                          <SelectItem value="enabled">Habilitados</SelectItem>
                          <SelectItem value="disabled">Deshabilitados</SelectItem>
                          <SelectItem value="deleted">Eliminados</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                          placeholder="Buscar servicio..." 
                          className="pl-10"
                          value={updatesSearch}
                          onChange={(e) => setUpdatesSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Tabla de actualizaciones */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Servicio</TableHead>
                            <TableHead className="text-muted-foreground">Fecha</TableHead>
                            <TableHead className="text-muted-foreground">Actualización</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingUpdates ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : filteredUpdates.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                No hay actualizaciones disponibles
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUpdates.map((update) => (
                              <TableRow key={update.id} className="border-border hover:bg-accent/50">
                                <TableCell className="text-foreground">
                                  <span className="text-primary font-mono">{update.service_id}</span>
                                  <span className="mx-2">-</span>
                                  <span>{update.service_name}</span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {format(new Date(update.created_at), 'dd/MM/yyyy', { locale: es })}
                                </TableCell>
                                <TableCell>
                                  {update.update_type === 'enabled' && (
                                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                      Servicio habilitado
                                    </Badge>
                                  )}
                                  {update.update_type === 'disabled' && (
                                    <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
                                      Servicio deshabilitado
                                    </Badge>
                                  )}
                                  {update.update_type === 'created' && (
                                    <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
                                      Nuevo servicio
                                    </Badge>
                                  )}
                                  {update.update_type === 'rate_increased' && (
                                    <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
                                      Tarifa aumentada {update.old_value} → {update.new_value}
                                    </Badge>
                                  )}
                                  {update.update_type === 'rate_decreased' && (
                                    <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">
                                      Tarifa reducida {update.old_value} → {update.new_value}
                                    </Badge>
                                  )}
                                  {update.update_type === 'deleted' && (
                                    <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">
                                      Eliminado
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>
              )}

              {/* Tutoriales Section */}
              {activeSection === "tutoriales" && (
                <Card className="bg-card border-border">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-foreground">Tutoriales</h3>
                        <p className="text-xs text-muted-foreground mt-1">Aprende a usar nuestra plataforma con estos videos</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-6">
                      <Button
                        variant={tutorialFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTutorialFilter("all")}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={tutorialFilter === "youtube" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTutorialFilter("youtube")}
                        className="gap-2"
                      >
                        <Youtube className="h-4 w-4" />
                        YouTube
                      </Button>
                      <Button
                        variant={tutorialFilter === "tiktok" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTutorialFilter("tiktok")}
                        className="gap-2"
                      >
                        <Music className="h-4 w-4" />
                        TikTok
                      </Button>
                    </div>

                    {loadingTutorials ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : tutorialVideos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No hay tutoriales disponibles</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tutorialVideos.slice(0, 4).map((video) => (
                          <div key={video.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              {video.platform === 'youtube' ? (
                                <Youtube className="h-5 w-5 text-red-500" />
                              ) : (
                                <Music className="h-5 w-5 text-pink-500" />
                              )}
                              <h4 className="font-semibold text-foreground truncate">{video.title}</h4>
                            </div>
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                              {video.platform === 'youtube' ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(video.video_url) || ''}
                                  title={video.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <iframe
                                  src={getTikTokEmbedUrl(video.video_url)}
                                  title={video.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Mi Cuenta Section */}
              {activeSection === "cuenta" && (
                <Card className="bg-card border-border max-w-xl">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-foreground">Configuración de Cuenta</h3>
                        <p className="text-xs text-muted-foreground mt-1">Actualiza tu contraseña</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    {/* Change Password Section */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Cambiar Contraseña
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Nueva Contraseña</Label>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Ingresa tu nueva contraseña"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Confirmar Nueva Contraseña</Label>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirma tu nueva contraseña"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mínimo 6 caracteres
                          </p>
                        </div>
                        
                        <Button 
                          onClick={handlePasswordChange} 
                          disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                          className="w-full sm:w-auto"
                        >
                          {isUpdatingPassword ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Actualizando...
                            </>
                          ) : (
                            "Cambiar Contraseña"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>}
        </main>
      </div>

      {/* Modal de Descripción */}
      <Dialog open={descriptionModal.open} onOpenChange={open => setDescriptionModal({
      open,
      service: null
    })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">#{descriptionModal.service?.id}</Badge>
              {descriptionModal.service?.name}
            </DialogTitle>
            <DialogDescription>
              Detalles completos del servicio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Precio</Label>
                <p className="text-lg font-semibold text-primary">
                  ${descriptionModal.service ? getServiceRate(descriptionModal.service).toFixed(5) : '0.00000'} por 1000
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Cantidad</Label>
                <p className="font-medium text-sm">
                  Min: {descriptionModal.service?.min_qty} - Max: {descriptionModal.service?.max_qty.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {descriptionModal.service?.refill && <Badge variant="secondary">Refill Disponible</Badge>}
              {descriptionModal.service?.cancel_allow && <Badge variant="secondary">Cancelación Permitida</Badge>}
            </div>

            {descriptionModal.service?.notes && <div>
                <Label className="text-muted-foreground text-sm">Descripción</Label>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {descriptionModal.service.notes}
                </p>
              </div>}

            {!descriptionModal.service?.notes && <p className="text-sm text-muted-foreground italic">
                No hay descripción disponible para este servicio.
              </p>}

            <Button className="w-full" onClick={() => {
            setDescriptionModal({
              open: false,
              service: null
            });
            if (descriptionModal.service) {
              handleBuyNow(descriptionModal.service);
            }
          }}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Comprar Este Servicio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Success Modal */}
      <Dialog open={orderSuccessModal.open} onOpenChange={(open) => setOrderSuccessModal(prev => ({ ...prev, open }))}>
        <DialogContent className="w-[400px] max-w-[95vw] bg-card border-border">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-bold text-foreground">PEDIDO RECIBIDO</h2>
            
            {/* Order Details */}
            <div className="w-full space-y-3 text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">ID:</span>
                <span className="text-primary font-mono font-semibold">{orderSuccessModal.orderId}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Servicio:</span>
                <p className="text-foreground text-sm break-words line-clamp-2" title={orderSuccessModal.serviceName}>
                  {orderSuccessModal.serviceName}
                </p>
              </div>
              
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-muted-foreground text-sm">Enlace:</span>
                <p className="text-foreground text-sm truncate max-w-full overflow-hidden text-ellipsis" title={orderSuccessModal.link}>
                  {orderSuccessModal.link}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Cantidad:</span>
                <span className="text-foreground font-medium">{orderSuccessModal.quantity.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Cargo:</span>
                <span className="text-red-400 font-semibold">${orderSuccessModal.charge.toFixed(5)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Saldo:</span>
                <span className="text-green-500 font-semibold">${orderSuccessModal.newBalance.toFixed(5)}</span>
              </div>
            </div>
            
            {/* Confirm Button */}
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setOrderSuccessModal(prev => ({ ...prev, open: false }))}
            >
              CONFIRMAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharges History Modal */}
      <UserRechargesModal userId={userId} open={showRechargesModal} onOpenChange={setShowRechargesModal} />

      {/* Floating WhatsApp Button - Bottom Left */}
      <a
        href="https://whatsapp.com/channel/0029Vb7QWAQ1t90boiEHjv0N"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5C] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="WhatsApp"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Floating Telegram Button - Bottom Right */}
      <a
        href="https://t.me/MarketXpres"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0088CC] hover:bg-[#0077B5] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="Telegram"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </a>
    </div>;
};
export default ClientDashboard;