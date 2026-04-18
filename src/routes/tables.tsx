import { createFileRoute } from '@tanstack/react-router'
import Tables from '../pages/Tables'
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper'

export const Route = createFileRoute('/tables')({
  component: () => (
    <ProtectedRouteWrapper>
      <Tables />
    </ProtectedRouteWrapper>
  ),
})