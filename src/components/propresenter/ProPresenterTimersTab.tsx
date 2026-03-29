import { Play, RotateCcw, Square } from 'lucide-react'
import type { PPTimer } from '@/services/propresenter.service'

interface ProPresenterTimersTabProps {
  timers: PPTimer[]
  onStartTimer: (timerUUID: string) => void
  onStopTimer: (timerUUID: string) => void
  onResetTimer: (timerUUID: string) => void
}

export function ProPresenterTimersTab({
  timers,
  onStartTimer,
  onStopTimer,
  onResetTimer,
}: ProPresenterTimersTabProps) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
        Timers
      </p>

      {timers.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-8">No timers found</p>
      ) : (
        timers.map((timer) => (
          <div key={timer.id.uuid} className="source-row">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-300 truncate">{timer.id.name}</p>
              <p className="text-xs text-neutral-600">
                {timer.is_running ? 'Running' : 'Stopped'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="icon-btn text-green-400 hover:text-green-300"
                onClick={() => onStartTimer(timer.id.uuid)}
              >
                <Play size={12} />
              </button>
              <button
                className="icon-btn text-neutral-400 hover:text-white"
                onClick={() => onStopTimer(timer.id.uuid)}
              >
                <Square size={12} />
              </button>
              <button
                className="icon-btn text-neutral-500 hover:text-amber-400"
                onClick={() => onResetTimer(timer.id.uuid)}
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
