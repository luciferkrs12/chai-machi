import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

function SalesRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/orders', replace: true })
  }, [navigate])

  return null
}

export const Route = createFileRoute('/sales')({
  component: SalesRoute,
})
