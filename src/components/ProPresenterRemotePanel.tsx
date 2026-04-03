import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  proPresenterService,
  type ActivePresentationSlide,
  type LibraryPresentation,
  type Macro,
  type PlaylistPresentation,
  type PPTimer,
} from '@/services/propresenter.service'
import { ProPresenterActivePresentationCard } from '@/components/propresenter/ProPresenterActivePresentationCard'
import { ProPresenterClearTab } from '@/components/propresenter/ProPresenterClearTab'
import { ProPresenterConnectedHeader } from '@/components/propresenter/ProPresenterConnectedHeader'
import { ProPresenterDisconnectedView } from '@/components/propresenter/ProPresenterDisconnectedView'
import { ProPresenterMacrosTab } from '@/components/propresenter/ProPresenterMacrosTab'
import { ProPresenterSlidesTab } from '@/components/propresenter/ProPresenterSlidesTab'
import { ProPresenterTabBar } from '@/components/propresenter/ProPresenterTabBar'
import { ProPresenterTimersTab } from '@/components/propresenter/ProPresenterTimersTab'
import { ProPresenterTransportTab } from '@/components/propresenter/ProPresenterTransportTab'
import type {
  ActivePres,
  ProPresenterTab,
} from '@/components/propresenter/types'

const getPlaylistKey = (playlist: PlaylistPresentation['playlist']) => {
  const playlistUUID = playlist.uuid.trim()
  if (playlistUUID) return playlistUUID

  const playlistName = playlist.name.trim()
  if (playlistName) return `${playlistName}::${playlist.index}`

  return `${playlist.index}`
}

const getPlaylistItemKey = (item: PlaylistPresentation) => {
  const playlistKey = getPlaylistKey(item.playlist)
  const itemUUID = item.item.uuid.trim()
  if (itemUUID) return `${playlistKey}::${itemUUID}`

  const itemName = item.item.name.trim()
  return `${playlistKey}::${itemName || item.item.index}`
}

