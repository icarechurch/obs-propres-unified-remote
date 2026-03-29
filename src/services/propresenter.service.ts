/**
 * ProPresenter HTTP API Service
 * Communicates with ProPresenter via its local HTTP API on port 50001
 * Full API reference: https://openapi.propresenter.com/
 */

export interface ProPresenterStatus {
  connected: boolean
  host: string
  port: number
  protocol: 'http' | 'https'
}

export interface ActivePresentation {
  id: { uuid: string; name: string; index: number }
  presentationCurrentSlide: number
  presentationSlideCount: number
}

export interface Macro {
  id: { uuid: string; name: string; index: number }
}

export interface PlaylistItem {
  id: { uuid: string; name: string; index: number }
  type: string
}

export interface PPTimer {
  id: { uuid: string; name: string; index: number }
  time: number
  type: string
  is_running: boolean
}

export interface PPMessage {
  id: { uuid: string; name: string; index: number }
  title: string
}

export interface PPLook {
  id: { uuid: string; name: string; index: number }
}

export interface PPProp {
  id: { uuid: string; name: string; index: number }
  is_active: boolean
}

export interface StageLayout {
  id: { uuid: string; name: string; index: number }
}

export interface PPAudio {
  id: { uuid: string; name: string; index: number }
  is_playing: boolean
  name: string
}

class ProPresenterService {
  private _host = 'localhost'
  private _port = 50001
  private _protocol: 'http' | 'https' = 'http'
  private _connected = false
  private listeners: Array<() => void> = []
  private pollInterval: ReturnType<typeof setInterval> | null = null

