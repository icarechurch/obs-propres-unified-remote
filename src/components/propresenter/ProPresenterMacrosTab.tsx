import { Zap } from 'lucide-react'
import type { Macro } from '@/services/propresenter.service'

interface ProPresenterMacrosTabProps {
  macros: Macro[]
  onTriggerMacro: (macroUUID: string) => void
}

export function ProPresenterMacrosTab({
  macros,
  onTriggerMacro,
}: ProPresenterMacrosTabProps) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
        Macros
      </p>

      {macros.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-8">No macros found</p>
      ) : (
        macros.map((macro) => (
          <button
            key={macro.id.uuid}
            className="control-btn control-btn-ghost w-full justify-start"
            onClick={() => onTriggerMacro(macro.id.uuid)}
          >
            <Zap size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">{macro.id.name}</span>
          </button>
        ))
      )}
    </div>
  )
}
