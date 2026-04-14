
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS paypal_sender_name text;

ALTER TABLE public.exchange_rates ADD COLUMN IF NOT EXISTS rate_under_50 numeric;
ALTER TABLE public.exchange_rates ADD COLUMN IF NOT EXISTS rate_over_100 numeric;
ALTER TABLE public.exchange_rates ADD COLUMN IF NOT EXISTS pago_movil_commission numeric NOT NULL DEFAULT 0;
