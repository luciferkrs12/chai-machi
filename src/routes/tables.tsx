import { createFileRoute } from '@tanstack/react-router'
import Tables from '../pages/Tables'

export const Route = createFileRoute('/tables')({
  component: Tables,
})