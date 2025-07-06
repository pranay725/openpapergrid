import { NextRequest } from 'next/server';
import { createSupabaseAdmin } from './supabase-server';

export interface RateLimitConfig {
  limit: number;
  window: string; // e.g., '1h', '24h'
  key: 'ip' | 'userId';
}

export const RATE_LIMITS = {
  anonymous: {
    search: { limit: 50, window: '1h', key: 'ip' as const },
    abstractExtraction: { limit: 20, window: '1h', key: 'ip' as const },
    resultsPerSearch: 50
  },
  authenticated: {
    search: { limit: 1000, window: '24h', key: 'userId' as const },
    abstractExtraction: { limit: 500, window: '24h', key: 'userId' as const },
    fullTextExtraction: { limit: 100, window: '24h', key: 'userId' as const },
    apiCalls: { limit: 10000, window: '30d', key: 'userId' as const }
  }
};

export async function checkRateLimit(
  request: NextRequest,
  userId?: string,
  action: string = 'search'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const identifier = userId || getClientIp(request);
  
  // Handle special case for resultsPerSearch
  if (action === 'resultsPerSearch') {
    return { allowed: true, remaining: 999, resetAt: new Date() };
  }
  
  const limits = userId ? RATE_LIMITS.authenticated : RATE_LIMITS.anonymous;
  const config = limits[action as keyof typeof limits];
  
  if (!config || typeof config === 'number') {
    return { allowed: true, remaining: 999, resetAt: new Date() };
  }
  
  const windowMs = parseWindow(config.window);
  const windowStart = new Date(Date.now() - windowMs);
  
  // Check existing rate limit records
  const { data: limitsData, error } = await createSupabaseAdmin()
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (error && error.code !== 'PGRST116') { // Not found error
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: config.limit, resetAt: new Date() };
  }
  
  if (!limitsData) {
    // Create new rate limit record
    await createSupabaseAdmin()
      .from('rate_limits')
      .insert({
        identifier,
        action,
        count: 1,
        window_start: new Date()
      });
    
    return { 
      allowed: true, 
      remaining: config.limit - 1, 
      resetAt: new Date(Date.now() + windowMs) 
    };
  }
  
  if (limitsData.count >= config.limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: new Date(new Date(limitsData.window_start).getTime() + windowMs) 
    };
  }
  
  // Increment count
  await createSupabaseAdmin()
    .from('rate_limits')
    .update({ count: limitsData.count + 1 })
    .eq('id', limitsData.id);
  
  return { 
    allowed: true, 
    remaining: config.limit - limitsData.count - 1, 
    resetAt: new Date(new Date(limitsData.window_start).getTime() + windowMs) 
  };
}

export async function trackUsage(
  userId: string,
  action: 'searches' | 'abstract_extractions' | 'fulltext_extractions' | 'api_calls'
) {
  const today = new Date().toISOString().split('T')[0];
  
  // Upsert usage record
  const { error } = await createSupabaseAdmin()
    .from('user_usage')
    .upsert({
      user_id: userId,
      date: today,
      [action]: 1
    }, {
      onConflict: 'user_id,date',
      count: 'exact'
    });
  
  if (error) {
    console.error('Usage tracking error:', error);
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';
  return ip;
}

function parseWindow(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1));
  
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 60 * 60 * 1000; // Default 1 hour
  }
} 