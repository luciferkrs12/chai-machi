import { createFileRoute } from '@tanstack/react-router'
import Customers from '../pages/Customers'
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper'

export const Route = createFileRoute('/customers')({
  component: () => (
    <ProtectedRouteWrapper>
      <Customers />
    </ProtectedRouteWrapper>
  ),
})