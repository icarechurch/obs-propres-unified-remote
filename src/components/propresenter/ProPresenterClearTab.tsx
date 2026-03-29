import { Eye, Film, Layers, MessageSquare, Megaphone, Square, Volume2 } from 'lucide-react'

interface ProPresenterClearTabProps {
  onClearAll: () => void
  onClearSlide: () => void
  onClearMedia: () => void
  onClearAudio: () => void
  onClearAnnouncements: () => void
  onClearProps: () => void
  onClearMessages: () => void
}

export function ProPresenterClearTab({
  onClearAll,
  onClearSlide,
  onClearMedia,
  onClearAudio,
  onClearAnnouncements,
  onClearProps,
  onClearMessages,
}: ProPresenterClearTabProps) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
        Clear Layers
      </p>

      <button className="control-btn control-btn-danger w-full" onClick={onClearAll}>
        <Square size={14} /> Clear All Layers
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button className="control-btn control-btn-ghost" onClick={onClearSlide}>
          <Layers size={13} /> Clear Slide
        </button>
        <button className="control-btn control-btn-ghost" onClick={onClearMedia}>
          <Film size={13} /> Clear Media
        </button>
        <button className="control-btn control-btn-ghost" onClick={onClearAudio}>
          <Volume2 size={13} /> Clear Audio
        </button>
        <button
          className="control-btn control-btn-ghost"
          onClick={onClearAnnouncements}
        >
          <Megaphone size={13} /> Clear Announce
        </button>
        <button className="control-btn control-btn-ghost" onClick={onClearProps}>
          <Eye size={13} /> Clear Props
        </button>
        <button className="control-btn control-btn-ghost" onClick={onClearMessages}>
          <MessageSquare size={13} /> Clear Messages
        </button>
      </div>
    </div>
  )
}
