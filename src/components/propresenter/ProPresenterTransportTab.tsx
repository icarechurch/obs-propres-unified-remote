import { Eye, Pause, Play, SkipBack, SkipForward, VolumeX } from 'lucide-react'

interface ProPresenterTransportTabProps {
  onPlay: () => void
  onPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onShowMedia: () => void
  onHideMedia: () => void
}

export function ProPresenterTransportTab({
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onShowMedia,
  onHideMedia,
}: ProPresenterTransportTabProps) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
        Video Transport
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button className="control-btn control-btn-primary" onClick={onPlay}>
          <Play size={14} /> Play
        </button>
        <button className="control-btn control-btn-ghost" onClick={onPause}>
          <Pause size={14} /> Pause
        </button>
        <button className="control-btn control-btn-ghost" onClick={onSkipBack}>
          <SkipBack size={14} /> -10s
        </button>
        <button className="control-btn control-btn-ghost" onClick={onSkipForward}>
          <SkipForward size={14} /> +10s
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button className="control-btn control-btn-primary" onClick={onShowMedia}>
          <Eye size={14} /> Show Media
        </button>
        <button className="control-btn control-btn-ghost" onClick={onHideMedia}>
          <VolumeX size={14} /> Hide Media
        </button>
      </div>
    </div>
  )
}
