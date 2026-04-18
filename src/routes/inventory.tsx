import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

function InventoryRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: '/products', replace: true })
    }
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/inventory')({
  component: InventoryRoute,
})