export function ProPresenterRemotePanel() {
  const [status, setStatus] = useState(proPresenterService.status)
  const [protocol, setProtocol] = useState<'http' | 'https'>('http')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(50001)
  const [connecting, setConnecting] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)

  const normalizedHost = host
    .trim()
    .replace(/^\w+:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')

  const [presentationSource, setPresentationSource] = useState<
    'playlist' | 'library'
  >('playlist')
  const [activePres, setActivePres] = useState<ActivePres | null>(null)
  const [libraryPresentations, setLibraryPresentations] = useState<
    LibraryPresentation[]
  >([])
  const [playlistPresentations, setPlaylistPresentations] = useState<
    PlaylistPresentation[]
  >([])
  const [selectedLibraryPresentationUUID, setSelectedLibraryPresentationUUID] =
    useState('')
  const [selectedPlaylistKey, setSelectedPlaylistKey] = useState('')
  const [selectedPlaylistItemKey, setSelectedPlaylistItemKey] = useState('')
  const [refreshingPresentationList, setRefreshingPresentationList] =
    useState(false)
  const [switchingPresentation, setSwitchingPresentation] = useState(false)
  const [presentationError, setPresentationError] = useState<string | null>(null)
  const [macros, setMacros] = useState<Macro[]>([])
  const [timers, setTimers] = useState<PPTimer[]>([])
  const [activeTab, setActiveTab] = useState<ProPresenterTab>('slides')

  const [jumpSlide, setJumpSlide] = useState('')
  const [loading, setLoading] = useState(false)
  const [hiddenSlideThumbnails, setHiddenSlideThumbnails] = useState<
    Record<string, true>
  >({})
  const manualSlideOverrideRef = useRef<{
    presentationUUID: string
    slideIndex: number
  } | null>(null)

  const applyManualSlideOverride = useCallback(
    (presentationUUID: string, requestedSlideIndex: number) => {
      const normalizedIndex = Math.max(Math.floor(requestedSlideIndex), 0)
      manualSlideOverrideRef.current = {
        presentationUUID,
        slideIndex: normalizedIndex,
      }

      setActivePres((current) => {
        if (!current || current.uuid !== presentationUUID) return current

        const clampedIndex =
          current.totalSlides > 0
            ? Math.min(Math.max(normalizedIndex, 0), current.totalSlides - 1)
            : normalizedIndex

        const matchingSlide = current.slides.find(
          (slide) => slide.index === clampedIndex,
        )

        return {
          ...current,
          currentSlide: clampedIndex,
          statusCurrentSlideUUID:
            matchingSlide?.uuid || current.statusCurrentSlideUUID,
        }
      })
    },
    [],
  )

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
        let resolvedCurrentSlide = pres.presentationCurrentSlide ?? 0
        const manualOverride = manualSlideOverrideRef.current
        const statusUUID = pres.statusCurrentSlideUUID?.trim() ?? ''

        if (manualOverride && manualOverride.presentationUUID === (pres.id?.uuid ?? '')) {
          const statusMatchedIndex = statusUUID
            ? (pres.slides ?? []).find((slide) => slide.uuid === statusUUID)
                ?.index ?? null
            : null

          if (typeof statusMatchedIndex === 'number' && Number.isFinite(statusMatchedIndex)) {
            resolvedCurrentSlide = statusMatchedIndex
            manualSlideOverrideRef.current = null
          } else {
            const serverReportedSlide = pres.presentationCurrentSlide ?? 0
            const isAmbiguousServerIndex =
              serverReportedSlide === 0 && manualOverride.slideIndex !== 0

            if (isAmbiguousServerIndex || serverReportedSlide === manualOverride.slideIndex) {
              resolvedCurrentSlide = manualOverride.slideIndex
            } else {
              resolvedCurrentSlide = serverReportedSlide
              manualSlideOverrideRef.current = null
            }
          }
        } else if (manualOverride && manualOverride.presentationUUID !== (pres.id?.uuid ?? '')) {
          manualSlideOverrideRef.current = null
        }

        setActivePres({
          name: pres.id?.name ?? 'Unknown',
          currentSlide: resolvedCurrentSlide,
          totalSlides: pres.presentationSlideCount ?? 0,
          uuid: pres.id?.uuid ?? '',
          slides: pres.slides ?? [],
          statusCurrentSlideUUID: pres.statusCurrentSlideUUID,
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

  const fetchPresentationOptions = useCallback(async () => {
    if (!proPresenterService.status.connected) return

    setRefreshingPresentationList(true)
    try {
      if (presentationSource === 'playlist') {
        const presentations =
          await proPresenterService.getPlaylistPresentations()
        setPlaylistPresentations(presentations)
      } else {
        const presentations = await proPresenterService.getLibraryPresentations()
        setLibraryPresentations(presentations)
      }
    } finally {
      setRefreshingPresentationList(false)
    }
  }, [presentationSource])

  useEffect(() => {
    if (!status.connected) {
      setLibraryPresentations([])
      setPlaylistPresentations([])
      setSelectedLibraryPresentationUUID('')
      setSelectedPlaylistKey('')
      setSelectedPlaylistItemKey('')
      setPresentationError(null)
      manualSlideOverrideRef.current = null
      return
    }

    void fetchStatus()
    void fetchPresentationOptions()

    const statusInterval = setInterval(() => {
      void fetchStatus()
    }, 3000)

    const presentationsInterval = setInterval(() => {
      void fetchPresentationOptions()
    }, 30000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(presentationsInterval)
    }
  }, [status.connected, fetchStatus, fetchPresentationOptions])

  useEffect(() => {
    setHiddenSlideThumbnails({})
  }, [activePres?.uuid])

  const playlistOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>()

    playlistPresentations.forEach((item) => {
      const value = getPlaylistKey(item.playlist)
      if (options.has(value)) return

      const playlistName = item.playlist.name.trim()
      const label =
        playlistName ||
        (item.playlist.index >= 0
          ? `Playlist ${item.playlist.index + 1}`
          : 'Playlist')

      options.set(value, { value, label })
    })

    return Array.from(options.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    )
  }, [playlistPresentations])

  useEffect(() => {
    if (playlistOptions.length === 0) {
      setSelectedPlaylistKey('')
      return
    }

    setSelectedPlaylistKey((currentKey) => {
      if (
        currentKey &&
        playlistOptions.some((option) => option.value === currentKey)
      ) {
        return currentKey
      }

      if (activePres?.uuid) {
        const activeMatch = playlistPresentations.find((item) => {
          return (
            item.presentation?.uuid === activePres.uuid ||
            item.item.uuid === activePres.uuid
          )
        })

        if (activeMatch) {
          return getPlaylistKey(activeMatch.playlist)
        }
      }

      return playlistOptions[0]?.value ?? ''
    })
  }, [playlistOptions, playlistPresentations, activePres?.uuid])

  const filteredPlaylistPresentations = useMemo(() => {
    if (!selectedPlaylistKey) return []

    return playlistPresentations.filter(
      (item) => getPlaylistKey(item.playlist) === selectedPlaylistKey,
    )
  }, [playlistPresentations, selectedPlaylistKey])

  useEffect(() => {
    if (filteredPlaylistPresentations.length === 0) {
      setSelectedPlaylistItemKey('')
      return
    }

    setSelectedPlaylistItemKey((currentKey) => {
      if (
        currentKey &&
        filteredPlaylistPresentations.some(
          (item) => getPlaylistItemKey(item) === currentKey,
        )
      ) {
        return currentKey
      }

      if (activePres?.uuid) {
        const activeMatch = filteredPlaylistPresentations.find((item) => {
          return (
            item.presentation?.uuid === activePres.uuid ||
            item.item.uuid === activePres.uuid
          )
        })

        if (activeMatch) {
          return getPlaylistItemKey(activeMatch)
        }
      }

      const firstItem = filteredPlaylistPresentations[0]
      return firstItem ? getPlaylistItemKey(firstItem) : ''
    })
  }, [filteredPlaylistPresentations, activePres?.uuid])

  useEffect(() => {
    if (libraryPresentations.length === 0) {
      setSelectedLibraryPresentationUUID('')
      return
    }

    setSelectedLibraryPresentationUUID((currentUUID) => {
      if (
        currentUUID &&
        libraryPresentations.some(
          (item) => item.presentation.uuid === currentUUID,
        )
      ) {
        return currentUUID
      }

      if (
        activePres?.uuid &&
        libraryPresentations.some(
          (item) => item.presentation.uuid === activePres.uuid,
        )
      ) {
        return activePres.uuid
      }

      return libraryPresentations[0]?.presentation.uuid ?? ''
    })
  }, [libraryPresentations, activePres?.uuid])

  const triggerSlideByIndex = (slideIndex: number) => {
    const presentationUUID = activePres?.uuid
    if (!presentationUUID) return

    void (async () => {
      const triggered = await proPresenterService.triggerSlideIndex(
        presentationUUID,
        slideIndex,
      )

      if (triggered) {
        applyManualSlideOverride(presentationUUID, slideIndex)
      }

      await fetchStatus()
    })()
  }

  const handlePreviousSlide = () => {
    const presentationUUID = activePres?.uuid
    if (!presentationUUID) return

    void (async () => {
      const triggered = await proPresenterService.triggerPreviousSlide()

      if (triggered) {
        applyManualSlideOverride(presentationUUID, (activePres?.currentSlide ?? 0) - 1)
      }

      await fetchStatus()
    })()
  }

  const handleNextSlide = () => {
    const presentationUUID = activePres?.uuid
    if (!presentationUUID) return

    void (async () => {
      const triggered = await proPresenterService.triggerNextSlide()

      if (triggered) {
        applyManualSlideOverride(presentationUUID, (activePres?.currentSlide ?? 0) + 1)
      }

      await fetchStatus()
    })()
  }

  const handleConnect = async () => {
    setConnecting(true)
    setConnError(null)
    const result = await proPresenterService.connect(
      normalizedHost || host,
      port,
      protocol,
    )

    if (!result.success) {
      setConnError(
        'Could not reach ProPresenter. Check host/port and ensure the API is enabled.',
      )
    }

    setConnecting(false)
  }

  const handleTriggerPresentation = async () => {
    if (switchingPresentation) return

    setSwitchingPresentation(true)
    setPresentationError(null)

    try {
      let success = false

      if (presentationSource === 'playlist') {
        if (!selectedPlaylistKey) {
          setPresentationError('Select a playlist first.')
          return
        }

        const selectedItem = filteredPlaylistPresentations.find(
          (item) => getPlaylistItemKey(item) === selectedPlaylistItemKey,
        )

        if (!selectedItem) {
          setPresentationError('Select a playlist item to present.')
          return
        }

        const playlistTarget =
          selectedItem.playlist.uuid ||
          selectedItem.playlist.name ||
          `${selectedItem.playlist.index}`

        success = await proPresenterService.triggerPlaylistItem(
          playlistTarget,
          selectedItem.item.uuid,
          selectedItem.item.index,
        )
      } else {
        const targetUUID = selectedLibraryPresentationUUID.trim()
        if (!targetUUID) {
          setPresentationError('Select a library presentation to present.')
          return
        }

        success = await proPresenterService.triggerPresentation(targetUUID)
      }

      if (!success) {
        setPresentationError(
          presentationSource === 'playlist'
            ? 'Unable to trigger the selected playlist item.'
            : 'Unable to trigger the selected library presentation.',
        )
        return
      }

      await fetchStatus()
    } finally {
      setSwitchingPresentation(false)
    }
  }

  const isPlaylistSource = presentationSource === 'playlist'
  const presentationOptionsCount = isPlaylistSource
    ? filteredPlaylistPresentations.length
    : libraryPresentations.length
  const selectedPresentationValue = isPlaylistSource
    ? selectedPlaylistItemKey
    : selectedLibraryPresentationUUID

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

  if (!status.connected) {
    return (
      <ProPresenterDisconnectedView
        protocol={protocol}
        host={host}
        port={port}
        normalizedHost={normalizedHost}
        connecting={connecting}
        connError={connError}
        onProtocolChange={setProtocol}
        onHostChange={setHost}
        onPortChange={setPort}
        onConnect={() => {
          void handleConnect()
        }}
      />
    )
  }

  return (
    <div className="pp-panel h-full flex flex-col">
      <ProPresenterConnectedHeader
        loading={loading}
        onDisconnect={() => proPresenterService.disconnect()}
      />

      <ProPresenterActivePresentationCard
        activePres={activePres}
        source={presentationSource}
        refreshingPresentationList={refreshingPresentationList}
        switchingPresentation={switchingPresentation}
        presentationOptionsCount={presentationOptionsCount}
        selectedPlaylistValue={selectedPlaylistKey}
        selectedPresentationValue={selectedPresentationValue}
        playlistOptions={playlistOptions}
        playlistPresentations={filteredPlaylistPresentations}
        libraryPresentations={libraryPresentations}
        presentationError={presentationError}
        onSourceChange={(source) => {
          setPresentationSource(source)
          setPresentationError(null)
        }}
        onPlaylistSelectionChange={(value) => {
          setSelectedPlaylistKey(value)
          setPresentationError(null)
        }}
        onSelectionChange={(value) => {
          if (isPlaylistSource) {
            setSelectedPlaylistItemKey(value)
          } else {
            setSelectedLibraryPresentationUUID(value)
          }
          setPresentationError(null)
        }}
        onTriggerPresentation={() => {
          void handleTriggerPresentation()
        }}
        onRefreshPresentationOptions={() => {
          void fetchPresentationOptions()
        }}
      />

      <ProPresenterTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'slides' && (
          <ProPresenterSlidesTab
            activePres={activePres}
            slidesForGrid={slidesForGrid}
            jumpSlide={jumpSlide}
            loading={loading}
            hiddenSlideThumbnails={hiddenSlideThumbnails}
            onJumpSlideChange={setJumpSlide}
            onTriggerSlideByIndex={triggerSlideByIndex}
            onPreviousSlide={handlePreviousSlide}
            onNextSlide={handleNextSlide}
            onRefreshSlides={() => {
              void fetchStatus()
            }}
            onHideThumbnail={(thumbnailKey) => {
              setHiddenSlideThumbnails((previous) => ({
                ...previous,
                [thumbnailKey]: true,
              }))
            }}
            getThumbnailUrl={(presentationUUID, slideIndex) =>
              proPresenterService.getPresentationThumbnailUrl(
                presentationUUID,
                slideIndex,
                320,
                'jpeg',
              )
            }
          />
        )}

        {activeTab === 'transport' && (
          <ProPresenterTransportTab
            onPlay={() => {
              void proPresenterService.playTransportVideo()
            }}
            onPause={() => {
              void proPresenterService.pauseTransportVideo()
            }}
            onSkipBack={() => {
              void proPresenterService.skipBackVideo(10)
            }}
            onSkipForward={() => {
              void proPresenterService.skipForwardVideo(10)
            }}
            onShowMedia={() => {
              void proPresenterService.showMedia()
            }}
            onHideMedia={() => {
              void proPresenterService.hideMedia()
            }}
          />
        )}

        {activeTab === 'clear' && (
          <ProPresenterClearTab
            onClearAll={() => {
              void proPresenterService.clearAll()
            }}
            onClearSlide={() => {
              void proPresenterService.clearSlide()
            }}
            onClearMedia={() => {
              void proPresenterService.clearMedia()
            }}
            onClearAudio={() => {
              void proPresenterService.clearAudio()
            }}
            onClearAnnouncements={() => {
              void proPresenterService.clearAnnouncements()
            }}
            onClearProps={() => {
              void proPresenterService.clearProps()
            }}
            onClearMessages={() => {
              void proPresenterService.clearMessages()
            }}
          />
        )}

        {activeTab === 'macros' && (
          <ProPresenterMacrosTab
            macros={macros}
            onTriggerMacro={(macroUUID) => {
              void proPresenterService.triggerMacro(macroUUID)
            }}
          />
        )}

        {activeTab === 'timers' && (
          <ProPresenterTimersTab
            timers={timers}
            onStartTimer={(timerUUID) => {
              void proPresenterService.startTimer(timerUUID)
            }}
            onStopTimer={(timerUUID) => {
              void proPresenterService.stopTimer(timerUUID)
            }}
            onResetTimer={(timerUUID) => {
              void proPresenterService.resetTimer(timerUUID)
            }}
          />
        )}
      </div>
    </div>
  )
}
