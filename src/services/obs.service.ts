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
  private _scenes: OBSScene[] = []
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

    this.obs.on('SceneListChanged', (data) => {
      this._scenes = toSceneList(data.scenes as unknown[])
      this.notify()
    })

    this.obs.on('ConnectionClosed', () => {
      this._connected = false
      this.notify()
    })
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
      scenes: this._scenes,
    }
  }

  async connect(
    host: string,
    port: number,
    password?: string,
    protocol: 'ws' | 'wss' = 'ws',
  ) {
    try {
      const url = `${protocol}://${host}:${port}`
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
      this._currentScene = currentScene.currentProgramSceneName
      this.notify()
      return { success: true }
    } catch (err) {
      this._connected = false
      this.notify()
      return { success: false, error: (err as Error).message }
    }
  }

  async disconnect() {
    try {
      await this.obs.disconnect()
    } catch {
      // ignore
    }
    this._connected = false
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
    return this.getSceneScreenshot(this._currentScene, width, height, quality)
  }

  async getSceneScreenshot(
    sceneName: string,
    width = 640,
    height = 360,
    quality = 70,
  ): Promise<string | null> {
    if (!this._connected || !sceneName) return null

    const result = await this.obs.call('GetSourceScreenshot', {
      sourceName: sceneName,
      imageFormat: 'jpeg',
      imageWidth: width,
      imageHeight: height,
      imageCompressionQuality: quality,
    })

    const imageData = (result as Record<string, unknown>).imageData
    return typeof imageData === 'string' ? imageData : null
  }

  async refreshScenes() {
    if (!this._connected) return
    const result = await this.obs.call('GetSceneList')
    this._scenes = toSceneList(result.scenes as unknown[])
    this.notify()
  }
}

// Singleton
export const obsService = new OBSService()
