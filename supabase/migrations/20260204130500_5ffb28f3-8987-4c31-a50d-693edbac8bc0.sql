-- Fix function search path for get_current_week_start
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc('week', CURRENT_DATE)::date;
$$;