import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UsageLimitIndicatorProps {
  action: 'search' | 'extraction';
  used: number;
  limit: number;
  isAuthenticated: boolean;
}

export const UsageLimitIndicator: React.FC<UsageLimitIndicatorProps> = ({
  action,
  used,
  limit,
  isAuthenticated
}) => {
  if (isAuthenticated) return null;
  
  const remaining = Math.max(0, limit - used);
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;
  
  const actionText = action === 'search' ? 'searches' : 'extractions';
  
  if (isAtLimit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">
              {action === 'search' ? 'Search limit reached' : 'Extraction limit reached'}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              You've used all {limit} free {actionText} this hour. Sign up for unlimited access!
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link href="/auth/signup">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  Sign Up for Unlimited Access
                </Button>
              </Link>
              <Link href="/auth/login" className="text-sm text-red-700 hover:underline">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isNearLimit) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              {remaining} free {actionText} remaining this hour
            </p>
            <Link href="/auth/signup">
              <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                <TrendingUp className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}; 