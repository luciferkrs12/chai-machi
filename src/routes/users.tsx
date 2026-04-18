import { createFileRoute } from '@tanstack/react-router'
import Users from '../pages/Users'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const Route = createFileRoute('/users')({
  component: () => (
    <ProtectedRoute requiredRole="admin">
      <Users />
    </ProtectedRoute>
  ),
})
