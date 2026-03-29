import { useCallback, useEffect, useState } from 'react'
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
      setSelectedPlaylistItemKey('')
      setPresentationError(null)
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

  useEffect(() => {
    if (playlistPresentations.length === 0) {
      setSelectedPlaylistItemKey('')
      return
    }

    setSelectedPlaylistItemKey((currentKey) => {
      if (
        currentKey &&
        playlistPresentations.some(
          (item) => `${item.playlist.uuid}::${item.item.uuid}` === currentKey,
        )
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
          return `${activeMatch.playlist.uuid}::${activeMatch.item.uuid}`
        }
      }

      const firstItem = playlistPresentations[0]
      return firstItem
        ? `${firstItem.playlist.uuid}::${firstItem.item.uuid}`
        : ''
    })
  }, [playlistPresentations, activePres?.uuid])

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
    if (!activePres?.uuid) return
    void proPresenterService.triggerSlideIndex(activePres.uuid, slideIndex)
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
        const selectedItem = playlistPresentations.find(
          (item) =>
            `${item.playlist.uuid}::${item.item.uuid}` === selectedPlaylistItemKey,
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
    ? playlistPresentations.length
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
        selectedPresentationValue={selectedPresentationValue}
        playlistPresentations={playlistPresentations}
        libraryPresentations={libraryPresentations}
        presentationError={presentationError}
        onSourceChange={(source) => {
          setPresentationSource(source)
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
            onPreviousSlide={() => {
              void proPresenterService.triggerPreviousSlide()
            }}
            onNextSlide={() => {
              void proPresenterService.triggerNextSlide()
            }}
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
