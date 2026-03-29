import { useState, useEffect, useCallback } from 'react'
import {
  proPresenterService,
  ActivePresentationSlide,
  Macro,
  PPTimer,
} from '@/services/propresenter.service'
import {
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Film,
  Volume2,
  VolumeX,
  Megaphone,
  Square,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Zap,
  Clock,
  MessageSquare,
  Eye,
  Presentation,
  Lock,
} from 'lucide-react'

interface ActivePres {
  name: string
  currentSlide: number
  totalSlides: number
  uuid: string
  slides: ActivePresentationSlide[]
}

export function ProPresenterRemotePanel() {
  const [status, setStatus] = useState(proPresenterService.status)
  const [protocol, setProtocol] = useState<'http' | 'https'>('http')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(50001)
  const [connecting, setConnecting] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)

  const [activePres, setActivePres] = useState<ActivePres | null>(null)
  const [macros, setMacros] = useState<Macro[]>([])
  const [timers, setTimers] = useState<PPTimer[]>([])
  const [activeTab, setActiveTab] = useState<
    'slides' | 'clear' | 'macros' | 'timers' | 'transport'
  >('slides')

  const [jumpSlide, setJumpSlide] = useState('')
  const [loading, setLoading] = useState(false)
  const [hiddenSlideThumbnails, setHiddenSlideThumbnails] = useState<
    Record<string, true>
  >({})

  useEffect(() => {
    const unsub = proPresenterService.subscribe(() =>
      setStatus({ ...proPresenterService.status }),
    )
    return unsub
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!proPresenterService.status.connected) return
    setLoading(true)
    try {
      const [pres, macroList, timerList] = await Promise.all([
        proPresenterService.getActivePresentation(),
        proPresenterService.getMacros(),
        proPresenterService.getTimers(),
      ])
      if (pres) {
        setActivePres({
          name: pres.id?.name ?? 'Unknown',
          currentSlide: pres.presentationCurrentSlide ?? 0,
          totalSlides: pres.presentationSlideCount ?? 0,
          uuid: pres.id?.uuid ?? '',
          slides: pres.slides ?? [],
        })
      } else {
        setActivePres(null)
      }
      setMacros(macroList)
      setTimers(timerList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status.connected) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [status.connected, fetchStatus])

  useEffect(() => {
    setHiddenSlideThumbnails({})
  }, [activePres?.uuid])

  const handleConnect = async () => {
    setConnecting(true)
    setConnError(null)
    const result = await proPresenterService.connect(host, port, protocol)
    if (!result.success)
      setConnError(
        'Could not reach ProPresenter. Check host/port and ensure the API is enabled.',
      )
    setConnecting(false)
  }

  const tabs = [
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'transport', label: 'Transport', icon: Film },
    { id: 'clear', label: 'Clear', icon: Layers },
    { id: 'macros', label: 'Macros', icon: Zap },
    { id: 'timers', label: 'Timers', icon: Clock },
  ] as const

  const triggerSlideByIndex = (slideIndex: number) => {
    if (!activePres?.uuid) return
    void proPresenterService.triggerSlideIndex(activePres.uuid, slideIndex)
  }

  const slidesForGrid: ActivePresentationSlide[] = activePres
    ? activePres.slides.length > 0
      ? activePres.slides
      : Array.from({ length: activePres.totalSlides }, (_, index) => ({
          uuid: `${activePres.uuid || 'slide'}-${index}`,
          index,
          label: `Slide ${index + 1}`,
          text: '',
          notes: '',
          groupName: '',
        }))
    : []

  // ── Disconnected ────────────────────────────────────────────────────────────
  if (!status.connected) {
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

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-full max-w-xs space-y-3">
            {/* Protocol toggle */}
            <div className="connect-form-group">
              <label className="connect-label">Protocol</label>
              <div className="flex rounded overflow-hidden border border-neutral-700">
                <button
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                    protocol === 'http'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => setProtocol('http')}
                >
                  http://
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-l border-neutral-700 ${
                    protocol === 'https'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => setProtocol('https')}
                >
                  <Lock size={10} /> https://
                </button>
              </div>
            </div>

            <div className="connect-form-group">
              <label className="connect-label">Host</label>
              <input
                className="connect-input"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div className="connect-form-group">
              <label className="connect-label">Port</label>
              <input
                className="connect-input"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="50001"
              />
            </div>
            {/* Preview URL */}
            <p className="text-xs text-neutral-600 font-mono text-center">
              {protocol}://{host}:{port}
            </p>
            {connError && (
              <p className="text-xs text-red-400 text-center">{connError}</p>
            )}
            <button
              className="connect-btn w-full"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Wifi size={14} />
              )}
              {connecting ? 'Connecting…' : 'Connect to ProPresenter'}
            </button>
            <p className="text-xs text-neutral-600 text-center">
              Enable API in ProPresenter → Preferences → Network
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  return (
    <div className="pp-panel h-full flex flex-col">
      {/* Header */}
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
            onClick={() => proPresenterService.disconnect()}
            className="icon-btn text-neutral-500 hover:text-red-400"
          >
            <WifiOff size={14} />
          </button>
        </div>
      </div>

      {/* Active Presentation Info */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="status-card">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500 mb-0.5">
                Active Presentation
              </p>
              <p className="text-sm font-medium text-white truncate">
                {activePres?.name ?? '—'}
              </p>
            </div>
            {activePres && (
              <div className="text-xs text-neutral-400 shrink-0 ml-3 text-right">
                <span className="text-white font-mono font-semibold">
                  {activePres.currentSlide + 1}
                </span>
                <span className="text-neutral-600"> / </span>
                <span className="text-neutral-400">
                  {activePres.totalSlides}
                </span>
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
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-neutral-800 overflow-x-auto shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? 'text-violet-400 border-violet-400'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Slides Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'slides' && (
          <div className="p-4 space-y-3">
            <div className="pp-slides-toolbar">
              <button
                className="pp-slide-nav-btn"
                onClick={() => proPresenterService.triggerPreviousSlide()}
                title="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="pp-slide-nav-btn pp-slide-nav-btn-next"
                onClick={() => proPresenterService.triggerNextSlide()}
                title="Next slide"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="pp-slide-nav-btn"
                onClick={fetchStatus}
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
                    max={
                      activePres.totalSlides > 0
                        ? activePres.totalSlides
                        : undefined
                    }
                    value={jumpSlide}
                    onChange={(e) => setJumpSlide(e.target.value)}
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
                        triggerSlideByIndex(idx)
                        setJumpSlide('')
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
                  const isActive = slideIndex === activePres.currentSlide
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
                      onClick={() => triggerSlideByIndex(slideIndex)}
                    >
                      <div className="pp-slide-thumb">
                        {!thumbnailHidden && activePres.uuid ? (
                          <img
                            className="pp-slide-thumb-image"
                            src={proPresenterService.getPresentationThumbnailUrl(
                              activePres.uuid,
                              slideIndex,
                              320,
                              'jpeg',
                            )}
                            alt={`Slide ${slideIndex + 1} preview`}
                            loading="lazy"
                            onError={() => {
                              setHiddenSlideThumbnails((previous) => ({
                                ...previous,
                                [thumbnailKey]: true,
                              }))
                            }}
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
                      {slide.groupName && (
                        <p className="pp-slide-meta">{slide.groupName}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Transport Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'transport' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Video Transport
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="control-btn control-btn-primary"
                onClick={() => proPresenterService.playTransportVideo()}
              >
                <Play size={14} /> Play
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.pauseTransportVideo()}
              >
                <Pause size={14} /> Pause
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.skipBackVideo(10)}
              >
                <SkipBack size={14} /> −10s
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.skipForwardVideo(10)}
              >
                <SkipForward size={14} /> +10s
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                className="control-btn control-btn-primary"
                onClick={() => proPresenterService.showMedia()}
              >
                <Eye size={14} /> Show Media
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.hideMedia()}
              >
                <VolumeX size={14} /> Hide Media
              </button>
            </div>
          </div>
        )}

        {/* ── Clear Tab ───────────────────────────────────────────────────────── */}
        {activeTab === 'clear' && (
          <div className="p-4 space-y-2">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Clear Layers
            </p>
            <button
              className="control-btn control-btn-danger w-full"
              onClick={() => proPresenterService.clearAll()}
            >
              <Square size={14} /> Clear All Layers
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearSlide()}
              >
                <Layers size={13} /> Clear Slide
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearMedia()}
              >
                <Film size={13} /> Clear Media
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearAudio()}
              >
                <Volume2 size={13} /> Clear Audio
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearAnnouncements()}
              >
                <Megaphone size={13} /> Clear Announce
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearProps()}
              >
                <Eye size={13} /> Clear Props
              </button>
              <button
                className="control-btn control-btn-ghost"
                onClick={() => proPresenterService.clearMessages()}
              >
                <MessageSquare size={13} /> Clear Messages
              </button>
            </div>
          </div>
        )}

        {/* ── Macros Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'macros' && (
          <div className="p-4 space-y-2">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
              Macros
            </p>
            {macros.length === 0 ? (
              <p className="text-xs text-neutral-600 text-center py-8">
                No macros found
              </p>
            ) : (
              macros.map((macro) => (
                <button
                  key={macro.id.uuid}
                  className="control-btn control-btn-ghost w-full justify-start"
                  onClick={() =>
                    proPresenterService.triggerMacro(macro.id.uuid)
                  }
                >
                  <Zap size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">{macro.id.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Timers Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'timers' && (
          <div className="p-4 space-y-2">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
              Timers
            </p>
            {timers.length === 0 ? (
              <p className="text-xs text-neutral-600 text-center py-8">
                No timers found
              </p>
            ) : (
              timers.map((timer) => (
                <div key={timer.id.uuid} className="source-row">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 truncate">
                      {timer.id.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {timer.is_running ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="icon-btn text-green-400 hover:text-green-300"
                      onClick={() =>
                        proPresenterService.startTimer(timer.id.uuid)
                      }
                    >
                      <Play size={12} />
                    </button>
                    <button
                      className="icon-btn text-neutral-400 hover:text-white"
                      onClick={() =>
                        proPresenterService.stopTimer(timer.id.uuid)
                      }
                    >
                      <Square size={12} />
                    </button>
                    <button
                      className="icon-btn text-neutral-500 hover:text-amber-400"
                      onClick={() =>
                        proPresenterService.resetTimer(timer.id.uuid)
                      }
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
