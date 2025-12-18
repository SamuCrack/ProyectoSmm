-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  balance DECIMAL(12,5) NOT NULL DEFAULT 0.00000,
  api_token VARCHAR(64) UNIQUE,
  custom_discount DECIMAL(5,2) DEFAULT 0.00,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (NEVER store roles on profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Service categories table
CREATE TABLE public.service_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  icon VARCHAR(64),
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers table
CREATE TABLE public.providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  api_url VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  balance_cached DECIMAL(14,6) DEFAULT 0.000000,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE public.services (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  provider_id INT REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_service_id VARCHAR(50),
  name TEXT NOT NULL,
  service_type VARCHAR(50),
  rate_per_1000 DECIMAL(12,5) NOT NULL DEFAULT 0.00000,
  min_qty INT NOT NULL DEFAULT 1,
  max_qty INT NOT NULL DEFAULT 1000000,
  refill BOOLEAN NOT NULL DEFAULT false,
  cancel_allow BOOLEAN NOT NULL DEFAULT false,
  input_type VARCHAR(20) DEFAULT 'link',
  speed_text TEXT,
  quality_text TEXT,
  start_text TEXT,
  location_text TEXT,
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  deny_link_duplicates BOOLEAN NOT NULL DEFAULT false,
  sync_with_provider BOOLEAN NOT NULL DEFAULT false,
  service_sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider services cache
CREATE TABLE public.provider_services_cache (
  id SERIAL PRIMARY KEY,
  provider_id INT REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  rate DECIMAL(12,5),
  min_qty INT,
  max_qty INT,
  refill BOOLEAN DEFAULT false,
  cancel_allow BOOLEAN DEFAULT false,
  raw_data JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, service_id)
);

-- Orders table
CREATE TABLE public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id INT REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
  provider_id INT REFERENCES public.providers(id) ON DELETE RESTRICT NOT NULL,
  external_order_id BIGINT,
  link VARCHAR(512) NOT NULL,
  quantity INT NOT NULL,
  charge_user DECIMAL(12,5) NOT NULL DEFAULT 0.00000,
  cost_provider DECIMAL(12,5),
  start_count INT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  remains INT,
  mode VARCHAR(10) DEFAULT 'Auto',
  fail_reason VARCHAR(255),
  refunded BOOLEAN NOT NULL DEFAULT false,
  refund_amount DECIMAL(12,5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, external_order_id)
);

-- Recharges table
CREATE TABLE public.recharges (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,5) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP bans table
CREATE TABLE public.ip_bans (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL UNIQUE,
  reason VARCHAR(255),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs table
CREATE TABLE public.logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing rules (custom rates per user/service)
CREATE TABLE public.pricing_rules (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id INT REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  custom_rate DECIMAL(12,5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_api_token ON public.profiles(api_token);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_service ON public.orders(service_id);
CREATE INDEX idx_orders_status_created ON public.orders(status, created_at);
CREATE INDEX idx_services_category ON public.services(category_id);
CREATE INDEX idx_services_provider ON public.services(provider_id, provider_service_id);
CREATE INDEX idx_logs_user ON public.logs(user_id);
CREATE INDEX idx_logs_created ON public.logs(created_at);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for service_categories (public read, admin write)
CREATE POLICY "Anyone can view enabled categories"
  ON public.service_categories FOR SELECT
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories"
  ON public.service_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for providers (admin only)
CREATE POLICY "Admins can view providers"
  ON public.providers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage providers"
  ON public.providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for services (public read enabled, admin full access)
CREATE POLICY "Anyone can view enabled services"
  ON public.services FOR SELECT
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for provider_services_cache (admin only)
CREATE POLICY "Admins can view cache"
  ON public.provider_services_cache FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage cache"
  ON public.provider_services_cache FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for recharges
CREATE POLICY "Users can view their own recharges"
  ON public.recharges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recharges"
  ON public.recharges FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage recharges"
  ON public.recharges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ip_bans (admin only)
CREATE POLICY "Admins can manage IP bans"
  ON public.ip_bans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for logs
CREATE POLICY "Users can view their own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON public.logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pricing_rules
CREATE POLICY "Users can view their own pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pricing rules"
  ON public.pricing_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recharges_updated_at
  BEFORE UPDATE ON public.recharges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, balance)
  VALUES (NEW.id, NEW.email, 0.00000);
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();