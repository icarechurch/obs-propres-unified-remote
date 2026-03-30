import { useEffect, useState } from 'react'
import { Monitor, Video } from 'lucide-react'

type LoadingTarget = {
  id: 'obs' | 'pp'
  label: string
  shortLabel: string
  detail: string
}

const LOADING_TARGETS: LoadingTarget[] = [
  {
    id: 'obs',
    label: 'OBS Studio',
    shortLabel: 'OBS',
    detail: 'Syncing scenes, stream state, and preview feed...',
  },
  {
    id: 'pp',
    label: 'ProPresenter',
    shortLabel: 'ProPresenter',
    detail: 'Syncing slides, macros, timers, and transport controls...',
  },
]

export function LoadingScreen() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % LOADING_TARGETS.length)
    }, 1200)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const activeTarget = LOADING_TARGETS[activeIndex]

  return (
    <div
      className={`loading-screen loading-screen-${activeTarget.id}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="loading-screen-atmosphere" aria-hidden="true" />
      <div className="loading-screen-grid" aria-hidden="true" />

      <div className="loading-screen-shell">
        <div className="loading-screen-brand" aria-hidden="true">
          <span className="loading-screen-brand-chip loading-screen-brand-chip-obs">
            <Monitor size={14} />
            OBS
          </span>
          <span className="loading-screen-brand-link" />
          <span className="loading-screen-brand-chip loading-screen-brand-chip-pp">
            <Video size={14} />
            ProPresenter
          </span>
        </div>

        <p className="loading-screen-kicker">Media Team Combined Remote</p>
        <h2 className="loading-screen-title">Preparing Control Surface</h2>
        <p className="loading-screen-subtitle">
          Alternating sync between OBS and ProPresenter.
        </p>

        <div className="loading-screen-stages" aria-hidden="true">
          {LOADING_TARGETS.map((target, index) => (
            <div
              key={target.id}
              className={`loading-stage-pill loading-stage-pill-${target.id} ${
                index === activeIndex ? 'is-active' : ''
              }`}
            >
              <span className="loading-stage-ping" />
              <span>{target.shortLabel}</span>
            </div>
          ))}
        </div>

        <div className="loading-screen-current">
          {LOADING_TARGETS.map((target, index) => (
            <p
              key={target.id}
              className={`loading-screen-current-line ${
                index === activeIndex ? 'is-active' : ''
              }`}
            >
              <span className="loading-screen-current-label">{target.label}</span>
              <span className="loading-screen-current-detail">{target.detail}</span>
            </p>
          ))}
        </div>

        <div className="loading-screen-progress" aria-hidden="true">
          <span className="loading-screen-progress-track" />
        </div>
      </div>
    </div>
  )
}
