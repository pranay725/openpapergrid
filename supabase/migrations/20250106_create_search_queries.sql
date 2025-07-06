-- Create search_queries table for tracking search history
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  filters JSONB,
  result_count INTEGER,
  page INTEGER,
  sort_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at);

-- Enable Row Level Security
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own search queries
CREATE POLICY "Users can view own search queries" ON public.search_queries
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert search queries for tracking
CREATE POLICY "Service role can insert search queries" ON public.search_queries
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy: Service role can read all search queries for analytics
CREATE POLICY "Service role can read all search queries" ON public.search_queries
  FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- Function to clean up old anonymous search queries (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_searches()
RETURNS void AS $$
BEGIN
  DELETE FROM public.search_queries
  WHERE user_id IS NULL 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-anonymous-searches', '0 0 * * *', 'SELECT cleanup_old_anonymous_searches();');