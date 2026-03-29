import { useState, useEffect, useCallback } from 'react'
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

export function OBSPanel() {
  const [status, setStatus] = useState(obsService.status)
  const [protocol, setProtocol] = useState<'ws' | 'wss'>('ws')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(4455)
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scene management
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [sceneItems, setSceneItems] = useState<OBSSceneItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [view, setView] = useState<
    'main' | 'scenes' | 'addSource' | 'editSource'
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

  useEffect(() => {
    const unsub = obsService.subscribe(() =>
      setStatus({ ...obsService.status }),
    )
    return unsub
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    const result = await obsService.connect(host, port, password, protocol)
    if (!result.success) setError(result.error ?? 'Connection failed')
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    await obsService.disconnect()
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
    if (selectedScene === sceneName) {
      setSelectedScene(null)
      setView('main')
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

  const StatusBadge = ({
    active,
    label,
    activeColor,
  }: {
    active: boolean
    label: string
    activeColor: string
  }) => (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        active
          ? `${activeColor} border-current/30`
          : 'text-neutral-500 border-neutral-700 bg-neutral-800/50'
      }`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-current animate-pulse' : 'bg-neutral-600'}`}
      />
      {label}
    </div>
  )

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
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-sky-400" />
            <span className="panel-title">OBS Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              active={status.streaming}
              label="LIVE"
              activeColor="text-red-400"
            />
            <StatusBadge
              active={status.recording}
              label="REC"
              activeColor="text-amber-400"
            />
            <button
              onClick={handleDisconnect}
              className="icon-btn text-neutral-500 hover:text-red-400"
            >
              <WifiOff size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Scene */}
          <div className="status-card">
            <p className="text-xs text-neutral-500 mb-1">Active Scene</p>
            <p className="text-sm font-medium text-white truncate">
              {status.currentScene || '—'}
            </p>
          </div>

          {/* Stream / Record Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`control-btn ${status.streaming ? 'control-btn-danger' : 'control-btn-primary'}`}
              onClick={() =>
                status.streaming
                  ? obsService.stopStream()
                  : obsService.startStream()
              }
            >
              {status.streaming ? <Square size={15} /> : <Play size={15} />}
              {status.streaming ? 'Stop Stream' : 'Start Stream'}
            </button>
            <button
              className={`control-btn ${status.recording ? 'control-btn-danger' : 'control-btn-amber'}`}
              onClick={() =>
                status.recording
                  ? obsService.stopRecording()
                  : obsService.startRecording()
              }
            >
              {status.recording ? <Square size={15} /> : <Circle size={15} />}
              {status.recording ? 'Stop Rec' : 'Start Rec'}
            </button>
          </div>

          {/* Scenes List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-400 uppercase tracking-wider">
                Scenes
              </p>
              <button
                className="icon-btn text-neutral-500 hover:text-sky-400"
                onClick={() => obsService.refreshScenes()}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {status.scenes.map((scene: OBSScene) => (
                <div
                  key={scene.sceneName}
                  className={`scene-row ${scene.sceneName === status.currentScene ? 'scene-row-active' : ''}`}
                >
                  {renamingScene === scene.sceneName ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        className="connect-input flex-1 py-0.5 text-xs"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleRenameScene(scene.sceneName)
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
                      <button
                        className="flex-1 text-left text-sm truncate bg-transparent border-none cursor-pointer text-inherit"
                        onClick={() => obsService.switchScene(scene.sceneName)}
                      >
                        {scene.sceneName}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="icon-btn text-neutral-500 hover:text-sky-400"
                          onClick={() => handleSelectScene(scene.sceneName)}
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
                          onClick={() => handleDeleteScene(scene.sceneName)}
                          disabled={scene.sceneName === status.currentScene}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                        <ChevronRight size={12} className="text-neutral-600" />
                      </div>
                    </>
                  )}
                </div>
              ))}
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
              >
                <Plus size={13} />
              </button>
            </div>
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
              onClick={() => setView('main')}
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
