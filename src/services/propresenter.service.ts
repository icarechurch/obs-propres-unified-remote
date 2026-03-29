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
  slides: ActivePresentationSlide[]
}

export interface ActivePresentationSlide {
  uuid: string
  index: number
  label: string
  text: string
  notes: string
  groupName: string
}

export interface LibraryPresentation {
  library: { uuid: string; name: string; index: number }
  presentation: { uuid: string; name: string; index: number }
}

export interface PlaylistPresentation {
  playlist: { uuid: string; name: string; index: number }
  item: { uuid: string; name: string; index: number }
  itemType: string
  presentation?: { uuid: string; name: string; index: number }
}

interface RawPresentationID {
  uuid?: string
  name?: string
  index?: number
}

interface RawPresentationSlide {
  uuid?: string
  id?: RawPresentationID
  text?: string
  notes?: string
  label?: string
  title?: string
  display_name?: string
  name?: string
}

interface RawPresentationGroup {
  id?: RawPresentationID
  name?: string
  group_name?: string
  slides?: RawPresentationSlide[]
}

interface RawPresentation {
  id?: RawPresentationID
  groups?: RawPresentationGroup[]
  slides?: RawPresentationSlide[]
  current_location?: { index?: number }
  presentationCurrentSlide?: number
  presentation_current_slide?: number
  presentationSlideCount?: number
  presentation_slide_count?: number
}

interface RawActivePresentationResponse extends RawPresentation {
  presentation?: RawPresentation | null
}

interface RawLibraryItem {
  id?: RawPresentationID
  uuid?: string
  name?: string
  index?: number
}

interface RawLibraryContentsResponse {
  updateType?: 'all' | 'add' | 'remove' | string
  items?: RawLibraryItem[]
}

interface RawPlaylistEntry {
  id?: RawPresentationID
  uuid?: string
  name?: string
  index?: number
  type?: string
  item?: RawPlaylistEntry
  item_id?: RawPresentationID
  playlist?: RawPlaylistEntry
  playlist_id?: RawPresentationID
  presentation?: RawPlaylistEntry
  presentation_id?: RawPresentationID
  items?: RawPlaylistEntry[]
  children?: RawPlaylistEntry[]
}

interface RawPlaylistIdentifiersResponse {
  items?: RawPlaylistEntry[]
  playlists?: RawPlaylistEntry[]
  results?: RawPlaylistEntry[]
  data?: RawPlaylistEntry[]
}

interface RawPlaylistContentsResponse {
  updateType?: 'all' | 'add' | 'remove' | string
  items?: RawPlaylistEntry[]
  playlists?: RawPlaylistEntry[]
  results?: RawPlaylistEntry[]
  data?: RawPlaylistEntry[]
  children?: RawPlaylistEntry[]
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
  // Prefer /version first to avoid noisy 404s on newer ProPresenter builds.
  private versionPath: '/v1/version' | '/version' = '/version'

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

