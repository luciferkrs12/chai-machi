import { createFileRoute } from '@tanstack/react-router'
import Orders from '../pages/Orders'
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper'

export const Route = createFileRoute('/orders')({
  component: () => (
    <ProtectedRouteWrapper>
      <Orders />
    </ProtectedRouteWrapper>
  ),
})