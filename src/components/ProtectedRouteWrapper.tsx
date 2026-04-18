import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, ReactNode } from 'react'

/**
 * Wrapper component for protected routes
 * Redirects to login if not authenticated
 */
export function ProtectedRouteWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user && !isAuthenticated) {
      navigate({ to: '/', replace: true })
    }
  }, [isAuthenticated, user, navigate])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
