import { computed, ref } from 'vue'
import type { OrbAudioFrame } from '@/lib/davinci-orb/types'

// Da Vinci voice engine — module singleton (same pattern as useDaVinciToasts).
// Owns SpeechRecognition (STT), speechSynthesis (TTS + voice ranking + chunking)
// and the mic AnalyserNode that feeds the orb. Deliberately framework-light:
// no three.js, no Pinia (AudioContext/MediaStream handles must not enter a store).

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

export type VoiceErrorCode =
  | 'unsupported'
  | 'permission'
  | 'no-speech'
  | 'network'
  | 'audio'
  | 'unknown'

export class VoiceError extends Error {
  readonly code: VoiceErrorCode

  constructor(code: VoiceErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'VoiceError'
    this.code = code
  }
}

export interface StartListeningOptions {
  /** Surface claiming the mic ('drawer' | 'experience' | …) — last claim wins. */
  owner: string
  lang?: string
  /** Open getUserMedia + analyser so the orb gets live bands (experience only). */
  withAnalyser?: boolean
}

export interface SpeakOptions {
  rate?: number
  pitch?: number
  onstart?: () => void
  onend?: () => void
}

const hasWindow = typeof window !== 'undefined'
const sttSupported = hasWindow && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
const ttsSupported = hasWindow && 'speechSynthesis' in window

// Apple WebKit (iOS + desktop Safari): a getUserMedia analyser running in
// parallel with SpeechRecognition contends for the mic and can break recognition
// / double-prompt — so we skip the analyser there (the orb still has TTS energy
// + idle motion). Also where speechSynthesis needs a user-gesture unlock.
const ua = hasWindow ? navigator.userAgent : ''
const isAppleWebKit =
  /iphone|ipad|ipod/i.test(ua) ||
  (hasWindow && navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1) ||
  /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(ua)

const MUTED_KEY = 'davinci-voice-muted'

// ── Reactive singleton state ─────────────────────────────────────────────────
const listeningRef = ref(false)
const thinkingRef = ref(false)
const speakingRef = ref(false)
const ownerRef = ref<string | null>(null)
const interimRef = ref('')
const micActiveRef = ref(false)
const micLevelRef = ref(0)
const mutedRef = ref(hasWindow && window.localStorage.getItem(MUTED_KEY) === '1')

const state = computed<VoiceState>(() => {
  if (speakingRef.value) return 'speaking'
  if (thinkingRef.value) return 'thinking'
  if (listeningRef.value) return 'listening'
  return 'idle'
})

// ── STT ──────────────────────────────────────────────────────────────────────
let recognition: SpeechRecognition | null = null

function mapRecognitionError(error: string): VoiceErrorCode {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'audio-capture':
      return 'audio'
    default:
      return 'unknown'
  }
}

/**
 * Start a dictation session. Resolves the final transcript, '' on silence or
 * abort (incl. another owner re-claiming the mic). Rejects VoiceError on real
 * failures (permission / network / no mic).
 */
function startListening(opts: StartListeningOptions): Promise<string> {
  if (!sttSupported) return Promise.reject(new VoiceError('unsupported'))
  abortListening()

  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!Ctor) return Promise.reject(new VoiceError('unsupported'))
  const recog = new Ctor()
  recognition = recog
  ownerRef.value = opts.owner
  interimRef.value = ''
  listeningRef.value = true

  recog.lang = opts.lang ?? (hasWindow ? navigator.language || 'en-US' : 'en-US')
  recog.interimResults = true
  recog.continuous = false
  recog.maxAlternatives = 1

  // Analyser failure is non-fatal — STT capture is independent of getUserMedia.
  // Skipped on Apple WebKit (see isAppleWebKit) to avoid mic contention with STT.
  if (opts.withAnalyser && !isAppleWebKit) {
    void openMic().catch(() => {})
  }

  return new Promise<string>((resolve, reject) => {
    let finalText = ''
    let settled = false

    const cleanup = () => {
      if (recognition === recog) {
        recognition = null
        listeningRef.value = false
        interimRef.value = ''
        ownerRef.value = null
        closeMic()
      }
    }
    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    recog.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result) continue
        const seg = result[0]?.transcript ?? ''
        if (result.isFinal) finalText += seg
        else interim += seg
      }
      interimRef.value = finalText || interim
      if (finalText) {
        recog.stop()
        settle(() => resolve(finalText.trim()))
      }
    }
    recog.onerror = (e) => {
      const code = mapRecognitionError(e.error)
      // Silence and aborts are normal outcomes, not failures
      if (code === 'no-speech' || e.error === 'aborted') {
        settle(() => resolve(''))
        return
      }
      settle(() => reject(new VoiceError(code, e.message)))
    }
    recog.onend = () => settle(() => resolve(finalText.trim()))

    try {
      recog.start()
    } catch (err) {
      settle(() => reject(new VoiceError('unknown', err instanceof Error ? err.message : undefined)))
    }
  })
}

