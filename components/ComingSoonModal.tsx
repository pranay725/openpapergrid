'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSignUp = () => {
    onClose()
    router.push('/auth/signup')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 border border-gray-200"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="text-2xl font-normal text-gray-900 mb-2">Coming Soon!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We're working hard to bring you comprehensive deployment guides and tutorials. 
            Be the first to know when they're ready!
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleSignUp}
              className="w-full"
              size="lg"
            >
              Sign up to stay updated
            </Button>
            
            <div className="text-sm text-gray-600">
              Or follow{' '}
              <a 
                href="https://twitter.com/datamadan" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                @datamadan
              </a>{' '}
              on X for updates
            </div>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-600"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}