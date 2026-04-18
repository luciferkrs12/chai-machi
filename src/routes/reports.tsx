import { createFileRoute } from '@tanstack/react-router'
import Reports from '../pages/Reports'
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper'

export const Route = createFileRoute('/reports')({
  component: () => (
    <ProtectedRouteWrapper>
      <Reports />
    </ProtectedRouteWrapper>
  ),
})