import { useEffect, useState } from 'react'
import { LoadingScreen } from './LoadingScreen'
import { OBSPanel } from './OBSPanel'
import { ProPresenterRemotePanel } from './ProPresenterRemotePanel'

type DashboardLoadingState = 'visible' | 'fading' | 'hidden'

const LOADING_VISIBLE_MS = 2300
const LOADING_FADE_MS = 420

export function Dashboard() {
  const [loadingState, setLoadingState] =
    useState<DashboardLoadingState>('visible')

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setLoadingState('fading')
    }, LOADING_VISIBLE_MS)

    const hideTimer = window.setTimeout(() => {
      setLoadingState('hidden')
    }, LOADING_VISIBLE_MS + LOADING_FADE_MS)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  const showLoadingOverlay = loadingState !== 'hidden'

  return (
    <div className="dashboard" aria-busy={showLoadingOverlay}>
      {showLoadingOverlay && (
        <div
          className={`dashboard-loading-overlay ${
            loadingState === 'fading' ? 'is-fading' : ''
          }`}
        >
          <LoadingScreen />
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="flex items-center gap-3">
          <div className="header-cross">
            <div className="cross-v" />
            <div className="cross-h" />
          </div>
          <div>
            <h1 className="dashboard-title">Media Team Combined Remote</h1>
          </div>
        </div>
        <div className="text-xs text-neutral-600 font-mono hidden sm:block">
          Phase 1
        </div>
      </header>

      {/* Main Panels — side by side, half screen each */}
      <main className="panels-container">
        <div className="panel-wrapper">
          <OBSPanel />
        </div>
        <div className="panel-divider" />
        <div className="panel-wrapper">
          <ProPresenterRemotePanel />
        </div>
      </main>
    </div>
  )
}
