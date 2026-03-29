import { Presentation, RefreshCw } from 'lucide-react'
import type {
  LibraryPresentation,
  PlaylistPresentation,
} from '@/services/propresenter.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActivePres } from '@/components/propresenter/types'

interface ProPresenterActivePresentationCardProps {
  activePres: ActivePres | null
  source: 'playlist' | 'library'
  refreshingPresentationList: boolean
  switchingPresentation: boolean
  presentationOptionsCount: number
  selectedPresentationValue: string
  playlistPresentations: PlaylistPresentation[]
  libraryPresentations: LibraryPresentation[]
  presentationError: string | null
  onSourceChange: (source: 'playlist' | 'library') => void
  onSelectionChange: (value: string) => void
  onTriggerPresentation: () => void
  onRefreshPresentationOptions: () => void
}

export function ProPresenterActivePresentationCard({
  activePres,
  source,
  refreshingPresentationList,
  switchingPresentation,
  presentationOptionsCount,
  selectedPresentationValue,
  playlistPresentations,
  libraryPresentations,
  presentationError,
  onSourceChange,
  onSelectionChange,
  onTriggerPresentation,
  onRefreshPresentationOptions,
}: ProPresenterActivePresentationCardProps) {
  const isPlaylistSource = source === 'playlist'

  return (
    <div className="px-4 py-3 border-b border-neutral-800">
      <div className="status-card">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-500 mb-0.5">Active Presentation</p>
            <p className="text-sm font-medium text-white truncate">
              {activePres?.name ?? '-'}
            </p>
          </div>

          {activePres && (
            <div className="text-xs text-neutral-400 shrink-0 ml-3 text-right">
              <span className="text-white font-mono font-semibold">
                {activePres.currentSlide + 1}
              </span>
              <span className="text-neutral-600"> / </span>
              <span className="text-neutral-400">{activePres.totalSlides}</span>
            </div>
          )}
        </div>

        {activePres && activePres.totalSlides > 0 && (
          <div className="mt-2 h-1 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{
                width: `${((activePres.currentSlide + 1) / activePres.totalSlides) * 100}%`,
              }}
            />
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.04em] text-neutral-500">
              Change Presentation
            </p>
            {refreshingPresentationList && (
              <RefreshCw size={11} className="animate-spin text-neutral-500" />
            )}
          </div>

          <div className="flex rounded overflow-hidden border border-neutral-700">
            <button
              className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${
                isPlaylistSource
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              onClick={() => onSourceChange('playlist')}
            >
              Playlist
            </button>
            <button
              className={`flex-1 py-1.5 text-[11px] font-medium transition-colors border-l border-neutral-700 ${
                !isPlaylistSource
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              onClick={() => onSourceChange('library')}
            >
              Library
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select
                value={selectedPresentationValue}
                onValueChange={onSelectionChange}
                disabled={
                  refreshingPresentationList ||
                  switchingPresentation ||
                  presentationOptionsCount === 0
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-full min-w-0 border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 data-[placeholder]:text-neutral-500 focus-visible:border-violet-400/60 focus-visible:ring-violet-400/25 *:data-[slot=select-value]:text-left *:data-[slot=select-value]:text-xs *:data-[slot=select-value]:font-medium"
                >
                  <SelectValue
                    placeholder={
                      isPlaylistSource
                        ? presentationOptionsCount === 0
                          ? 'No playlist items found'
                          : 'Select playlist item'
                        : presentationOptionsCount === 0
                          ? 'No library presentations found'
                          : 'Select library presentation'
                    }
                  />
                </SelectTrigger>

                <SelectContent className="border-neutral-700 bg-neutral-900 text-neutral-100">
                  {isPlaylistSource
                    ? playlistPresentations.map((item) => (
                        <SelectItem
                          key={`${item.playlist.uuid || item.playlist.name}-${item.item.uuid}`}
                          value={`${item.playlist.uuid}::${item.item.uuid}`}
                          className="text-xs focus:bg-violet-500/20 focus:text-violet-100"
                        >
                          {`${item.presentation?.name || item.item.name} (${item.playlist.name})`}
                        </SelectItem>
                      ))
                    : libraryPresentations.map((item) => (
                        <SelectItem
                          key={`${item.library.uuid || item.library.name}-${item.presentation.uuid}`}
                          value={item.presentation.uuid}
                          className="text-xs focus:bg-violet-500/20 focus:text-violet-100"
                        >
                          {`${item.presentation.name} (${item.library.name})`}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <button
              className="control-btn control-btn-violet h-8 px-3 min-h-0 whitespace-nowrap"
              onClick={onTriggerPresentation}
              disabled={
                !selectedPresentationValue ||
                switchingPresentation ||
                refreshingPresentationList
              }
            >
              {switchingPresentation ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Presentation size={12} />
              )}
              Present
            </button>

            <button
              className="pp-slide-nav-btn"
              onClick={onRefreshPresentationOptions}
              title={
                isPlaylistSource
                  ? 'Refresh playlist items'
                  : 'Refresh library presentations'
              }
              disabled={refreshingPresentationList}
            >
              <RefreshCw
                size={13}
                className={refreshingPresentationList ? 'animate-spin' : ''}
              />
            </button>
          </div>

          {presentationError && (
            <p className="text-[11px] text-red-400">{presentationError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
