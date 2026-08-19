/**
 * Manifest-driven asset loader for the scroll film.
 *
 * Frames are NOT bundled — they come from `filmBase` (public/film in dev,
 * Blob/CDN origin in production). Loading is a priority queue: lower number
 * loads sooner. The engine boosts a scene's priority as the viewer approaches
 * it, so bandwidth always goes to what's about to be on screen.
 */

export interface SeqVariant {
  frames: number
  tiers: number[]
  size: [number, number]
  pattern: string
}
export interface FilmManifest {
  version: number
  fps: number
  sequences: Record<string, Record<string, SeqVariant | { reuse: string }> | null>
  stills: Record<string, Record<string, { src: string; size: [number, number] }>>
  plates: Record<string, Record<string, { src: string; size: [number, number] }>>
  sprites: Record<string, { src: string; size: [number, number]; screenCenter?: [number, number] }>
  anchors: Record<string, { still: string; quad: [number, number][] | null }>
}

export type Orientation = 'landscape' | 'portrait'

/** Follow the orientation fallback chain (portrait → reuse pointer → landscape). */
export function resolveVariant<T>(entry: Record<string, T | { reuse: string }> | null | undefined, orientation: Orientation): T | null {
  if (!entry) return null
  let v = entry[orientation] ?? entry.landscape
  if (v && typeof v === 'object' && 'reuse' in v) v = entry[(v as { reuse: string }).reuse]
  return (v as T) ?? null
}

/** Smallest tier that still covers the viewport at its DPR; largest otherwise. */
export function pickTier(tiers: number[], viewportW: number, dpr: number): number {
  const needed = viewportW * Math.min(dpr, 2)
  const sorted = [...tiers].sort((a, b) => a - b)
  return sorted.find((t) => t >= needed) ?? sorted[sorted.length - 1]
}

export function frameUrl(base: string, v: SeqVariant, tier: number, i: number): string {
  // pattern: frames/transit-a/landscape/{tier}/f_{frame}.webp — frames are 1-indexed
  return (
    base + '/' +
    v.pattern.replace('{tier}', String(tier)).replace('{frame}', String(i + 1).padStart(3, '0'))
  )
}

interface Task {
  img: HTMLImageElement
  url: string
  priority: number
  started: boolean
  done: boolean
}

export interface FilmLoader {
  image(key: string, url: string, priority: number): HTMLImageElement
  boost(keyPrefix: string, priority: number): void
  onProgress(cb: (loaded: number, total: number) => void): void
  stats(): { loaded: number; total: number }
}

export function createFilmLoader(concurrency = 6): FilmLoader {
  const tasks = new Map<string, Task>()
  let inFlight = 0
  let progressCb: ((loaded: number, total: number) => void) | null = null

  function stats() {
    let loaded = 0
    tasks.forEach((t) => { if (t.done) loaded++ })
    return { loaded, total: tasks.size }
  }

  function pump() {
    if (inFlight >= concurrency) return
    const pending = [...tasks.values()].filter((t) => !t.started)
    pending.sort((a, b) => a.priority - b.priority)
    while (inFlight < concurrency && pending.length) {
      const t = pending.shift()!
      t.started = true
      inFlight++
      const settle = () => {
        t.done = true
        inFlight--
        progressCb?.(stats().loaded, stats().total)
        pump()
      }
      t.img.onload = settle
      t.img.onerror = settle
      t.img.src = t.url
    }
  }

  return {
    image(key, url, priority) {
      const existing = tasks.get(key)
      if (existing) {
        if (!existing.started && priority < existing.priority) existing.priority = priority
        return existing.img
      }
      const img = new Image()
      img.decoding = 'async'
      tasks.set(key, { img, url, priority, started: false, done: false })
      // pump on microtask so a batch of image() calls queues before sorting
      queueMicrotask(pump)
      return img
    },
    boost(keyPrefix, priority) {
      let changed = false
      tasks.forEach((t, k) => {
        if (!t.started && k.startsWith(keyPrefix) && priority < t.priority) {
          t.priority = priority
          changed = true
        }
      })
      if (changed) queueMicrotask(pump)
    },
    onProgress(cb) { progressCb = cb },
    stats
  }
}