  private async requestOk(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(3000),
      })

      return res.ok
    } catch {
      return false
    }
  }

  private async requestVersion(): Promise<{
    host_description: string
    host_platform: string
    api_version: string
  } | null> {
    // ProPresenter versions can expose the version route on either path.
    const paths: Array<'/v1/version' | '/version'> = [
      this.versionPath,
      this.versionPath === '/v1/version' ? '/version' : '/v1/version',
    ]

    for (const path of paths) {
      const result = await this.request<{
        host_description: string
        host_platform: string
        api_version: string
      }>(path)

      if (result) {
        this.versionPath = path
        return result
      }
    }

    return null
  }

  async connect(
    host: string,
    port: number,
    protocol: 'http' | 'https' = 'http',
  ) {
    const normalizedHost =
      host.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '') ||
      'localhost'
    const candidatePorts = [port, 1025, 50001].filter(
      (value, index, array) => array.indexOf(value) === index,
    )

    this.stopPolling()
    this._host = normalizedHost
    this._protocol = protocol

    for (const candidatePort of candidatePorts) {
      this._port = candidatePort
      const result = await this.requestVersion()
      if (result) {
        this._connected = true
        this.notify()
        this.startPolling()
        return { success: true, port: candidatePort }
      }
    }

    this._port = port
    this._connected = false
    this.notify()
    return { success: false }
  }

  disconnect() {
    this._connected = false
    this.stopPolling()
    this.notify()
  }

  private startPolling() {
    this.stopPolling()
    this.pollInterval = setInterval(async () => {
      const result = await this.requestVersion()
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

  private normalizeText(value: unknown): string {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim()
  }

  private parseIdentifier(value: unknown): RawPresentationID | null {
    if (!value || typeof value !== 'object') return null

    const raw = value as Record<string, unknown>
    const source =
      raw.id && typeof raw.id === 'object'
        ? (raw.id as Record<string, unknown>)
        : raw

    const uuid = typeof source.uuid === 'string' ? source.uuid : undefined
    const name = typeof source.name === 'string' ? source.name : undefined
    const index =
      typeof source.index === 'number' && Number.isFinite(source.index)
        ? source.index
        : undefined

    if (!uuid && !name && typeof index !== 'number') return null

    return { uuid, name, index }
  }

  private normalizeIdentifier(
    identifier: RawPresentationID | null,
    fallbackName: string,
  ): { uuid: string; name: string; index: number } {
    const index =
      typeof identifier?.index === 'number' && Number.isFinite(identifier.index)
        ? Math.max(Math.floor(identifier.index), 0)
        : 0

    return {
      uuid: identifier?.uuid ?? '',
      name: this.normalizeText(identifier?.name) || fallbackName,
      index,
    }
  }

  private extractPlaylistEntries(value: unknown): RawPlaylistEntry[] {
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is RawPlaylistEntry =>
          Boolean(entry) && typeof entry === 'object',
      )
    }

    if (!value || typeof value !== 'object') return []

    const raw = value as Record<string, unknown>
    const candidateKeys = [
      'items',
      'playlists',
      'results',
      'data',
      'children',
      'entries',
    ]

    for (const key of candidateKeys) {
      const candidate = raw[key]
      if (!Array.isArray(candidate)) continue

      const entries = candidate.filter(
        (entry): entry is RawPlaylistEntry =>
          Boolean(entry) && typeof entry === 'object',
      )

      if (entries.length > 0) {
        return entries
      }
    }

    if (this.parseIdentifier(raw)) {
      return [raw as RawPlaylistEntry]
    }

    return []
  }

  private buildLookupIdentifiers(identifier: RawPresentationID): string[] {
    const candidates: string[] = []

    const uuid = this.normalizeText(identifier.uuid)
    if (uuid) candidates.push(uuid)

    const name = this.normalizeText(identifier.name)
    if (name) candidates.push(name)

    if (typeof identifier.index === 'number' && Number.isFinite(identifier.index)) {
      candidates.push(`${Math.max(Math.floor(identifier.index), 0)}`)
    }

    return Array.from(new Set(candidates))
  }

  private async requestPlaylistEntries(paths: string[]): Promise<RawPlaylistEntry[]> {
    for (const path of paths) {
      const result = await this.request<
        | RawPlaylistIdentifiersResponse
        | RawPlaylistContentsResponse
        | RawPlaylistEntry[]
        | RawPlaylistEntry
      >(path)

      const entries = this.extractPlaylistEntries(result)
      if (entries.length > 0) return entries
    }

    return []
  }

  private parsePlaylistIdentifier(value: RawPlaylistEntry): RawPresentationID | null {
    const raw = value as Record<string, unknown>

    return (
      this.parseIdentifier(value.id) ??
      this.parseIdentifier(value.item?.id) ??
      this.parseIdentifier(value.item_id) ??
      this.parseIdentifier(value.playlist?.id) ??
      this.parseIdentifier(value.playlist) ??
      this.parseIdentifier(value.playlist_id) ??
      this.parseIdentifier(value.presentation?.id) ??
      this.parseIdentifier(value.presentation) ??
      this.parseIdentifier(value.presentation_id) ??
      this.parseIdentifier(raw.item) ??
      this.parseIdentifier(raw.playlist) ??
      this.parseIdentifier(raw.presentation) ??
      this.parseIdentifier(value)
    )
  }

  private parsePlaylistPresentationIdentifier(
    value: RawPlaylistEntry,
  ): RawPresentationID | null {
    const raw = value as Record<string, unknown>
    const item =
      raw.item && typeof raw.item === 'object'
        ? (raw.item as Record<string, unknown>)
        : null

    return (
      this.parseIdentifier(value.presentation?.id) ??
      this.parseIdentifier(value.presentation_id) ??
      this.parseIdentifier(value.presentation) ??
      this.parseIdentifier(item?.presentation) ??
      this.parseIdentifier(item?.presentation_id) ??
      null
    )
  }

  private toLookupIdentifier(identifier: RawPresentationID): string {
    const name = this.normalizeText(identifier.name)
    if (name) return name

    if (typeof identifier.index === 'number' && Number.isFinite(identifier.index)) {
      return `${Math.max(Math.floor(identifier.index), 0)}`
    }

    return identifier.uuid ?? ''
  }

  private parsePresentationSlides(
    presentation: RawPresentation,
  ): ActivePresentationSlide[] {
    const slides: ActivePresentationSlide[] = []
    let globalIndex = 0

    const pushSlide = (slide: RawPresentationSlide, groupName: string) => {
      const text = this.normalizeText(slide.text)
      const explicitLabel = this.normalizeText(
        slide.label ??
          slide.title ??
          slide.display_name ??
          slide.name ??
          slide.id?.name,
      )

      const fallbackFromText = text.slice(0, 80)
      const label = explicitLabel || fallbackFromText || `Slide ${globalIndex + 1}`

      slides.push({
        uuid:
          slide.id?.uuid ??
          slide.uuid ??
          `${presentation.id?.uuid ?? 'presentation'}-${globalIndex}`,
        index: globalIndex,
        label,
        text,
        notes: this.normalizeText(slide.notes),
        groupName,
      })

      globalIndex += 1
    }

    if (Array.isArray(presentation.groups) && presentation.groups.length > 0) {
      presentation.groups.forEach((group, groupIndex) => {
        const groupName =
          this.normalizeText(group.id?.name ?? group.name ?? group.group_name) ||
          `Group ${groupIndex + 1}`

        if (!Array.isArray(group.slides)) return
        group.slides.forEach((slide) => pushSlide(slide, groupName))
      })

      return slides
    }

    if (Array.isArray(presentation.slides)) {
      presentation.slides.forEach((slide) => pushSlide(slide, 'Slides'))
    }

    return slides
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  async getVersion() {
    return this.requestVersion()
  }

  async getSystemStatus() {
    return this.request<{ platform: string; os_version: string }>(
      '/v1/status/system',
    )
  }

  async getSlideStatus() {
    return this.request<{
      current?: { uuid: string; text: string; notes: string }
      next?: { uuid: string; text: string; notes: string }
    }>(
      '/v1/status/slide',
    )
  }

  async getPresentationSlideIndex(): Promise<number | null> {
    const result = await this.request<{
      presentation_index?: { index?: number } | null
    }>('/v1/presentation/slide_index')

    const index = result?.presentation_index?.index
    return typeof index === 'number' && Number.isFinite(index)
      ? Math.max(index, 0)
      : null
  }

  getPresentationThumbnailUrl(
    presentationUUID: string,
    slideIndex: number,
    quality = 360,
    thumbnailType: 'jpeg' | 'png' = 'jpeg',
  ): string {
    const params = new URLSearchParams()
    params.set('quality', `${Math.max(64, Math.floor(quality))}`)
    params.set('thumbnail_type', thumbnailType)

    return `${this.baseUrl}/v1/presentation/${encodeURIComponent(
      presentationUUID,
    )}/thumbnail/${slideIndex}?${params.toString()}`
  }

  // ── Presentation / Slides ────────────────────────────────────────────────────
  async getActivePresentation(): Promise<ActivePresentation | null> {
    const result = await this.request<RawActivePresentationResponse>(
      '/v1/presentation/active',
    )
    if (!result) return null

    const presentation = result.presentation ?? result
    const id = presentation.id ?? {}
    let slides = this.parsePresentationSlides(presentation)

    // Some builds return a compact active payload. Hydrate slide text/details from
    // the full presentation endpoint when active data does not include slide items.
    if (slides.length === 0 && typeof id.uuid === 'string' && id.uuid.length > 0) {
      const detailedPresentation = await this.request<RawPresentation>(
        `/v1/presentation/${id.uuid}`,
      )

      if (detailedPresentation) {
        slides = this.parsePresentationSlides(detailedPresentation)
      }
    }

    let currentSlide: number | null =
      presentation.presentationCurrentSlide ??
      presentation.presentation_current_slide ??
      presentation.current_location?.index ??
      null

    if (typeof currentSlide !== 'number' || !Number.isFinite(currentSlide)) {
      currentSlide = await this.getPresentationSlideIndex()
    }

    const groupSlideCount = slides.length

    const totalSlides =
      presentation.presentationSlideCount ??
      presentation.presentation_slide_count ??
      groupSlideCount

    return {
      id: {
        uuid: id.uuid ?? '',
        name: id.name ?? 'Unknown',
        index: typeof id.index === 'number' ? id.index : 0,
      },
      presentationCurrentSlide:
        typeof currentSlide === 'number' && Number.isFinite(currentSlide)
          ? Math.max(currentSlide, 0)
          : 0,
      presentationSlideCount:
        typeof totalSlides === 'number' && Number.isFinite(totalSlides)
          ? Math.max(totalSlides, 0)
          : 0,
      slides,
    }
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

  async getLibraryPresentations(): Promise<LibraryPresentation[]> {
    const librariesResult = await this.request<RawLibraryItem[]>('/v1/libraries')
    if (!Array.isArray(librariesResult) || librariesResult.length === 0) return []

    const libraries = librariesResult
      .map((entry) => this.parseIdentifier(entry))
      .filter((entry): entry is RawPresentationID => entry !== null)

    if (libraries.length === 0) return []

    const presentationGroups = await Promise.all(
      libraries.map(async (library) => {
        const libraryLookup = this.toLookupIdentifier(library)
        if (!libraryLookup) return [] as LibraryPresentation[]

        const result = await this.request<
          RawLibraryContentsResponse | RawLibraryItem[]
        >(`/v1/library/${encodeURIComponent(libraryLookup)}`)

        if (!result) return []

        const items = Array.isArray(result) ? result : result.items ?? []
        const normalizedLibrary = this.normalizeIdentifier(library, 'Library')

        return items
          .map((item) => this.parseIdentifier(item))
          .filter((item): item is RawPresentationID => item !== null)
          .map((presentation) => {
            const normalizedPresentation = this.normalizeIdentifier(
              presentation,
              'Untitled Presentation',
            )

            if (!normalizedPresentation.uuid) return null

            return {
              library: normalizedLibrary,
              presentation: normalizedPresentation,
            }
          })
          .filter((item): item is LibraryPresentation => item !== null)
      }),
    )

    const deduped = new Map<string, LibraryPresentation>()

    presentationGroups.flat().forEach((entry) => {
      const libraryKey = entry.library.uuid || entry.library.name
      const presentationKey = entry.presentation.uuid
      const dedupeKey = `${libraryKey}::${presentationKey}`

      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, entry)
      }
    })

    return Array.from(deduped.values()).sort((a, b) => {
      const librarySort = a.library.name.localeCompare(b.library.name)
      if (librarySort !== 0) return librarySort

      const presentationSort = a.presentation.name.localeCompare(
        b.presentation.name,
      )
      if (presentationSort !== 0) return presentationSort

      return a.presentation.index - b.presentation.index
    })
  }

  async triggerPresentation(presentationUUID: string): Promise<boolean> {
    const target = presentationUUID.trim()
    if (!target) return false

    return this.requestOk(
      `/v1/presentation/${encodeURIComponent(target)}/trigger`,
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
  async getPlaylists(): Promise<PlaylistItem[]> {
    const items = await this.requestPlaylistEntries([
      '/v1/playlist/identifiers',
      '/v1/playlists',
      '/v1/playlist',
    ])

    const deduped = new Map<string, PlaylistItem>()

    items.forEach((entry) => {
      const id = this.parsePlaylistIdentifier(entry)
      if (!id) return

      const normalizedId = this.normalizeIdentifier(
        id,
        this.normalizeText(id.name) || 'Playlist',
      )

      const dedupeKey = [
        this.normalizeText(normalizedId.uuid),
        this.normalizeText(normalizedId.name),
        `${normalizedId.index}`,
      ].join('::')

      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, {
          id: normalizedId,
          type: this.normalizeText(entry.type) || 'playlist',
        })
      }
    })

    return Array.from(deduped.values()).sort((a, b) => {
      const nameSort = a.id.name.localeCompare(b.id.name)
      if (nameSort !== 0) return nameSort
      return a.id.index - b.id.index
    })
  }

  async getPlaylistPresentations(): Promise<PlaylistPresentation[]> {
    const playlists = await this.getPlaylists()
    if (playlists.length === 0) return []

    const playlistGroups = await Promise.all(
      playlists.map(async (playlist) => {
        const lookupCandidates = this.buildLookupIdentifiers(playlist.id)
        if (lookupCandidates.length === 0) return [] as PlaylistPresentation[]

        const playlistPaths = lookupCandidates.flatMap((lookup) => {
          const encodedLookup = encodeURIComponent(lookup)

          return [
            `/v1/playlist/${encodedLookup}`,
            `/v1/playlists/${encodedLookup}`,
            `/v1/playlist/${encodedLookup}/items`,
            `/v1/playlists/${encodedLookup}/items`,
          ]
        })

        const items = await this.requestPlaylistEntries(playlistPaths)
        if (items.length === 0) return []

        const normalizedPlaylist = this.normalizeIdentifier(
          playlist.id,
          this.normalizeText(playlist.id.name) || 'Playlist',
        )

        return items
          .map((entry) => {
            const itemIdentifier = this.parsePlaylistIdentifier(entry)
            if (!itemIdentifier) return null

            const normalizedItem = this.normalizeIdentifier(
              itemIdentifier,
              'Untitled Item',
            )

            if (!normalizedItem.uuid) return null

            const presentationIdentifier =
              this.parsePlaylistPresentationIdentifier(entry)
            const normalizedPresentation = presentationIdentifier
              ? this.normalizeIdentifier(
                  presentationIdentifier,
                  normalizedItem.name,
                )
              : undefined

            return {
              playlist: normalizedPlaylist,
              item: normalizedItem,
              itemType: this.normalizeText(entry.type) || 'presentation',
              presentation: normalizedPresentation,
            }
          })
          .filter((entry): entry is PlaylistPresentation => entry !== null)
      }),
    )

    const deduped = new Map<string, PlaylistPresentation>()

    playlistGroups.flat().forEach((entry) => {
      const playlistKey = entry.playlist.uuid || entry.playlist.name
      const itemKey = entry.item.uuid || entry.item.name
      const dedupeKey = `${playlistKey}::${itemKey}`

      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, entry)
      }
    })

    return Array.from(deduped.values()).sort((a, b) => {
      const playlistSort = a.playlist.name.localeCompare(b.playlist.name)
      if (playlistSort !== 0) return playlistSort

      const itemSort = a.item.name.localeCompare(b.item.name)
      if (itemSort !== 0) return itemSort

      return a.item.index - b.item.index
    })
  }

  async triggerPlaylistItem(
    playlistUUID: string,
    itemUUID: string,
  ): Promise<boolean> {
    const playlistTarget = playlistUUID.trim()
    const itemTarget = itemUUID.trim()

    if (!playlistTarget || !itemTarget) return false

    return this.requestOk(
      `/v1/playlist/${encodeURIComponent(playlistTarget)}/item/${encodeURIComponent(itemTarget)}/trigger`,
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
