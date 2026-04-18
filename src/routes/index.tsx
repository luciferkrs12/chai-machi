import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import Login from '../pages/Login'

function LoginRoute() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user && isAuthenticated) {
      console.log('✅ Auth settled, user authenticated, navigating to dashboard...');
      navigate({ to: '/dashboard', replace: true })
    }
  }, [user, isAuthenticated, isLoading, navigate])

  return <Login />
}

export const Route = createFileRoute('/')({
  component: LoginRoute,
})