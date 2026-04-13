
-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Exchange rates table
CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric NOT NULL,
  source text NOT NULL DEFAULT 'BCV',
  rate_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source, rate_date)
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rates" ON public.exchange_rates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert rates" ON public.exchange_rates
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rates" ON public.exchange_rates
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PayPal accounts table
CREATE TABLE public.paypal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.paypal_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active accounts" ON public.paypal_accounts
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage paypal accounts" ON public.paypal_accounts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add verification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN id_photo_url text,
  ADD COLUMN cedula text;

-- Add bank details to transactions
ALTER TABLE public.transactions
  ADD COLUMN payment_method text,
  ADD COLUMN bank_name text,
  ADD COLUMN bank_phone text,
  ADD COLUMN bank_account_number text,
  ADD COLUMN bank_cedula text,
  ADD COLUMN bank_full_name text,
  ADD COLUMN paypal_account_used text;

-- Storage bucket for ID photos
INSERT INTO storage.buckets (id, name, public) VALUES ('id-photos', 'id-photos', false);

CREATE POLICY "Users can upload their own ID photo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own ID photo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all ID photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'id-photos' AND public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paypal_accounts_updated_at
  BEFORE UPDATE ON public.paypal_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admins to read all profiles (for verification)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update profiles (for verification status)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all transactions
CREATE POLICY "Admins can update all transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all notifications
CREATE POLICY "Admins can manage notifications" ON public.registration_notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
