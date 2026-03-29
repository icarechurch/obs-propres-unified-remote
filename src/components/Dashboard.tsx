import { OBSPanel } from './OBSPanel'
import { ProPresenterRemotePanel } from './ProPresenterRemotePanel'

export function Dashboard() {
  return (
    <div className="dashboard">
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
