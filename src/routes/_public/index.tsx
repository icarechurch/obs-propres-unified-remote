import { Dashboard } from '@/components/Dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
  component: Index,
})

function Index() {
  return <Dashboard />
}