/** Graceful stop — lets a pending final result flush before resolving. */
function stopListening() {
  recognition?.stop()
}

/** Hard abort — discards results; the in-flight promise resolves ''. */
function abortListening() {
  recognition?.abort()
}

function setThinking(on: boolean) {
  thinkingRef.value = on
}

// ── TTS ──────────────────────────────────────────────────────────────────────
let rankedVoices: SpeechSynthesisVoice[] = []
let speakToken = 0
let speakStartedAt = 0
let speakEstimateMs = 0
// Chrome GC-collects utterances before onend unless something references them
const liveUtterances: SpeechSynthesisUtterance[] = []

/** Marojarvis voice-ranking port — prefers natural/neural voices. Pure, testable. */
export function rankVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0
    if (/online \(natural\)|natural|neural|premium|enhanced/i.test(v.name)) s += 30
    if (/google uk english male/i.test(v.name)) s += 12
    if (/\b(daniel|arthur|oliver|george|thomas|aaron)\b/i.test(v.name)) s += 8
    if (/^en[-_]/i.test(v.lang)) s += 6
    if (v.localService) s += 1
    return s
  }
  return [...voices].sort((a, b) => score(b) - score(a))
}

function refreshVoices() {
  rankedVoices = rankVoices(window.speechSynthesis.getVoices())
}

if (ttsSupported) {
  refreshVoices()
  // Chrome populates the list asynchronously; singleton lives for the app's lifetime
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

// Safari/iOS only permit speechSynthesis.speak() that *begins* inside a user
// gesture. Replies are spoken from timers (the "thinking" delay), so prime the
// engine once from a real tap/click — then later async speaks are allowed.
let speechUnlocked = false
function unlockSpeech() {
  if (speechUnlocked || !ttsSupported) return
  speechUnlocked = true
  try {
    window.speechSynthesis.resume()
    const primer = new SpeechSynthesisUtterance(' ')
    primer.volume = 0
    window.speechSynthesis.speak(primer)
  } catch {
    /* unlock is best-effort */
  }
}

function estimateSpeechMs(text: string): number {
  return Math.min(6800, Math.max(1200, text.length * 54))
}

/** Sentence-chunk long text — desktop Chrome silently stalls utterances ~15s in. */
export function chunkSpeech(text: string, maxLen = 200): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && (current + sentence).length > maxLen) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/** 0..1 TTS energy envelope with attack/release and an organic wobble. */
function currentSpeakEnergy(): number {
  if (!speakingRef.value) return 0
  const t = performance.now() - speakStartedAt
  const attack = Math.min(1, t / 120)
  const remaining = speakEstimateMs - t
  const release = remaining < 250 ? Math.max(0.15, remaining / 250) : 1
  const wobble = 0.78 + 0.22 * Math.abs(Math.sin(t / 90) * Math.sin(t / 41))
  return Math.max(0, Math.min(1, attack * release * wobble))
}

function speakChunk(text: string, rate: number, pitch: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    if (!rankedVoices.length) refreshVoices() // Safari may never fire voiceschanged
    const voice = rankedVoices[0]
    if (voice) utterance.voice = voice

    speakStartedAt = performance.now()
    speakEstimateMs = estimateSpeechMs(text)
    liveUtterances.push(utterance)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(stallGuard)
      const idx = liveUtterances.indexOf(utterance)
      if (idx >= 0) liveUtterances.splice(idx, 1)
      resolve()
    }
    // Chrome occasionally swallows onend — never let a chunk hang the chain
    const stallGuard = setTimeout(finish, speakEstimateMs * 2 + 2000)
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  })
}

// ── Cloud TTS (realistic voice via /api/tts) — falls back to Web Speech ──────
let cloudTtsEnabled = true // flipped off for the session once the endpoint proves absent
let cloudAbort: AbortController | null = null
let playCtx: AudioContext | null = null
let playAnalyser: AnalyserNode | null = null
let playSource: AudioBufferSourceNode | null = null
const playFreq = new Uint8Array(256) // playback FFT → feeds the orb the real voice

