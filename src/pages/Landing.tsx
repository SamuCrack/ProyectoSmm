import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import marketxpressLogo from "@/assets/marketxpress-logo.png";
import {
  Youtube,
  Facebook,
  Music,
  MessageCircle,
  Send,
  Hash,
  Camera,
  Twitter,
  Instagram,
  Twitch,
  Mail,
  Lock,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Award,
  TrendingUp,
  Users,
  DollarSign,
  UserPlus,
  CreditCard,
  Search,
  ShoppingCart,
  Eye,
} from "lucide-react";

const Landing = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor ingresa email y contraseña",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (roleData?.role === "admin") {
        await supabase.auth.signOut();
        toast({
          title: "Error",
          description: "Por favor usa el acceso de admin correcto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      navigate("/client/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const socialPlatforms = [
    { icon: Instagram, name: "Instagram" },
    { icon: Twitter, name: "Twitter" },
    { icon: "/tiktok-icon.png", name: "TikTok" },
    { icon: Facebook, name: "Facebook" },
    { icon: Youtube, name: "YouTube" },
    { icon: Twitch, name: "Twitch" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={marketxpressLogo} 
              alt="MarketXpress" 
              className="w-64 h-auto min-h-[50px]"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-sm text-gray-300 hover:text-white transition-colors">Inicio</a>
            <a href="#servicios" className="text-sm text-gray-300 hover:text-white transition-colors">Servicios</a>
            <a href="#api" className="text-sm text-gray-300 hover:text-white transition-colors">API</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/client/login")}
              className="text-white hover:bg-white/10"
            >
              Iniciar Sesión
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate("/client/login")}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-300">Proveedor #1 En Mejorar Redes Sociales 🎉</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1]">
                <span className="text-red-500 block mb-3">Software</span>
                <span className="text-white block mb-3">Crecimiento de</span>
                <span className="text-white block">Redes Sociales</span>
              </h1>
              
              <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
                Aumenta tus seguidores, mejora tu engagement y maximiza tu presencia online con nuestro software fácil de usar y efectivo.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/client/login")}
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-all"
                >
                  Iniciar sesión
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/client/login")}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-xl shadow-red-500/30"
                >
                  Registrarse
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Award className="h-5 w-5 text-red-500" />
                  <span>Servicios de Alta Calidad</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span>Soporte 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>Garantías DePorVida</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-5 w-5 text-red-500" />
                  <span>Servicios Sin Caída</span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4 shadow-lg shadow-red-500/30">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    Acceder a su cuenta
                  </h2>
                  <p className="text-gray-400">Software #1 en Crecimiento de Redes Sociales</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <Input
                      type="email"
                      placeholder="Email o Username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
                      required
                    />
                  </div>
                  
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-semibold shadow-lg shadow-red-500/30"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Iniciando...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-400">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => navigate("/client/login")}
                    className="text-red-500 hover:text-red-400 font-semibold transition-colors"
                  >
                    Regístrate aquí
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Animated Marquee */}
      <section className="py-12 border-y border-white/5 bg-[#0f0f0f] overflow-hidden">
        <div className="relative flex">
          <div className="flex animate-marquee gap-16 items-center whitespace-nowrap">
            {[...socialPlatforms, ...socialPlatforms].map((platform, idx) => {
              return (
                <div key={idx} className="flex items-center gap-4 px-8">
                  {typeof platform.icon === 'string' ? (
                    <img src={platform.icon} alt={platform.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <platform.icon className="h-10 w-10 text-gray-400" />
                  )}
                  <span className="text-2xl font-semibold text-gray-400">{platform.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex animate-marquee gap-16 items-center whitespace-nowrap absolute top-0" aria-hidden="true">
            {[...socialPlatforms, ...socialPlatforms].map((platform, idx) => {
              return (
                <div key={idx} className="flex items-center gap-4 px-8">
                  {typeof platform.icon === 'string' ? (
                    <img src={platform.icon} alt={platform.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <platform.icon className="h-10 w-10 text-gray-400" />
                  )}
                  <span className="text-2xl font-semibold text-gray-400">{platform.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comienza tu crecimiento en redes sociales en 5 simples pasos
            </p>
          </div>

          <Tabs defaultValue="register" className="max-w-6xl mx-auto">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-white/5 p-2">
              <TabsTrigger value="register" className="data-[state=active]:bg-red-500">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrarse
              </TabsTrigger>
              <TabsTrigger value="balance" className="data-[state=active]:bg-red-500">
                <CreditCard className="h-4 w-4 mr-2" />
                Agregar Balance
              </TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-red-500">
                <Search className="h-4 w-4 mr-2" />
                Buscar Servicios
              </TabsTrigger>
              <TabsTrigger value="order" className="data-[state=active]:bg-red-500">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Realizar Pedido
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-red-500">
                <Eye className="h-4 w-4 mr-2" />
                Ver Resultados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">Crea tu cuenta gratis</h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Regístrate en segundos con tu email. No se requiere tarjeta de crédito para empezar.
                  </p>
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    Registrarse Ahora
                  </Button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg aspect-video flex items-center justify-center">
                  <UserPlus className="h-32 w-32 text-red-500/30" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="balance" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">Añade fondos a tu cuenta</h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Deposita fondos usando múltiples métodos de pago: YAPE, PLIN, PayPal y más.
                  </p>
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    Ver Métodos de Pago
                  </Button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg aspect-video flex items-center justify-center">
                  <CreditCard className="h-32 w-32 text-red-500/30" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">Explora nuestros servicios</h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Navega por cientos de servicios para Instagram, TikTok, YouTube y más plataformas.
                  </p>
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    Ver Servicios
                  </Button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg aspect-video flex items-center justify-center">
                  <Search className="h-32 w-32 text-red-500/30" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="order" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">Realiza tu pedido</h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Selecciona el servicio, ingresa el link de tu perfil y la cantidad deseada. ¡Así de simple!
                  </p>
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    Hacer Pedido
                  </Button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg aspect-video flex items-center justify-center">
                  <ShoppingCart className="h-32 w-32 text-red-500/30" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">¡Ver los resultados en minutos!</h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Observa cómo tus seguidores, likes o views aumentan en tiempo real. Resultados garantizados.
                  </p>
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    Comenzar Ahora
                  </Button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg aspect-video flex items-center justify-center">
                  <Eye className="h-32 w-32 text-red-500/30" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Services Cards Section */}
      <section id="servicios" className="py-24 bg-[#0f0f0f]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Servicios más baratos desde $0.01
            </h2>
            <p className="text-xl text-gray-400">
              Explora nuestros servicios más populares
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <Instagram className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Instagram Seguidores</h3>
                <p className="text-gray-400 mb-4">Desde $0.50 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">TikTok Likes</h3>
                <p className="text-gray-400 mb-4">Desde $0.30 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <Youtube className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">YouTube Views</h3>
                <p className="text-gray-400 mb-4">Desde $0.80 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <Facebook className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Facebook Likes</h3>
                <p className="text-gray-400 mb-4">Desde $0.40 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <Twitter className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Twitter Seguidores</h3>
                <p className="text-gray-400 mb-4">Desde $0.60 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent hover:border-red-500/40 transition-all">
              <CardContent className="p-6 text-center">
                <Twitch className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Twitch Followers</h3>
                <p className="text-gray-400 mb-4">Desde $1.00 por 1000</p>
                <Button className="w-full bg-red-500 hover:bg-red-600">Ver Servicio</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <Users className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <p className="text-gray-400">Servicios Activos</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <Zap className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-white mb-2">&lt;5min</div>
                <p className="text-gray-400">Tiempo de Procesamiento</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl text-center">
              <CardContent className="p-8">
                <DollarSign className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-white mb-2">$0.01</div>
                <p className="text-gray-400">Precio Mínimo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-xl text-gray-400">
              La mejor plataforma de SMM del mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Alta Calidad</h3>
                <p className="text-gray-400 leading-relaxed">
                  Servicios de la más alta calidad con garantía de satisfacción y resultados reales
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Múltiples Métodos de Pago</h3>
                <p className="text-gray-400 leading-relaxed">
                  Acepta YAPE, PLIN, PayPal y más opciones de pago para tu comodidad
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Precios Competitivos</h3>
                <p className="text-gray-400 leading-relaxed">
                  Los precios más bajos del mercado sin comprometer la calidad del servicio
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Entrega Rápida</h3>
                <p className="text-gray-400 leading-relaxed">
                  Procesamiento instantáneo y entrega en minutos para todos los servicios
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-400">
              Todo lo que necesitas saber sobre nuestros servicios
            </p>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-4">
            <AccordionItem value="item-1" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Qué es un panel SMM?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Un panel SMM (Social Media Marketing) es una plataforma que ofrece servicios de marketing para redes sociales como seguidores, likes, views y más. Ayuda a aumentar tu presencia online de manera rápida y efectiva.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Cuánto tiempo tarda en procesarse un pedido?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                La mayoría de pedidos se procesan instantáneamente. El tiempo de entrega varía según el servicio, pero generalmente vemos resultados en menos de 5 minutos para servicios rápidos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Los servicios son seguros para mi cuenta?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Sí, todos nuestros servicios son 100% seguros. Utilizamos métodos orgánicos que cumplen con los términos de servicio de cada plataforma para proteger tu cuenta.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Qué métodos de pago aceptan?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Aceptamos múltiples métodos de pago incluyendo YAPE, PLIN, PayPal, transferencias bancarias y criptomonedas. Todos los pagos son procesados de forma segura.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Ofrecen reembolsos?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Sí, ofrecemos reembolso completo si el servicio no se entrega según lo prometido. Nuestra garantía de satisfacción asegura que obtengas lo que pagaste.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-white/10 rounded-lg px-6 bg-white/5">
              <AccordionTrigger className="text-white hover:text-red-500 text-left">
                ¿Tienen soporte al cliente?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Contamos con soporte 24/7 vía WhatsApp, email y chat en vivo. Nuestro equipo está siempre disponible para ayudarte con cualquier pregunta o problema.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0f0f0f] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
              <div className="text-center">
                <h3 className="text-white font-bold mb-4">Instagram</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-red-500 transition-colors">Seguidores</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Likes</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Views</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Comentarios</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Stories</a></li>
                </ul>
              </div>

              <div className="text-center">
                <h3 className="text-white font-bold mb-4">TikTok</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-red-500 transition-colors">Seguidores</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Likes</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Views</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Shares</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Comentarios</a></li>
                </ul>
              </div>

              <div className="text-center">
                <h3 className="text-white font-bold mb-4">Facebook</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-red-500 transition-colors">Likes de Página</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Post Likes</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Seguidores</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Views</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Shares</a></li>
                </ul>
              </div>

              <div className="text-center">
                <h3 className="text-white font-bold mb-4">YouTube</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-red-500 transition-colors">Suscriptores</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Views</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Likes</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Comentarios</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Live Stream</a></li>
                </ul>
              </div>

              <div className="text-center">
                <h3 className="text-white font-bold mb-4">Twitter / X</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-red-500 transition-colors">Seguidores</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Likes</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Retweets</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Views</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors">Comentarios</a></li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-4">
                © 2024 MarketFollowers. Panel SMM profesional. Todos los derechos reservados.
              </p>
              <p className="text-xs text-gray-500">
                Disclaimer: Este servicio es solo para fines de marketing y promoción. Todos los servicios se entregan según los términos de servicio de cada plataforma.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/51940390504"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 transition-all hover:scale-110 group"
      >
        <MessageCircle className="h-8 w-8 text-white" />
        <span className="absolute right-full mr-3 px-4 py-2 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">
          ¿Necesitas ayuda?
        </span>
      </a>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
