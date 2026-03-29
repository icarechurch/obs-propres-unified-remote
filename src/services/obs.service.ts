/**
 * OBS Studio WebSocket Service
 * Manages connection and communication with OBS via obs-websocket-js v5
 */

import OBSWebSocket from 'obs-websocket-js'

export interface OBSScene {
  sceneName: string
  sceneIndex: number
}

export interface OBSSceneItem {
  sceneItemId: number
  sourceName: string
  sourceType: string
  inputKind?: string
  sceneItemEnabled: boolean
}

export interface OBSStatus {
  connected: boolean
  streaming: boolean
  recording: boolean
  currentScene: string
  currentPreviewScene: string
  studioModeEnabled: boolean
  scenes: OBSScene[]
}

function toSceneList(raw: unknown[]): OBSScene[] {
  return raw.map((s) => {
    const scene = s as Record<string, unknown>
    return {
      sceneName: String(scene.sceneName ?? ''),
      sceneIndex: Number(scene.sceneIndex ?? 0),
    }
  })
}

class OBSService {
  private obs: OBSWebSocket
  private _connected = false
  private _streaming = false
  private _recording = false
  private _currentScene = ''
  private _currentPreviewScene = ''
  private _studioModeEnabled = false
  private _scenes: OBSScene[] = []
  private _sceneScreenshotFallbackSource = new Map<string, string>()
  private listeners: Array<() => void> = []

