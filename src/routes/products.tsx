import { createFileRoute } from '@tanstack/react-router'
import Products from '../pages/Products'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const Route = createFileRoute('/products')({
  component: () => (
    <ProtectedRoute requiredRole="admin">
      <Products />
    </ProtectedRoute>
  ),
})