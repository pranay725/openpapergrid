'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function TestAuthPage() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Auth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              {user && (
                <>
                  <div>
                    <span className="font-semibold">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-semibold">User ID:</span> {user.id}
                  </div>
                  <div>
                    <span className="font-semibold">Created:</span>{' '}
                    {new Date(user.created_at).toLocaleString()}
                  </div>
                </>
              )}
              
              {session && (
                <div>
                  <span className="font-semibold">Session Expires:</span>{' '}
                  {new Date(session.expires_at!).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {user ? (
                <>
                  <Button onClick={() => signOut()} variant="destructive">
                    Sign Out
                  </Button>
                  <Link href="/search-results?query=CRISPR">
                    <Button>Go to Search</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button>Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="outline">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>If not authenticated, click "Sign In" to log in</li>
            <li>After signing in, you should see your user details above</li>
            <li>Try accessing /search-results - it should work</li>
            <li>Sign out and try accessing /api/fulltext - it should return 401</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 