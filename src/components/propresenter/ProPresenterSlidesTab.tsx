import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { ActivePresentationSlide } from '@/services/propresenter.service'
import type { ActivePres } from '@/components/propresenter/types'

interface ProPresenterSlidesTabProps {
  activePres: ActivePres | null
  slidesForGrid: ActivePresentationSlide[]
  jumpSlide: string
  loading: boolean
  hiddenSlideThumbnails: Record<string, true>
  onJumpSlideChange: (value: string) => void
  onTriggerSlideByIndex: (slideIndex: number) => void
  onPreviousSlide: () => void
  onNextSlide: () => void
  onRefreshSlides: () => void
  onHideThumbnail: (thumbnailKey: string) => void
  getThumbnailUrl: (presentationUUID: string, slideIndex: number) => string
}

export function ProPresenterSlidesTab({
  activePres,
  slidesForGrid,
  jumpSlide,
  loading,
  hiddenSlideThumbnails,
  onJumpSlideChange,
  onTriggerSlideByIndex,
  onPreviousSlide,
  onNextSlide,
  onRefreshSlides,
  onHideThumbnail,
  getThumbnailUrl,
}: ProPresenterSlidesTabProps) {
  const normalizeSlideValue = (value: string | undefined) =>
    (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

  const statusUUID = normalizeSlideValue(activePres?.statusCurrentSlideUUID)

  return (
    <div className="p-4 space-y-3">
      <div className="pp-slides-toolbar">
        <button
          className="pp-slide-nav-btn"
          onClick={onPreviousSlide}
          title="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          className="pp-slide-nav-btn pp-slide-nav-btn-next"
          onClick={onNextSlide}
          title="Next slide"
        >
          <ChevronRight size={16} />
        </button>

        <button
          className="pp-slide-nav-btn"
          onClick={onRefreshSlides}
          title="Refresh slides"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {activePres && (
          <div className="pp-slide-jump">
            <input
              className="connect-input pp-slide-jump-input"
              type="number"
              min={1}
              max={activePres.totalSlides > 0 ? activePres.totalSlides : undefined}
              value={jumpSlide}
              onChange={(event) => onJumpSlideChange(event.target.value)}
              placeholder="#"
            />

            <button
              className="control-btn control-btn-violet h-8 px-3 min-h-0"
              onClick={() => {
                const idx = parseInt(jumpSlide, 10) - 1
                if (
                  !Number.isNaN(idx) &&
                  idx >= 0 &&
                  (!activePres.totalSlides || idx < activePres.totalSlides)
                ) {
                  onTriggerSlideByIndex(idx)
                  onJumpSlideChange('')
                }
              }}
            >
              Go
            </button>
          </div>
        )}
      </div>

      {!activePres ? (
        <div className="status-card text-center py-8">
          <p className="text-sm text-neutral-300">No active presentation</p>
          <p className="text-xs text-neutral-600 mt-1">
            Start a presentation in ProPresenter to see slides.
          </p>
        </div>
      ) : slidesForGrid.length === 0 ? (
        <div className="status-card text-center py-8">
          <p className="text-sm text-neutral-300">No slides available</p>
          <p className="text-xs text-neutral-600 mt-1">
            Refresh after loading a presentation with slides.
          </p>
        </div>
      ) : (
        <div className="pp-slide-grid">
          {slidesForGrid.map((slide, index) => {
            const slideIndex = slide.index ?? index
            const slideUUID = normalizeSlideValue(slide.uuid)
            const matchesStatusUUID = Boolean(statusUUID && slideUUID === statusUUID)
            const isActive =
              matchesStatusUUID || slideIndex === activePres.currentSlide
            const thumbnailKey = `${activePres.uuid}:${slideIndex}`
            const thumbnailHidden = hiddenSlideThumbnails[thumbnailKey]
            const slideTitle =
              slide.label?.trim() ||
              slide.text?.trim() ||
              `Slide ${slideIndex + 1}`
            const slideContent =
              slide.text?.trim() || slide.notes?.trim() || 'Tap to trigger'

            return (
              <button
                key={slide.uuid || `${activePres.uuid}-${slideIndex}`}
                className={`pp-slide-card ${isActive ? 'pp-slide-card-active' : ''}`}
                onClick={() => onTriggerSlideByIndex(slideIndex)}
              >
                <div className="pp-slide-thumb">
                  {!thumbnailHidden && activePres.uuid ? (
                    <img
                      className="pp-slide-thumb-image"
                      src={getThumbnailUrl(activePres.uuid, slideIndex)}
                      alt={`Slide ${slideIndex + 1} preview`}
                      loading="lazy"
                      onError={() => onHideThumbnail(thumbnailKey)}
                    />
                  ) : (
                    <div className="pp-slide-thumb-fallback">No Preview</div>
                  )}
                </div>

                <div className="pp-slide-card-top">
                  <span className="pp-slide-number">Slide {slideIndex + 1}</span>
                  {isActive && <span className="pp-slide-live-pill">Live</span>}
                </div>

                <p className="pp-slide-title">{slideTitle}</p>
                <p className="pp-slide-subtitle">{slideContent}</p>
                {slide.groupName && <p className="pp-slide-meta">{slide.groupName}</p>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
