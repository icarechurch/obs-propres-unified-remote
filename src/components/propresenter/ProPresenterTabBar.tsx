import { Clock, Film, Layers, Presentation, Zap } from 'lucide-react'
import type { ProPresenterTab } from '@/components/propresenter/types'

interface ProPresenterTabBarProps {
  activeTab: ProPresenterTab
  onTabChange: (nextTab: ProPresenterTab) => void
}

const tabs: Array<{
  id: ProPresenterTab
  label: string
  icon: typeof Presentation
}> = [
  { id: 'slides', label: 'Slides', icon: Presentation },
  { id: 'transport', label: 'Transport', icon: Film },
  { id: 'clear', label: 'Clear', icon: Layers },
  { id: 'macros', label: 'Macros', icon: Zap },
  { id: 'timers', label: 'Timers', icon: Clock },
]

export function ProPresenterTabBar({
  activeTab,
  onTabChange,
}: ProPresenterTabBarProps) {
  return (
    <div className="flex border-b border-neutral-800 overflow-x-auto shrink-0">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
            activeTab === id
              ? 'text-violet-400 border-violet-400'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
          onClick={() => onTabChange(id)}
        >
          <Icon size={11} />
          {label}
        </button>
      ))}
    </div>
  )
}
