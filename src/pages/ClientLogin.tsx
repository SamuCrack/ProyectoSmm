import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";
import { UserCheck, ArrowLeft } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
];

const ClientLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Migration claim state
  const [showMigrationClaim, setShowMigrationClaim] = useState(false);
  const [migrationEmail, setMigrationEmail] = useState("");
  const [migrationPassword, setMigrationPassword] = useState("");
  const [migrationConfirmPassword, setMigrationConfirmPassword] = useState("");
  const [migrationUserData, setMigrationUserData] = useState<{
    username: string | null;
    balance: number;
  } | null>(null);

  // Register state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerCountryCode, setRegisterCountryCode] = useState("+51");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) return "El usuario debe tener al menos 3 caracteres";
    if (username.length > 30) return "El usuario no puede tener más de 30 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "El usuario solo puede contener letras, números y guiones bajos";
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (phone.length < 7) return "El número debe tener al menos 7 dígitos";
    if (phone.length > 15) return "El número no puede tener más de 15 dígitos";
    if (!/^\d+$/.test(phone)) return "El número solo puede contener dígitos";
    return null;
  };

  const checkPendingMigration = async (email: string) => {
    const { data, error } = await supabase
      .from("pending_migrations")
      .select("username, balance")
      .eq("email", email.toLowerCase().trim())
      .is("claimed_at", null)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking pending migration:", error);
      return null;
    }
    
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First try to login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        // If login fails, check if user has a pending migration
        if (authError.message.includes("Invalid login credentials")) {
          const pendingMigration = await checkPendingMigration(loginEmail);
          
          if (pendingMigration) {
            // Show migration claim flow
            setMigrationEmail(loginEmail);
            setMigrationUserData(pendingMigration);
            setShowMigrationClaim(true);
            setLoading(false);
            return;
          }
        }
        throw authError;
      }

      // Verify user is NOT admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleData?.role === "admin") {
        await supabase.auth.signOut();
        toast.error("Por favor usa el panel de administrador para acceder.");
        return;
      }

      // Get user IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Update last_auth and last_ip
      await supabase
        .from("profiles")
        .update({ 
          last_auth: new Date().toISOString(),
          last_ip: ip
        })
        .eq("id", authData.user.id);

      // Log the login
      await supabase.from("logs").insert({
        user_id: authData.user.id,
        action: "login",
        ip_address: ip,
        details: { user_agent: navigator.userAgent }
      });

      toast.success("Inicio de sesión exitoso");
      navigate("/client/dashboard");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (migrationPassword !== migrationConfirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (migrationPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("claim-migrated-account", {
        body: {
          email: migrationEmail,
          password: migrationPassword,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("¡Cuenta reclamada exitosamente! Ahora puedes iniciar sesión.");
      
      // Reset migration state
      setShowMigrationClaim(false);
      setMigrationEmail("");
      setMigrationPassword("");
      setMigrationConfirmPassword("");
      setMigrationUserData(null);
      
      // Set the login email for convenience
      setLoginEmail(migrationEmail);
      setLoginPassword("");
      
    } catch (error: any) {
      console.error("Error claiming account:", error);
      toast.error("Error al reclamar cuenta: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    const usernameError = validateUsername(registerUsername);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    // Validate phone
    const phoneError = validatePhone(registerPhone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos de servicio");
      return;
    }

    const recaptchaValue = recaptchaRef.current?.getValue();
    if (!recaptchaValue) {
      toast.error("Por favor completa el captcha");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", registerUsername.toLowerCase())
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingUser) {
        toast.error("Este nombre de usuario ya está en uso");
        setLoading(false);
        return;
      }

      // Check if email has pending migration
      const pendingMigration = await checkPendingMigration(registerEmail);
      if (pendingMigration) {
        setMigrationEmail(registerEmail);
        setMigrationUserData(pendingMigration);
        setShowMigrationClaim(true);
        setLoading(false);
        toast.info("Detectamos que ya tienes una cuenta migrada. Por favor establece tu contraseña.");
        return;
      }

      const whatsappFull = `${registerCountryCode}${registerPhone}`;

      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/client/dashboard`,
          data: {
            username: registerUsername.toLowerCase(),
            whatsapp: whatsappFull
          }
        },
      });

      if (error) throw error;

      toast.success("Cuenta creada exitosamente");
      navigate("/client/dashboard");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Migration claim view
  if (showMigrationClaim) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setShowMigrationClaim(false);
                  setMigrationPassword("");
                  setMigrationConfirmPassword("");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Reclamar Cuenta</CardTitle>
            </div>
            <CardDescription>
              Detectamos una cuenta migrada. Establece tu nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-primary/50 bg-primary/10">
              <UserCheck className="h-4 w-4" />
              <AlertTitle>Cuenta encontrada</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Email:</strong> {migrationEmail}</p>
                  {migrationUserData?.username && (
                    <p><strong>Usuario:</strong> {migrationUserData.username}</p>
                  )}
                  <p><strong>Saldo:</strong> ${migrationUserData?.balance.toFixed(5)}</p>
                </div>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleClaimAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="migration-password">Nueva Contraseña</Label>
                <Input
                  id="migration-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={migrationPassword}
                  onChange={(e) => setMigrationPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="migration-confirm">Confirmar Contraseña</Label>
                <Input
                  id="migration-confirm"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  value={migrationConfirmPassword}
                  onChange={(e) => setMigrationConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Reclamando cuenta..." : "Reclamar Cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cliente Panel</CardTitle>
          <CardDescription className="text-center">
            Inicia sesión o crea una cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Usuario</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="mi_usuario"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo letras, números y guiones bajos (3-30 caracteres)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <div className="flex gap-2">
                    <Select value={registerCountryCode} onValueChange={setRegisterCountryCode}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      placeholder="940390504"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, ""))}
                      required
                      className="flex-1"
                      minLength={7}
                      maxLength={15}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Número de WhatsApp (7-15 dígitos)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirmar contraseña</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Confirma tu contraseña"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LcETBMsAAAAAJpqs2SW88wZvXqEkcu75TEGwHkW"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    He leído y estoy de acuerdo con los{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Términos de servicio
                    </Link>
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLogin;
