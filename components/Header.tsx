'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { ComingSoonModal } from '@/components/ComingSoonModal'
import { useAuth } from '@/lib/auth-context'

export function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)

  return (
    <>
      {/* US Gov Banner */}
      <div className="bg-gray-100 text-xs py-1 px-4 border-b border-gray-300">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-gray-600">🇺🇸</span>
          <span>An open-source alternative to AI research platforms like Elicit, Consensus, Scite.</span>
          <button 
            onClick={() => setShowComingSoonModal(true)}
            className="text-blue-600 hover:underline ml-2"
          >
            Here's how you deploy →
          </button>
        </div>
      </div>

      {/* NIH/NLM Style Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-8">
              <Logo />
              <div>
                <h1 className="text-2xl font-normal text-gray-900">OpenPaper Grid</h1>
                <p className="text-sm text-gray-600">AI-Powered Biomedical Literature Platform</p>
              </div>
            </Link>
            
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
      </header>
      
      <ComingSoonModal 
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
      />
    </>
  )
} 