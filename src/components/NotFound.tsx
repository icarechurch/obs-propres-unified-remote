import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

const REDIRECT_SECONDS = 8

const VERSES = [
  {
    reference: 'Psalm 119:105',
    text: 'Your word is a lamp to my feet and a light to my path.',
  },
  {
    reference: 'Jeremiah 29:11',
    text: 'For I know the plans I have for you, declares the Lord... to give you a future and a hope.',
  },
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all your heart... and he will make straight your paths.',
  },
] as const

function pickVerse(pathname: string) {
  let hash = 0

  for (const char of pathname) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return VERSES[hash % VERSES.length]
}

export function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()
  const [secondsRemaining, setSecondsRemaining] = useState(REDIRECT_SECONDS)

  const verse = useMemo(() => pickVerse(location.pathname), [location.pathname])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          void navigate({ to: '/' })
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [navigate])

  return (
    <main className="relative mx-auto flex min-h-[72vh] w-full items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(248,113,113,0.18),_transparent_35%),radial-gradient(circle_at_80%_75%,_rgba(251,191,36,0.12),_transparent_35%),linear-gradient(180deg,_rgba(10,10,11,1),_rgba(6,6,7,1))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-56 w-px -translate-x-1/2 bg-gradient-to-b from-amber-100/70 via-amber-100/20 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-px w-28 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-100/80 to-transparent"
      />

      <section className="relative z-10 w-full max-w-3xl rounded-2xl border border-amber-100/20 bg-black/45 p-8 text-center shadow-[0_0_80px_-30px_rgba(248,113,113,0.65)] backdrop-blur-md sm:p-12">
        <p className="text-xs font-semibold tracking-[0.3em] text-amber-100/70">
          ERROR 404
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          The page is missing, but grace is not.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
          The path you requested is not available in this dashboard. Take a
          moment, breathe, and choose where you want to be guided next.
        </p>

        <div className="mx-auto mt-6 w-full max-w-2xl rounded-lg border border-zinc-700/70 bg-zinc-950/70 px-4 py-3 text-xs text-zinc-300 sm:text-sm">
          Requested path: <span className="font-mono text-zinc-100">{location.pathname}</span>
        </div>

        <figure className="mx-auto mt-7 w-full max-w-2xl rounded-xl border border-amber-100/25 bg-amber-100/5 px-5 py-4 text-left">
          <blockquote className="text-sm italic leading-relaxed text-amber-50 sm:text-base">
            "{verse.text}"
          </blockquote>
          <figcaption className="mt-3 text-xs font-semibold tracking-[0.15em] text-amber-200/80 sm:text-sm">
            {verse.reference}
          </figcaption>
        </figure>

        <p className="mt-7 text-sm text-zinc-300 sm:text-base">
          Redirecting in{' '}
          <span className="font-semibold text-amber-200">{secondsRemaining}s</span>{' '}
          to your home page.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Return To The Sanctuary</Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </section>
    </main>
  )
}