  subscribe(fn: () => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  get status(): ProPresenterStatus {
    return {
      connected: this._connected,
      host: this._host,
      port: this._port,
      protocol: this._protocol,
    }
  }

  private get baseUrl() {
    return `${this._protocol}://${this._host}:${this._port}`
  }

  private async request<T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) return null
      const text = await res.text()
      if (!text) return null as T
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }

  async connect(
    host: string,
    port: number,
    protocol: 'http' | 'https' = 'http',
  ) {
    this._host = host
    this._port = port
    this._protocol = protocol
    const result = await this.request('/v1/version')
    this._connected = result !== null
    this.notify()

    if (this._connected) {
      this.startPolling()
    }

    return { success: this._connected }
  }

  disconnect() {
    this._connected = false
    this.stopPolling()
    this.notify()
  }

  private startPolling() {
    this.stopPolling()
    this.pollInterval = setInterval(async () => {
      const result = await this.request('/v1/version')
      const wasConnected = this._connected
      this._connected = result !== null
      if (wasConnected !== this._connected) {
        this.notify()
      }
    }, 5000)
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  async getVersion() {
    return this.request<{
      host_description: string
      host_platform: string
      api_version: string
    }>('/v1/version')
  }

  async getSystemStatus() {
    return this.request<{ platform: string; os_version: string }>(
      '/v1/status/system',
    )
  }

  async getSlideStatus() {
    return this.request<{ presentation_slide_index: number }>(
      '/v1/status/slide',
    )
  }

  // ── Presentation / Slides ────────────────────────────────────────────────────
  async getActivePresentation() {
    return this.request<ActivePresentation>('/v1/presentation/active')
  }

  async triggerNextSlide() {
    return this.request('/v1/trigger/next', 'GET')
  }

  async triggerPreviousSlide() {
    return this.request('/v1/trigger/previous', 'GET')
  }

  async triggerSlideIndex(presentationUUID: string, slideIndex: number) {
    return this.request(
      `/v1/presentation/${presentationUUID}/trigger/${slideIndex}`,
      'GET',
    )
  }

  // ── Transport / Media ────────────────────────────────────────────────────────
  async getTransportLayerStatus() {
    return this.request<{
      video_countdown_timer: number
      audio_countdown_timer: number
    }>('/v1/transport/video/current_time')
  }

  async playTransportVideo() {
    return this.request('/v1/transport/video/play', 'PUT')
  }

  async pauseTransportVideo() {
    return this.request('/v1/transport/video/pause', 'PUT')
  }

  async skipBackVideo(seconds: number) {
    return this.request(`/v1/transport/video/skip_backward/${seconds}`, 'PUT')
  }

  async skipForwardVideo(seconds: number) {
    return this.request(`/v1/transport/video/skip_forward/${seconds}`, 'PUT')
  }

  // ── Clear ────────────────────────────────────────────────────────────────────
  async clearAll() {
    return this.request('/v1/clear/layer/all', 'GET')
  }

  async clearSlide() {
    return this.request('/v1/clear/layer/slide', 'GET')
  }

  async clearMedia() {
    return this.request('/v1/clear/layer/media', 'GET')
  }

  async clearAudio() {
    return this.request('/v1/clear/layer/audio', 'GET')
  }

  async clearAnnouncements() {
    return this.request('/v1/clear/layer/announcements', 'GET')
  }

  async clearProps() {
    return this.request('/v1/clear/layer/props', 'GET')
  }

  async clearMessages() {
    return this.request('/v1/clear/layer/messages', 'GET')
  }

  async clearToLogo() {
    return this.request('/v1/clear/layer/slide', 'GET')
  }

  // ── Macros ────────────────────────────────────────────────────────────────────
  async getMacros(): Promise<Macro[]> {
    const result = await this.request<Macro[]>('/v1/macros')
    return result ?? []
  }

  async triggerMacro(macroUUID: string) {
    return this.request(`/v1/macro/${macroUUID}/trigger`, 'GET')
  }

  // ── Media ──────────────────────────────────────────────────────────────────
  async showMedia() {
    return this.request('/v1/transport/video/play', 'PUT')
  }

  async hideMedia() {
    return this.request('/v1/clear/layer/media', 'GET')
  }

  // ── Playlists ───────────────────────────────────────────────────────────────
  async getPlaylists() {
    return this.request<{ items: PlaylistItem[] }>('/v1/playlist/identifiers')
  }

  async triggerPlaylistItem(playlistUUID: string, itemUUID: string) {
    return this.request(
      `/v1/playlist/${playlistUUID}/item/${itemUUID}/trigger`,
      'GET',
    )
  }

  // ── Timers ──────────────────────────────────────────────────────────────────
  async getTimers(): Promise<PPTimer[]> {
    const result = await this.request<PPTimer[]>('/v1/timers')
    return result ?? []
  }

  async startTimer(timerUUID: string) {
    return this.request(`/v1/timer/${timerUUID}/start`, 'PUT')
  }

  async stopTimer(timerUUID: string) {
    return this.request(`/v1/timer/${timerUUID}/stop`, 'PUT')
  }

  async resetTimer(timerUUID: string) {
    return this.request(`/v1/timer/${timerUUID}/reset`, 'PUT')
  }

  // ── Messages ────────────────────────────────────────────────────────────────
  async getMessages(): Promise<PPMessage[]> {
    const result = await this.request<PPMessage[]>('/v1/messages')
    return result ?? []
  }

  async showMessage(messageUUID: string) {
    return this.request(`/v1/message/${messageUUID}/trigger`, 'GET')
  }

  async hideMessage(messageUUID: string) {
    return this.request(`/v1/message/${messageUUID}/clear`, 'GET')
  }

  // ── Looks ────────────────────────────────────────────────────────────────────
  async getLooks(): Promise<PPLook[]> {
    const result = await this.request<PPLook[]>('/v1/looks')
    return result ?? []
  }

  async triggerLook(lookUUID: string) {
    return this.request(`/v1/look/${lookUUID}/trigger`, 'GET')
  }

  // ── Props ────────────────────────────────────────────────────────────────────
  async getProps(): Promise<PPProp[]> {
    const result = await this.request<PPProp[]>('/v1/props')
    return result ?? []
  }

  async triggerProp(propUUID: string) {
    return this.request(`/v1/prop/${propUUID}/trigger`, 'GET')
  }

  async clearProp(propUUID: string) {
    return this.request(`/v1/prop/${propUUID}/clear`, 'GET')
  }

  // ── Stage Layouts ─────────────────────────────────────────────────────────────
  async getStageLayouts(): Promise<StageLayout[]> {
    const result = await this.request<StageLayout[]>('/v1/stage/layouts')
    return result ?? []
  }

  async setStageLayout(layoutUUID: string) {
    return this.request(`/v1/stage/layout/${layoutUUID}`, 'PUT')
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  async getAudioPlaylists() {
    return this.request('/v1/audio/playlist/identifiers')
  }

  // ── Library ──────────────────────────────────────────────────────────────────
  async getLibrary() {
    return this.request<
      { id: { uuid: string; name: string; index: number } }[]
    >('/v1/library/all')
  }
}

// Singleton
export const proPresenterService = new ProPresenterService()
