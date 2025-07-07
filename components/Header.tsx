'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/lib/auth-context'

export function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()

  return (
    <>

      {/* NIH/NLM Style Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <Logo />
              <h1 className="text-xl font-normal text-gray-900">OpenPaper Grid</h1>
            </Link>
            
            <div className="flex items-center gap-4">
              <a href="mailto:madan@decibio.com" className="text-sm text-blue-600 hover:underline">
                Contact
              </a>
              {loading ? (
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 hover:text-blue-700 hover:bg-gray-50 font-normal"
                    onClick={() => router.push('/auth/login')}
                  >
                    Log in
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-normal"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
} 