import { signOutFn } from '@/server/functions/auth'
import type { AuthUser } from '@/server/functions/auth'
import { useLoaderData, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export function useAuth() {
  const { currentUser } = useLoaderData({ from: '__root__' }) as {
    currentUser: AuthUser | null
  }
  const signOutServer = useServerFn(signOutFn)
  const router = useRouter()

  const signOut = async () => {
    await signOutServer()
    await router.invalidate()
  }

  return {
    currentUser,
    signOut,
  }
}
