import { Presentation, RefreshCw, WifiOff } from 'lucide-react'

interface ProPresenterConnectedHeaderProps {
  loading: boolean
  onDisconnect: () => void
}

export function ProPresenterConnectedHeader({
  loading,
  onDisconnect,
}: ProPresenterConnectedHeaderProps) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-2">
        <Presentation size={16} className="text-violet-400" />
        <span className="panel-title">ProPresenter</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-green-400 border-green-400/30">
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Online
        </div>

        {loading && (
          <RefreshCw size={12} className="animate-spin text-neutral-500" />
        )}

        <button
          onClick={onDisconnect}
          className="icon-btn text-neutral-500 hover:text-red-400"
        >
          <WifiOff size={14} />
        </button>
      </div>
    </div>
  )
}