/** Decode mp3 bytes and play through an analyser (so the orb reacts to the real audio). */
async function playCloudBuffer(arrayBuf: ArrayBuffer, token: number): Promise<void> {
  if (!playCtx) playCtx = new AudioContext()
  if (playCtx.state === 'suspended') await playCtx.resume().catch(() => {})
  const audioBuf = await playCtx.decodeAudioData(arrayBuf)
  if (token !== speakToken) return
  const src = playCtx.createBufferSource()
  src.buffer = audioBuf
  const an = playCtx.createAnalyser()
  an.fftSize = 512
  an.smoothingTimeConstant = 0.7
  src.connect(an)
  an.connect(playCtx.destination)
  playSource = src
  playAnalyser = an
  speakStartedAt = performance.now()
  speakEstimateMs = audioBuf.duration * 1000
  await new Promise<void>((resolve) => {
    src.onended = () => resolve()
    try {
      src.start()
    } catch {
      resolve()
    }
  })
  if (playSource === src) playSource = null
  if (playAnalyser === an) {
    try {
      an.disconnect()
    } catch {
      /* noop */
    }
    playAnalyser = null
  }
}

type CloudOutcome = 'played' | 'cancelled' | 'unavailable'
async function speakViaCloud(text: string, token: number): Promise<CloudOutcome> {
  const controller = new AbortController()
  cloudAbort = controller
  let resp: Response
  try {
    resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })
  } catch {
    return token !== speakToken || controller.signal.aborted ? 'cancelled' : 'unavailable'
  } finally {
    if (cloudAbort === controller) cloudAbort = null
  }
  if (token !== speakToken) return 'cancelled'
  if (!resp.ok) return 'unavailable' // 503 = not configured, etc.
  let arrayBuf: ArrayBuffer
  try {
    arrayBuf = await resp.arrayBuffer()
  } catch {
    return token !== speakToken ? 'cancelled' : 'unavailable'
  }
  if (token !== speakToken) return 'cancelled'
  try {
    await playCloudBuffer(arrayBuf, token)
  } catch {
    return token !== speakToken ? 'cancelled' : 'unavailable'
  }
  return token === speakToken ? 'played' : 'cancelled'
}

async function speakViaBrowser(text: string, token: number, opts: SpeakOptions): Promise<void> {
  // Chrome drops an utterance enqueued synchronously after cancel()
  await new Promise((r) => setTimeout(r, 60))
  if (token !== speakToken) return
  for (const chunk of chunkSpeech(text)) {
    if (token !== speakToken) return
    await speakChunk(chunk, opts.rate ?? 0.99, opts.pitch ?? 1.0)
  }
}

/**
 * Speak text aloud (cancels any prior speech first). Realistic cloud voice when
 * /api/tts is configured (orb reacts to the real audio), else the browser voice;
 * muted ⇒ visual-only (speaking state + energy envelope still run). Resolves on
 * completion or cancellation — never rejects.
 */
async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const clean = text.trim()
  if (!clean) return
  cancelSpeech()
  const token = ++speakToken

  speakingRef.value = true
  opts.onstart?.()

  try {
    if (mutedRef.value) {
      // Visual-only (muted): no audio, but the orb still pulses
      speakStartedAt = performance.now()
      speakEstimateMs = estimateSpeechMs(clean)
      await new Promise((r) => setTimeout(r, speakEstimateMs))
      return
    }
    // 1. Realistic cloud voice (if /api/tts has a key configured)
    if (cloudTtsEnabled) {
      const outcome = await speakViaCloud(clean, token)
      if (outcome === 'played' || outcome === 'cancelled') return
      cloudTtsEnabled = false // no working endpoint — stop trying this session
    }
    // 2. Browser Web Speech fallback
    if (ttsSupported) {
      await speakViaBrowser(clean, token, opts)
    } else {
      speakStartedAt = performance.now()
      speakEstimateMs = estimateSpeechMs(clean)
      await new Promise((r) => setTimeout(r, speakEstimateMs))
    }
  } finally {
    if (token === speakToken) {
      speakingRef.value = false
      opts.onend?.()
    }
  }
}

function cancelSpeech() {
  speakToken++
  liveUtterances.length = 0
  if (ttsSupported) window.speechSynthesis.cancel()
  // cloud TTS: abort an in-flight fetch and stop any playing buffer
  cloudAbort?.abort()
  cloudAbort = null
  if (playSource) {
    try {
      playSource.stop()
    } catch {
      /* already stopped */
    }
    playSource = null
  }
  if (playAnalyser) {
    try {
      playAnalyser.disconnect()
    } catch {
      /* noop */
    }
    playAnalyser = null
  }
  speakingRef.value = false
}

function setMuted(muted: boolean) {
  mutedRef.value = muted
  if (hasWindow) window.localStorage.setItem(MUTED_KEY, muted ? '1' : '0')
}

