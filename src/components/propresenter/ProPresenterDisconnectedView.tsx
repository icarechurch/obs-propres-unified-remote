import { Lock, Presentation, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ProPresenterDisconnectedViewProps {
  protocol: 'http' | 'https'
  host: string
  port: number
  normalizedHost: string
  connecting: boolean
  connError: string | null
  onProtocolChange: (protocol: 'http' | 'https') => void
  onHostChange: (value: string) => void
  onPortChange: (value: number) => void
  onConnect: () => void
}

export function ProPresenterDisconnectedView({
  protocol,
  host,
  port,
  normalizedHost,
  connecting,
  connError,
  onProtocolChange,
  onHostChange,
  onPortChange,
  onConnect,
}: ProPresenterDisconnectedViewProps) {
  return (
    <div className="pp-panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Presentation size={16} className="text-violet-400" />
          <span className="panel-title">ProPresenter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <WifiOff size={13} className="text-neutral-500" />
          <span className="text-xs text-neutral-500">Disconnected</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
        <div className="w-full max-w-xs space-y-3">
          <div className="grid grid-cols-[2fr,1fr] gap-2">
            <div className="connect-form-group">
              <label className="connect-label">Conn Type</label>
              <div className="flex rounded overflow-hidden border border-neutral-700">
                <button
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                    protocol === 'http'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => onProtocolChange('http')}
                >
                  http://
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-l border-neutral-700 ${
                    protocol === 'https'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => onProtocolChange('https')}
                >
                  <Lock size={10} /> https://
                </button>
              </div>
            </div>

            <div className="connect-form-group">
              <label className="connect-label">Port</label>
              <input
                className="connect-input"
                type="number"
                value={port}
                onChange={(event) => onPortChange(Number(event.target.value))}
                placeholder="443"
              />
            </div>
          </div>

          <div className="connect-form-group">
            <label className="connect-label">URL</label>
            <input
              className="connect-input"
              value={host}
              onChange={(event) => onHostChange(event.target.value)}
              placeholder="localhost"
            />
          </div>

          <p className="text-xs text-neutral-600 font-mono text-center">
            {protocol}://{normalizedHost || host}:{port}
          </p>

          {connError && (
            <p className="text-xs text-red-400 text-center">{connError}</p>
          )}

          <button
            className="connect-btn w-full"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Wifi size={14} />
            )}
            {connecting ? 'Connecting...' : 'Connect to ProPresenter'}
          </button>

          <p className="text-xs text-neutral-600 text-center">
            Enable API in ProPresenter -&gt; Preferences -&gt; Network
          </p>
        </div>
      </div>
    </div>
  )
}
