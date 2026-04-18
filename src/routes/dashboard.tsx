import { createFileRoute } from '@tanstack/react-router'
import Layout from '@/components/Layout'
import Dashboard from '../pages/Dashboard'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function DashboardRoute() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Layout title="Dashboard">
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
})