// ── Mic analyser (feeds the orb; the orb never touches Web Audio) ────────────
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let micLevelTimer: ReturnType<typeof setInterval> | null = null
// Bumped by closeMic(); openMic() bails if it's changed across the async
// getUserMedia gap (stop/abort/deny/leave) so it can't resurrect a closed mic.
let micSession = 0

// Preallocated, reused every frame — zero per-frame allocation
const freqData = new Uint8Array(256)
const bands = new Float32Array(16)
const frame: OrbAudioFrame = { micActive: false, micLevel: 0, bands, speakEnergy: 0 }

async function openMic(): Promise<void> {
  if (analyser) return
  const session = micSession
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    throw new VoiceError(
      name === 'NotAllowedError' ? 'permission' : name === 'NotFoundError' ? 'audio' : 'unknown',
    )
  }
  // closeMic() ran while getUserMedia was pending — don't resurrect the mic
  if (session !== micSession) {
    stream.getTracks().forEach((t) => t.stop())
    return
  }
  mediaStream = stream
  audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {})
  const source = audioCtx.createMediaStreamSource(stream)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.68
  source.connect(analyser)
  micActiveRef.value = true
  // Low-rate ref for non-orb UI (mic button pulse) — orb pulls at 60fps itself
  micLevelTimer = setInterval(() => {
    getVoiceFrame()
    micLevelRef.value = frame.micLevel
  }, 80)
}

function closeMic() {
  micSession++
  if (micLevelTimer != null) {
    clearInterval(micLevelTimer)
    micLevelTimer = null
  }
  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = null
  analyser = null
  if (audioCtx) {
    void audioCtx.close().catch(() => {})
    audioCtx = null
  }
  micActiveRef.value = false
  micLevelRef.value = 0
  bands.fill(0)
  frame.micActive = false
  frame.micLevel = 0
}

/**
 * Pull interface for the orb (called once per rAF). Reuses internal buffers —
 * consume synchronously. Returns zeros when the mic is closed and TTS is idle.
 */
function getVoiceFrame(): OrbAudioFrame {
  frame.micActive = !!analyser
  if (analyser) {
    analyser.getByteFrequencyData(freqData)
    const usable = Math.floor(freqData.length * 0.7) // top bins are near-silent
    let sum = 0
    for (let b = 0; b < 16; b++) {
      const start = Math.floor((b / 16) * usable)
      const end = Math.max(start + 1, Math.floor(((b + 1) / 16) * usable))
      let acc = 0
      for (let i = start; i < end; i++) acc += freqData[i] ?? 0
      const raw = acc / ((end - start) * 255)
      const prev = bands[b] ?? 0
      bands[b] = prev + (raw - prev) * 0.35
      sum += raw
    }
    frame.micLevel = Math.min(1, (sum / 16) * 1.6)
    frame.speakEnergy = currentSpeakEnergy()
  } else if (playAnalyser) {
    // Real cloud-TTS audio → the orb reacts to the actual voice
    playAnalyser.getByteFrequencyData(playFreq)
    const usable = Math.floor(playFreq.length * 0.7)
    let pSum = 0
    for (let b = 0; b < 16; b++) {
      const start = Math.floor((b / 16) * usable)
      const end = Math.max(start + 1, Math.floor(((b + 1) / 16) * usable))
      let acc = 0
      for (let i = start; i < end; i++) acc += playFreq[i] ?? 0
      const raw = acc / ((end - start) * 255)
      const prev = bands[b] ?? 0
      bands[b] = prev + (raw - prev) * 0.4
      pSum += raw
    }
    frame.micLevel = 0
    frame.speakEnergy = Math.min(1, (pSum / 16) * 2.2)
  } else {
    frame.micLevel = 0
    frame.speakEnergy = currentSpeakEnergy()
  }
  return frame
}

/** Full teardown for route leave: abort STT, cancel TTS, release the mic. */
function disposeVoice() {
  abortListening()
  cancelSpeech()
  closeMic()
  thinkingRef.value = false
}

export function useDaVinciVoice() {
  return {
    sttSupported,
    ttsSupported,
    state,
    owner: computed(() => ownerRef.value),
    interimTranscript: computed(() => interimRef.value),
    micActive: computed(() => micActiveRef.value),
    micLevel: computed(() => micLevelRef.value),
    muted: computed(() => mutedRef.value),
    setMuted,
    startListening,
    stopListening,
    abortListening,
    setThinking,
    speak,
    unlockSpeech,
    cancelSpeech,
    getVoiceFrame,
    disposeVoice,
  }
}
