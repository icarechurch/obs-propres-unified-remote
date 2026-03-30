import { Dashboard } from '@/components/Dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/connect')({
  component: ConnectPage,
})

function ConnectPage() {
  return <Dashboard />
}
