import { useState, useEffect, useCallback, useRef } from 'react'
import { obsService, OBSScene, OBSSceneItem } from '@/services/obs.service'
import {
  Wifi,
  WifiOff,
  Play,
  Square,
  Circle,
  Video,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Globe,
  RefreshCw,
  Monitor,
  Lock,
} from 'lucide-react'

const LOCAL_STUDIO_MODE_STORAGE_KEY = 'obs.localStudioMode.enabled'

export function OBSPanel() {
  const [status, setStatus] = useState(obsService.status)
  const [protocol, setProtocol] = useState<'ws' | 'wss'>('ws')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(4455)
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStudioMode, setLocalStudioMode] = useState(false)
  const [localStudioModeReady, setLocalStudioModeReady] = useState(false)
  const [localPreviewScene, setLocalPreviewScene] = useState<string | null>(
    null,
  )
  const [localPreviewFrame, setLocalPreviewFrame] = useState<string | null>(
    null,
  )
  const [localPreviewLoading, setLocalPreviewLoading] = useState(false)
  const [localPreviewError, setLocalPreviewError] = useState<string | null>(
    null,
  )
  const [studioActionError, setStudioActionError] = useState<string | null>(
    null,
  )
  const [transitioning, setTransitioning] = useState(false)

  // Scene management
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [sceneItems, setSceneItems] = useState<OBSSceneItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [view, setView] = useState<
    'main' | 'sceneManager' | 'scenes' | 'addSource' | 'editSource'
  >('main')

  // Create scene
  const [newSceneName, setNewSceneName] = useState('')
  const [renamingScene, setRenamingScene] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Browser source
  const [bsName, setBsName] = useState('')
  const [bsUrl, setBsUrl] = useState('')
  const [bsWidth, setBsWidth] = useState(1920)
  const [bsHeight, setBsHeight] = useState(1080)
  const [editingItem, setEditingItem] = useState<OBSSceneItem | null>(null)
  const [editBsUrl, setEditBsUrl] = useState('')
  const [livePreview, setLivePreview] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewRequestRef = useRef(0)
  const localPreviewRequestRef = useRef(0)

  useEffect(() => {
    const unsub = obsService.subscribe(() =>
      setStatus({ ...obsService.status }),
    )
    return unsub
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setLocalStudioMode(
      window.localStorage.getItem(LOCAL_STUDIO_MODE_STORAGE_KEY) === '1',
    )
    setLocalStudioModeReady(true)
  }, [])

  useEffect(() => {
    if (!localStudioModeReady || typeof window === 'undefined') return
    window.localStorage.setItem(
      LOCAL_STUDIO_MODE_STORAGE_KEY,
      localStudioMode ? '1' : '0',
    )
  }, [localStudioMode, localStudioModeReady])

  const refreshLivePreview = useCallback(
    async (showLoading = false) => {
      if (!status.connected || !status.currentScene) {
        setLivePreview(null)
        setPreviewError(null)
        setPreviewLoading(false)
        return
      }

      const requestId = ++previewRequestRef.current
      if (showLoading) setPreviewLoading(true)

      try {
        const frame = await obsService.getProgramSceneScreenshot(960, 540, 70)
        if (requestId !== previewRequestRef.current) return

        if (frame) {
          setLivePreview(frame)
          setPreviewError(null)
        } else {
          setPreviewError('No frame available for the active scene.')
        }
      } catch (err) {
        if (requestId !== previewRequestRef.current) return
        setPreviewError(
          (err as Error).message || 'Unable to load preview from OBS.',
        )
      } finally {
        if (requestId === previewRequestRef.current) {
          setPreviewLoading(false)
        }
      }
    },
    [status.connected, status.currentScene],
  )

  const refreshLocalPreview = useCallback(
    async (showLoading = false) => {
      if (!status.connected || !localStudioMode || !localPreviewScene) {
        setLocalPreviewFrame(null)
        setLocalPreviewError(null)
        setLocalPreviewLoading(false)
        return
      }

      const requestId = ++localPreviewRequestRef.current
      if (showLoading) setLocalPreviewLoading(true)

      try {
        const frame = await obsService.getSceneScreenshot(
          localPreviewScene,
          960,
          540,
          70,
        )

        if (requestId !== localPreviewRequestRef.current) return

        if (frame) {
          setLocalPreviewFrame(frame)
          setLocalPreviewError(null)
        } else {
          setLocalPreviewError(
            'No frame available for the selected preview scene.',
          )
        }
      } catch (err) {
        if (requestId !== localPreviewRequestRef.current) return
        setLocalPreviewError(
          (err as Error).message || 'Unable to load local preview from OBS.',
        )
      } finally {
        if (requestId === localPreviewRequestRef.current) {
          setLocalPreviewLoading(false)
        }
      }
    },
    [status.connected, localStudioMode, localPreviewScene],
  )

  useEffect(() => {
    if (!status.connected || !status.currentScene) {
      previewRequestRef.current += 1
      setLivePreview(null)
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }

    void refreshLivePreview(true)
    const intervalId = window.setInterval(() => {
      void refreshLivePreview()
    }, 1500)

    return () => {
      previewRequestRef.current += 1
      window.clearInterval(intervalId)
    }
  }, [status.connected, status.currentScene, refreshLivePreview])

  useEffect(() => {
    if (!status.connected) {
      localPreviewRequestRef.current += 1
      setLocalPreviewScene(null)
      setLocalPreviewFrame(null)
      setLocalPreviewError(null)
      setLocalPreviewLoading(false)
      return
    }

    if (!localStudioMode) {
      localPreviewRequestRef.current += 1
      setLocalPreviewFrame(null)
      setLocalPreviewError(null)
      setLocalPreviewLoading(false)
      return
    }

    if (status.scenes.length === 0) {
      setLocalPreviewScene(null)
      return
    }

    const sceneExists =
      localPreviewScene &&
      status.scenes.some((scene) => scene.sceneName === localPreviewScene)

    if (sceneExists) return

    const fallbackScene =
      status.scenes.find((scene) => scene.sceneName !== status.currentScene)
        ?.sceneName ??
      status.currentScene ??
      status.scenes[0]?.sceneName ??
      null

    setLocalPreviewScene(fallbackScene)
  }, [
    status.connected,
    status.scenes,
    status.currentScene,
    localStudioMode,
    localPreviewScene,
  ])

  useEffect(() => {
    if (!status.connected || !localStudioMode || !localPreviewScene) {
      localPreviewRequestRef.current += 1
      setLocalPreviewFrame(null)
      setLocalPreviewError(null)
      setLocalPreviewLoading(false)
      return
    }

    void refreshLocalPreview(true)
    const intervalId = window.setInterval(() => {
      void refreshLocalPreview()
    }, 1500)

    return () => {
      localPreviewRequestRef.current += 1
      window.clearInterval(intervalId)
    }
  }, [
    status.connected,
    localStudioMode,
    localPreviewScene,
    refreshLocalPreview,
  ])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    setStudioActionError(null)
    const result = await obsService.connect(host, port, password, protocol)
    if (!result.success) setError(result.error ?? 'Connection failed')
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    await obsService.disconnect()
    setStudioActionError(null)
  }

  const handleToggleLocalStudioMode = () => {
    setStudioActionError(null)
    setLocalStudioMode((current) => !current)
  }

  const handleSceneTrigger = async (sceneName: string) => {
    setStudioActionError(null)
    if (localStudioMode) {
      setLocalPreviewScene(sceneName)
      void refreshLocalPreview(true)
      return
    }
    await obsService.switchScene(sceneName)
  }

  const handleTakePreviewToProgram = async () => {
    if (!localPreviewScene || localPreviewScene === status.currentScene) return

    const previousProgramScene = status.currentScene
    const nextProgramScene = localPreviewScene

    setTransitioning(true)
    setStudioActionError(null)

    try {
      await obsService.switchScene(nextProgramScene)

      const sceneToReturnToPreview = previousProgramScene || null

      if (sceneToReturnToPreview) {
        setLocalPreviewScene(sceneToReturnToPreview)
      }

      await Promise.all([refreshLivePreview(), refreshLocalPreview()])
    } catch (err) {
      setStudioActionError(
        (err as Error).message ||
          'Unable to transition the local preview scene to program.',
      )
    } finally {
      setTransitioning(false)
    }
  }

  const loadSceneItems = useCallback(async (sceneName: string) => {
    setLoadingItems(true)
    const items = await obsService.getSceneItems(sceneName)
    setSceneItems(items)
    setLoadingItems(false)
  }, [])

  const handleSelectScene = async (sceneName: string) => {
    setSelectedScene(sceneName)
    await loadSceneItems(sceneName)
    setView('scenes')
  }

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return
    await obsService.createScene(newSceneName.trim())
    setNewSceneName('')
    await obsService.refreshScenes()
  }

  const handleDeleteScene = async (sceneName: string) => {
    if (sceneName === status.currentScene) return
    await obsService.removeScene(sceneName)
    await obsService.refreshScenes()
    if (localPreviewScene === sceneName) {
      setLocalPreviewScene(null)
      setLocalPreviewFrame(null)
    }
    if (selectedScene === sceneName) {
      setSelectedScene(null)
      setView('sceneManager')
    }
  }

  const handleRenameScene = async (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenamingScene(null)
      return
    }
    await obsService.renameScene(oldName, renameValue.trim())
    await obsService.refreshScenes()
    setRenamingScene(null)
  }

  const handleAddBrowserSource = async () => {
    if (!selectedScene || !bsName.trim() || !bsUrl.trim()) return
    await obsService.createBrowserSource(
      selectedScene,
      bsName.trim(),
      bsUrl.trim(),
      bsWidth,
      bsHeight,
    )
    await loadSceneItems(selectedScene)
    setBsName('')
    setBsUrl('')
    setView('scenes')
  }

  const handleUpdateBrowserSource = async () => {
    if (!editingItem) return
    await obsService.updateBrowserSource(
      editingItem.sourceName,
      editBsUrl,
      bsWidth,
      bsHeight,
    )
    if (selectedScene) await loadSceneItems(selectedScene)
    setView('scenes')
  }

  const handleRemoveItem = async (item: OBSSceneItem) => {
    if (!selectedScene) return
    await obsService.removeSceneItem(selectedScene, item.sceneItemId)
    await loadSceneItems(selectedScene)
  }

  // ── Disconnected ────────────────────────────────────────────────────────────
  if (!status.connected) {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-sky-400" />
            <span className="panel-title">OBS Studio</span>
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
                    protocol === 'ws'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => setProtocol('ws')}
                >
                  ws://
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-l border-neutral-700 ${
                    protocol === 'wss'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => setProtocol('wss')}
                >
                  <Lock size={10} /> wss://
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
                placeholder="4455"
              />
            </div>
            <div className="connect-form-group">
              <label className="connect-label">Password</label>
              <input
                className="connect-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {/* Preview URL */}
            <p className="text-xs text-neutral-600 font-mono text-center">
              {protocol}://{host}:{port}
            </p>
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
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
              {connecting ? 'Connecting…' : 'Connect to OBS'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Connected: Main View ─────────────────────────────────────────────────────
  if (view === 'main') {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2 min-w-0">
            <Monitor size={16} className="text-sky-400" />
            <span className="panel-title">OBS Studio</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              className="control-btn control-btn-ghost"
              onClick={() => setView('sceneManager')}
            >
              <Edit3 size={12} />
              Edit Scenes
            </button>

            <button
              className={`control-btn ${
                status.streaming ? 'control-btn-danger' : 'control-btn-primary'
              }`}
              onClick={() =>
                status.streaming
                  ? obsService.stopStream()
                  : obsService.startStream()
              }
            >
              {status.streaming ? <Square size={15} /> : <Play size={15} />}
              {status.streaming ? 'Stop Live' : 'Live'}
            </button>

            <button
              className={`control-btn ${
                status.recording ? 'control-btn-danger' : 'control-btn-amber'
              }`}
              onClick={() =>
                status.recording
                  ? obsService.stopRecording()
                  : obsService.startRecording()
              }
            >
              {status.recording ? <Square size={15} /> : <Circle size={15} />}
              {status.recording ? 'Stop Record' : 'Record'}
            </button>

            <button
              onClick={handleDisconnect}
              className="icon-btn text-neutral-500 hover:text-red-400"
              title="Disconnect"
            >
              <WifiOff size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Local Studio Mode */}
          <div className="status-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">Program Scene</p>
                <p className="text-sm font-medium text-white truncate">
                  {status.currentScene || '—'}
                </p>
              </div>

              <button
                className={`control-btn ${localStudioMode ? 'control-btn-amber' : 'control-btn-ghost'} min-w-[108px]`}
                onClick={handleToggleLocalStudioMode}
              >
                {localStudioMode ? 'Studio On' : 'Studio Off'}
              </button>
            </div>

            <p className="text-[11px] text-neutral-500">
              {localStudioMode
                ? 'Scene buttons now set Preview first, then Transition to Live.'
                : 'Scene buttons switch directly to Live when Studio Mode is off.'}
            </p>

            {studioActionError && (
              <p className="text-[11px] text-red-400">{studioActionError}</p>
            )}
          </div>

          {localStudioMode ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="status-card">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">
                        Preview
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {localPreviewScene || 'No preview scene selected'}
                      </p>
                    </div>

                    <button
                      className="icon-btn text-neutral-500 hover:text-amber-300 disabled:opacity-40"
                      onClick={() => void refreshLocalPreview(true)}
                      disabled={!localPreviewScene || localPreviewLoading}
                      title="Refresh preview"
                    >
                      <RefreshCw
                        size={12}
                        className={localPreviewLoading ? 'animate-spin' : undefined}
                      />
                    </button>
                  </div>

                  <div className="relative w-full aspect-video overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
                    {localPreviewFrame ? (
                      <img
                        src={localPreviewFrame}
                        alt="Preview feed"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        {localPreviewLoading
                          ? 'Loading preview…'
                          : 'Select a scene to preview'}
                      </div>
                    )}
                  </div>

                  {localPreviewError && (
                    <p className="text-[11px] text-red-400 mt-2">
                      {localPreviewError}
                    </p>
                  )}
                </div>

                <div className="status-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">
                      Live
                    </p>
                    <button
                      className="icon-btn text-neutral-500 hover:text-sky-400 disabled:opacity-40"
                      onClick={() => void refreshLivePreview(true)}
                      disabled={previewLoading}
                      title="Refresh live feed"
                    >
                      <RefreshCw
                        size={12}
                        className={previewLoading ? 'animate-spin' : undefined}
                      />
                    </button>
                  </div>

                  <div className="relative w-full aspect-video overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
                    {livePreview ? (
                      <img
                        src={livePreview}
                        alt="Live feed"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        {previewLoading ? 'Loading live feed…' : 'No live feed yet'}
                      </div>
                    )}
                  </div>

                  {previewError && (
                    <p className="text-[11px] text-red-400 mt-2">{previewError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="control-btn control-btn-ghost" disabled>
                  Fade
                </button>
                <button
                  className={`control-btn ${
                    localPreviewScene && localPreviewScene !== status.currentScene
                      ? 'control-btn-primary'
                      : 'control-btn-ghost'
                  }`}
                  onClick={() => void handleTakePreviewToProgram()}
                  disabled={
                    transitioning ||
                    !localPreviewScene ||
                    localPreviewScene === status.currentScene
                  }
                >
                  <ChevronRight size={14} />
                  {transitioning ? 'Transitioning…' : 'Transition'}
                </button>
              </div>
            </>
          ) : (
            <div className="status-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Live
                </p>
                <button
                  className="icon-btn text-neutral-500 hover:text-sky-400 disabled:opacity-40"
                  onClick={() => void refreshLivePreview(true)}
                  disabled={previewLoading}
                  title="Refresh live feed"
                >
                  <RefreshCw
                    size={12}
                    className={previewLoading ? 'animate-spin' : undefined}
                  />
                </button>
              </div>

              <div className="relative w-full aspect-video overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
                {livePreview ? (
                  <img
                    src={livePreview}
                    alt="Live feed"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                    {previewLoading ? 'Loading live feed…' : 'No live feed yet'}
                  </div>
                )}
              </div>

              {previewError && (
                <p className="text-[11px] text-red-400 mt-2">{previewError}</p>
              )}
            </div>
          )}

          {/* Scenes List */}
          <div className="status-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-neutral-300 uppercase tracking-[0.12em]">
                Scenes
              </p>
              <button
                className="icon-btn text-neutral-500 hover:text-sky-400"
                onClick={() => void obsService.refreshScenes()}
                title="Refresh scenes"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(11.75rem,1fr))] gap-2.5">
              {status.scenes.map((scene: OBSScene) => {
                const isProgram = scene.sceneName === status.currentScene
                const isPreview =
                  localStudioMode &&
                  scene.sceneName === localPreviewScene &&
                  !isProgram

                return (
                  <button
                    key={scene.sceneName}
                    className={`text-left rounded-lg border px-3 py-3 min-h-[3.25rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 ${
                      isProgram
                        ? 'border-sky-300/45 bg-sky-500/15 text-sky-200'
                        : isPreview
                          ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                          : 'border-neutral-700 bg-neutral-900/60 text-neutral-200 hover:text-white hover:border-neutral-500'
                    }`}
                    onClick={() => void handleSceneTrigger(scene.sceneName)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm sm:text-base font-semibold leading-tight">
                        {scene.sceneName}
                      </span>
                      {isProgram ? (
                        <span className="rounded-full border border-sky-300/40 bg-sky-300/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] font-bold">
                          Live
                        </span>
                      ) : isPreview ? (
                        <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] font-bold">
                          Preview
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
              {status.scenes.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4 col-span-full">
                  No scenes found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Scene Manager View ───────────────────────────────────────────────────────
  if (view === 'sceneManager') {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <button
              className="icon-btn text-neutral-400 hover:text-white"
              onClick={() => setView('main')}
            >
              <X size={14} />
            </button>
            <span className="panel-title text-sm">Edit Scenes</span>
          </div>
          <button
            className="icon-btn text-neutral-500 hover:text-sky-400"
            onClick={() => void obsService.refreshScenes()}
            title="Refresh scenes"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-neutral-500">
            Rename scenes, manage sources, and remove scenes from here.
          </p>

          <div className="space-y-1">
            {status.scenes.map((scene: OBSScene) => {
              const isProgram = scene.sceneName === status.currentScene
              const isPreview =
                localStudioMode &&
                scene.sceneName === localPreviewScene &&
                !isProgram

              return (
                <div
                  key={scene.sceneName}
                  className={`scene-row ${isProgram ? 'scene-row-active' : ''} ${isPreview ? 'scene-row-preview' : ''}`}
                >
                  {renamingScene === scene.sceneName ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        className="connect-input flex-1 py-0.5 text-xs"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            void handleRenameScene(scene.sceneName)
                          if (e.key === 'Escape') setRenamingScene(null)
                        }}
                        autoFocus
                      />
                      <button
                        className="icon-btn text-green-400"
                        onClick={() => handleRenameScene(scene.sceneName)}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        className="icon-btn text-neutral-500"
                        onClick={() => setRenamingScene(null)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-sm truncate">
                          {scene.sceneName}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {isProgram && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                            PGM
                          </span>
                        )}
                        {isPreview && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                            PVW
                          </span>
                        )}
                        <button
                          className="icon-btn text-neutral-500 hover:text-sky-400"
                          onClick={() => void handleSelectScene(scene.sceneName)}
                          title="Edit sources"
                        >
                          <Video size={12} />
                        </button>
                        <button
                          className="icon-btn text-neutral-500 hover:text-amber-400"
                          onClick={() => {
                            setRenamingScene(scene.sceneName)
                            setRenameValue(scene.sceneName)
                          }}
                          title="Rename"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          className="icon-btn text-neutral-500 hover:text-red-400 disabled:opacity-30"
                          onClick={() => void handleDeleteScene(scene.sceneName)}
                          disabled={scene.sceneName === status.currentScene}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {status.scenes.length === 0 && (
              <p className="text-xs text-neutral-600 text-center py-4">
                No scenes found
              </p>
            )}
          </div>

          {/* Create Scene */}
          <div className="flex gap-2 mt-2">
            <input
              className="connect-input flex-1 text-xs"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="New scene name…"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
            />
            <button
              className="icon-btn text-sky-400 border border-sky-400/30 rounded px-2 hover:bg-sky-400/10"
              onClick={handleCreateScene}
              title="Create scene"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Scene Sources View ────────────────────────────────────────────────────────
  if (view === 'scenes') {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <button
              className="icon-btn text-neutral-400 hover:text-white"
              onClick={() => setView('sceneManager')}
            >
              <X size={14} />
            </button>
            <span className="panel-title text-sm">{selectedScene}</span>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-transparent border-none cursor-pointer"
            onClick={() => setView('addSource')}
          >
            <Globe size={12} /> Add Browser Source
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={16} className="animate-spin text-neutral-500" />
            </div>
          ) : (
            <div className="space-y-1">
              {sceneItems.map((item) => (
                <div key={item.sceneItemId} className="source-row">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.inputKind === 'browser_source' ? (
                      <Globe size={13} className="text-sky-400 shrink-0" />
                    ) : (
                      <Video size={13} className="text-neutral-500 shrink-0" />
                    )}
                    <span className="text-xs text-neutral-300 truncate">
                      {item.sourceName}
                    </span>
                    <span className="text-xs text-neutral-600 shrink-0">
                      {item.inputKind}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.inputKind === 'browser_source' && (
                      <button
                        className="icon-btn text-neutral-500 hover:text-sky-400"
                        onClick={() => {
                          setEditingItem(item)
                          setView('editSource')
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    <button
                      className="icon-btn text-neutral-500 hover:text-red-400"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {sceneItems.length === 0 && (
                <p className="text-xs text-neutral-600 text-center py-8">
                  No sources in this scene
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Add Browser Source ────────────────────────────────────────────────────────
  if (view === 'addSource') {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <button
              className="icon-btn text-neutral-400 hover:text-white"
              onClick={() => setView('scenes')}
            >
              <X size={14} />
            </button>
            <Globe size={14} className="text-sky-400" />
            <span className="panel-title text-sm">Add Browser Source</span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="connect-form-group">
            <label className="connect-label">Source Name</label>
            <input
              className="connect-input"
              value={bsName}
              onChange={(e) => setBsName(e.target.value)}
              placeholder="My Browser Source"
            />
          </div>
          <div className="connect-form-group">
            <label className="connect-label">URL</label>
            <input
              className="connect-input"
              value={bsUrl}
              onChange={(e) => setBsUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="connect-form-group">
              <label className="connect-label">Width</label>
              <input
                className="connect-input"
                type="number"
                value={bsWidth}
                onChange={(e) => setBsWidth(Number(e.target.value))}
              />
            </div>
            <div className="connect-form-group">
              <label className="connect-label">Height</label>
              <input
                className="connect-input"
                type="number"
                value={bsHeight}
                onChange={(e) => setBsHeight(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="connect-btn w-full mt-2"
            onClick={handleAddBrowserSource}
          >
            <Plus size={14} /> Add Source
          </button>
        </div>
      </div>
    )
  }

  // ── Edit Browser Source ───────────────────────────────────────────────────────
  if (view === 'editSource' && editingItem) {
    return (
      <div className="obs-panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <button
              className="icon-btn text-neutral-400 hover:text-white"
              onClick={() => setView('scenes')}
            >
              <X size={14} />
            </button>
            <Globe size={14} className="text-sky-400" />
            <span className="panel-title text-sm">
              Edit: {editingItem.sourceName}
            </span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="connect-form-group">
            <label className="connect-label">URL</label>
            <input
              className="connect-input"
              value={editBsUrl}
              onChange={(e) => setEditBsUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="connect-form-group">
              <label className="connect-label">Width</label>
              <input
                className="connect-input"
                type="number"
                value={bsWidth}
                onChange={(e) => setBsWidth(Number(e.target.value))}
              />
            </div>
            <div className="connect-form-group">
              <label className="connect-label">Height</label>
              <input
                className="connect-input"
                type="number"
                value={bsHeight}
                onChange={(e) => setBsHeight(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="connect-btn w-full mt-2"
            onClick={handleUpdateBrowserSource}
          >
            <Check size={14} /> Update Source
          </button>
        </div>
      </div>
    )
  }

  return null
}