  constructor() {
    this.obs = new OBSWebSocket()

    this.obs.on('StreamStateChanged', (data) => {
      this._streaming = data.outputActive
      this.notify()
    })

    this.obs.on('RecordStateChanged', (data) => {
      this._recording = data.outputActive
      this.notify()
    })

    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this._currentScene = data.sceneName
      this.notify()
    })

    this.obs.on('CurrentPreviewSceneChanged', (data) => {
      this._currentPreviewScene = data.sceneName
      this.notify()
    })

    this.obs.on('StudioModeStateChanged', (data) => {
      this._studioModeEnabled = data.studioModeEnabled
      this.notify()
    })

    this.obs.on('SceneListChanged', (data) => {
      this._scenes = toSceneList(data.scenes as unknown[])
      this._sceneScreenshotFallbackSource.clear()
      this.notify()
    })

    this.obs.on('ConnectionClosed', () => {
      this._connected = false
      this._studioModeEnabled = false
      this._currentPreviewScene = ''
      this._sceneScreenshotFallbackSource.clear()
      this.notify()
    })
  }

  private resolveProgramSceneName(
    response: Record<string, unknown>,
  ): string {
    const sceneName = response.sceneName
    if (typeof sceneName === 'string' && sceneName.trim().length > 0) {
      return sceneName
    }

    const deprecatedName = response.currentProgramSceneName
    if (
      typeof deprecatedName === 'string' &&
      deprecatedName.trim().length > 0
    ) {
      return deprecatedName
    }

    return ''
  }

  private resolvePreviewSceneName(
    response: Record<string, unknown>,
  ): string {
    const sceneName = response.sceneName
    if (typeof sceneName === 'string' && sceneName.trim().length > 0) {
      return sceneName
    }

    const deprecatedName = response.currentPreviewSceneName
    if (
      typeof deprecatedName === 'string' &&
      deprecatedName.trim().length > 0
    ) {
      return deprecatedName
    }

    return ''
  }

  private toImageDataUri(
    screenshotResponse: Record<string, unknown>,
    imageFormat: string,
  ): string | null {
    const directImageData = screenshotResponse.imageData
    if (typeof directImageData === 'string') {
      const normalized = directImageData.trim()
      if (normalized.length === 0) return null
      if (normalized.startsWith('data:image/')) return normalized
      return `data:image/${imageFormat};base64,${normalized}`
    }

    const base64ImageData = screenshotResponse.imageBase64
    if (typeof base64ImageData === 'string') {
      const normalized = base64ImageData.trim()
      if (normalized.length === 0) return null
      return `data:image/${imageFormat};base64,${normalized}`
    }

    return null
  }

  private async fetchProgramSceneName(): Promise<string> {
    const currentScene = await this.obs.call('GetCurrentProgramScene')
    return this.resolveProgramSceneName(currentScene as Record<string, unknown>)
  }

  private async requestSourceScreenshot(
    sourceName: string,
    width: number,
    height: number,
    quality: number,
    imageFormat: string,
  ): Promise<string | null> {
    const result = await this.obs.call('GetSourceScreenshot', {
      sourceName,
      imageFormat,
      imageWidth: width,
      imageHeight: height,
      imageCompressionQuality: quality,
    })

    return this.toImageDataUri(
      result as Record<string, unknown>,
      imageFormat,
    )
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  get status(): OBSStatus {
    return {
      connected: this._connected,
      streaming: this._streaming,
      recording: this._recording,
      currentScene: this._currentScene,
      currentPreviewScene: this._currentPreviewScene,
      studioModeEnabled: this._studioModeEnabled,
      scenes: this._scenes,
    }
  }

  private buildConnectionUrl(
    hostInput: string,
    portInput: number,
    protocolInput: 'ws' | 'wss',
  ): string {
    let host = hostInput.trim()
    if (!host) {
      throw new Error('Host is required')
    }

    // Tolerate pasted tunnel URLs and accidental spaces from clipboard.
    host = host.replace(/%20/gi, '').replace(/\s+/g, '')
    host = host.replace(/^(https?|wss?)\/\//i, '$1://')

    let protocol = protocolInput
    let port = portInput
    let hostname = host
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(host)

    if (hasScheme) {
      const parsed = new URL(host)
      const parsedProtocol = parsed.protocol.toLowerCase()

      if (parsedProtocol === 'wss:' || parsedProtocol === 'https:') {
        protocol = 'wss'
      } else if (parsedProtocol === 'ws:' || parsedProtocol === 'http:') {
        protocol = 'ws'
      }

      hostname = parsed.hostname
      if (parsed.port) {
        port = Number(parsed.port)
      }
    } else {
      const hostPortMatch = host.match(/^([^/:]+):(\d+)$/)
      if (hostPortMatch) {
        hostname = hostPortMatch[1]
        port = Number(hostPortMatch[2])
      }
    }

    if (!hostname) {
      throw new Error('Invalid host value')
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Port must be between 1 and 65535')
    }

    const lowerHostname = hostname.toLowerCase()
    if (
      lowerHostname.endsWith('.trycloudflare.com') &&
      protocol === 'wss' &&
      port !== 443
    ) {
      throw new Error(
        'Cloudflare tunnel domains only accept WSS on port 443. Use host only (no scheme) and set port to 443.',
      )
    }

    return `${protocol}://${hostname}:${port}`
  }

  async connect(
    host: string,
    port: number,
    password?: string,
    protocol: 'ws' | 'wss' = 'ws',
  ) {
    try {
      const url = this.buildConnectionUrl(host, port, protocol)
      await this.obs.connect(url, password || undefined)
      this._connected = true

      const [streamStatus, recordStatus, sceneList, currentScene] =
        await Promise.all([
          this.obs.call('GetStreamStatus'),
          this.obs.call('GetRecordStatus'),
          this.obs.call('GetSceneList'),
          this.obs.call('GetCurrentProgramScene'),
        ])

      this._streaming = streamStatus.outputActive
      this._recording = recordStatus.outputActive
      this._scenes = toSceneList(sceneList.scenes as unknown[])
      this._currentScene = this.resolveProgramSceneName(
        currentScene as Record<string, unknown>,
      )

      const studioModeStatus = await this.obs.call('GetStudioModeEnabled')
      this._studioModeEnabled = studioModeStatus.studioModeEnabled

      if (this._studioModeEnabled) {
        const previewScene = await this.obs.call('GetCurrentPreviewScene')
        this._currentPreviewScene = this.resolvePreviewSceneName(
          previewScene as Record<string, unknown>,
        )
      } else {
        this._currentPreviewScene = ''
      }

      this.notify()
      return { success: true }
    } catch {
      this._connected = false
      this._studioModeEnabled = false
      this._currentPreviewScene = ''
      this._sceneScreenshotFallbackSource.clear()
      this.notify()
      return { success: false, error: 'An error occured' }
    }
  }

  async disconnect() {
    try {
      await this.obs.disconnect()
    } catch {
      // ignore
    }
    this._connected = false
    this._studioModeEnabled = false
    this._currentPreviewScene = ''
    this._sceneScreenshotFallbackSource.clear()
    this.notify()
  }

  async startStream() {
    if (!this._connected) return
    await this.obs.call('StartStream')
  }

  async stopStream() {
    if (!this._connected) return
    await this.obs.call('StopStream')
  }

  async startRecording() {
    if (!this._connected) return
    await this.obs.call('StartRecord')
  }

  async stopRecording() {
    if (!this._connected) return
    await this.obs.call('StopRecord')
  }

  async switchScene(sceneName: string) {
    if (!this._connected) return
    await this.obs.call('SetCurrentProgramScene', { sceneName })
  }

  async setStudioModeEnabled(studioModeEnabled: boolean) {
    if (!this._connected) return
    await this.obs.call('SetStudioModeEnabled', { studioModeEnabled })
    this._studioModeEnabled = studioModeEnabled

    if (!studioModeEnabled) {
      this._currentPreviewScene = ''
      this.notify()
      return
    }

    const previewScene = await this.obs.call('GetCurrentPreviewScene')
    this._currentPreviewScene = this.resolvePreviewSceneName(
      previewScene as Record<string, unknown>,
    )
    this.notify()
  }

  async setPreviewScene(sceneName: string) {
    if (!this._connected || !sceneName) return
    if (!this._studioModeEnabled) {
      throw new Error(
        'OBS Studio Mode is disabled. Enable it in OBS to set preview scenes.',
      )
    }
    await this.obs.call('SetCurrentPreviewScene', { sceneName })
    this._currentPreviewScene = sceneName
    this.notify()
  }

  async transitionPreviewToProgram() {
    if (!this._connected) return
    if (!this._studioModeEnabled) {
      throw new Error(
        'OBS Studio Mode is disabled. Enable it in OBS to transition preview to program.',
      )
    }

    await this.obs.call('TriggerStudioModeTransition')

    const [currentScene, previewScene] = await Promise.all([
      this.obs.call('GetCurrentProgramScene'),
      this.obs.call('GetCurrentPreviewScene'),
    ])

    this._currentScene = this.resolveProgramSceneName(
      currentScene as Record<string, unknown>,
    )
    this._currentPreviewScene = this.resolvePreviewSceneName(
      previewScene as Record<string, unknown>,
    )
    this.notify()
  }

  async createScene(sceneName: string) {
    if (!this._connected) return
    await this.obs.call('CreateScene', { sceneName })
  }

  async removeScene(sceneName: string) {
    if (!this._connected) return
    await this.obs.call('RemoveScene', { sceneName })
  }

  async renameScene(sceneName: string, newSceneName: string) {
    if (!this._connected) return
    await this.obs.call('SetSceneName', { sceneName, newSceneName })
  }

  async getSceneItems(sceneName: string): Promise<OBSSceneItem[]> {
    if (!this._connected) return []
    const result = await this.obs.call('GetSceneItemList', { sceneName })
    return (result.sceneItems as unknown[]).map((raw) => {
      const item = raw as Record<string, unknown>
      return {
        sceneItemId: Number(item.sceneItemId ?? 0),
        sourceName: String(item.sourceName ?? ''),
        sourceType: String(item.sourceType ?? ''),
        inputKind: item.inputKind ? String(item.inputKind) : undefined,
        sceneItemEnabled: Boolean(item.sceneItemEnabled ?? true),
      }
    })
  }

  async getInputList() {
    if (!this._connected) return []
    const result = await this.obs.call('GetInputList')
    return result.inputs
  }

  async createBrowserSource(
    sceneName: string,
    sourceName: string,
    url: string,
    width = 1920,
    height = 1080,
  ) {
    if (!this._connected) return
    await this.obs.call('CreateInput', {
      sceneName,
      inputName: sourceName,
      inputKind: 'browser_source',
      inputSettings: { url, width, height },
    })
  }

  async updateBrowserSource(
    inputName: string,
    url: string,
    width = 1920,
    height = 1080,
  ) {
    if (!this._connected) return
    await this.obs.call('SetInputSettings', {
      inputName,
      inputSettings: { url, width, height },
    })
  }

  async removeSceneItem(sceneName: string, sceneItemId: number) {
    if (!this._connected) return
    await this.obs.call('RemoveSceneItem', { sceneName, sceneItemId })
  }

  async setSceneItemIndex(
    sceneName: string,
    sceneItemId: number,
    sceneItemIndex: number,
  ) {
    if (!this._connected) return
    await this.obs.call('SetSceneItemIndex', {
      sceneName,
      sceneItemId,
      sceneItemIndex,
    })
  }

  async getProgramSceneScreenshot(
    width = 640,
    height = 360,
    quality = 70,
  ): Promise<string | null> {
    if (!this._connected) return null

    let activeScene = this._currentScene

    if (!activeScene) {
      activeScene = await this.fetchProgramSceneName()
      if (!activeScene) return null
      this._currentScene = activeScene
    }

    const frame = await this.getSceneScreenshot(activeScene, width, height, quality)
    if (frame) return frame

    const refreshedActiveScene = await this.fetchProgramSceneName()
    if (!refreshedActiveScene) return null

    this._currentScene = refreshedActiveScene
    if (refreshedActiveScene === activeScene) return null

    return this.getSceneScreenshot(
      refreshedActiveScene,
      width,
      height,
      quality,
    )
  }

  async getPreviewSceneScreenshot(
    width = 640,
    height = 360,
    quality = 70,
  ): Promise<string | null> {
    return this.getSceneScreenshot(
      this._currentPreviewScene,
      width,
      height,
      quality,
    )
  }

  async getSceneScreenshot(
    sceneName: string,
    width = 640,
    height = 360,
    quality = 70,
  ): Promise<string | null> {
    if (!this._connected || !sceneName) return null

    const imageFormat = 'jpeg'
    const attemptedSources = new Set<string>()
    let lastError: Error | null = null

    const tryCapture = async (sourceName: string): Promise<string | null> => {
      const normalizedSourceName = sourceName.trim()
      if (!normalizedSourceName || attemptedSources.has(normalizedSourceName)) {
        return null
      }

      attemptedSources.add(normalizedSourceName)

      try {
        return await this.requestSourceScreenshot(
          normalizedSourceName,
          width,
          height,
          quality,
          imageFormat,
        )
      } catch (err) {
        lastError = err as Error
        return null
      }
    }

    const cachedFallbackSource = this._sceneScreenshotFallbackSource.get(sceneName)
    if (cachedFallbackSource) {
      const frame = await tryCapture(cachedFallbackSource)
      if (frame) return frame
    }

    const sceneFrame = await tryCapture(sceneName)
    if (sceneFrame) {
      this._sceneScreenshotFallbackSource.delete(sceneName)
      return sceneFrame
    }

    const sceneItems = await this.getSceneItems(sceneName)
    for (const item of sceneItems) {
      if (!item.sceneItemEnabled) continue

      const sourceFrame = await tryCapture(item.sourceName)
      if (!sourceFrame) continue

      this._sceneScreenshotFallbackSource.set(sceneName, item.sourceName)
      return sourceFrame
    }

    if (lastError) throw lastError
    return null
  }

  async refreshScenes() {
    if (!this._connected) return
    const result = await this.obs.call('GetSceneList')
    this._scenes = toSceneList(result.scenes as unknown[])
    this._sceneScreenshotFallbackSource.clear()
    this.notify()
  }
}

// Singleton
export const obsService = new OBSService()
