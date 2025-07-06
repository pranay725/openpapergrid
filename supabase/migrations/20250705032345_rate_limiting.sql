-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user_id
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (identifier, action, window_start);

-- User usage statistics table
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  searches INTEGER DEFAULT 0,
  abstract_extractions INTEGER DEFAULT 0,
  fulltext_extractions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Index for efficient lookups
CREATE INDEX idx_user_usage_lookup ON public.user_usage (user_id, date);

-- RLS policies for rate_limits (service role only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all rate limits and usage
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user usage" ON public.user_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT public.cleanup_old_rate_limits();'); 