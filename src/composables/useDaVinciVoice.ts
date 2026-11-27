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

/** Something the merchant should know about the microphone being heard on. */
export interface MicNotice {
  /** 'info' — handled, just say so; 'warning' — nothing is being heard and they must act. */
  tone: 'info' | 'warning'
  text: string
}

export interface SpeakOptions {
  rate?: number
  pitch?: number
  onstart?: () => void
  /** Fires when audio actually begins (first utterance's real onstart). Unlike
   *  `onstart` (which fires as soon as we enter the speaking state), this is the
   *  reliable "the browser let us play" signal — it never fires when autoplay is
   *  blocked on a cold load, so callers can fall back to a tap-to-start. */
  onAudible?: () => void
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

// Identifies the current startListening call: a later call supersedes it, and only the current one may
// reset the shared listening state.
let listenCall = 0
// Set while a call is still opening its microphone and has no recognition to stop yet.
let cancelPendingStart: (() => void) | null = null

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
  const call = ++listenCall
  ownerRef.value = opts.owner
  interimRef.value = ''
  listeningRef.value = true

  return new Promise<string>((resolve, reject) => {
    let finalText = ''
    let settled = false
    // The recognition whose events count. Swapped when the session moves to another microphone; events
    // from the one left behind are ignored.
    let active: SpeechRecognition | null = null

    const cleanup = () => {
      if (listenCall === call) {
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

    /** Listens on `track` when given (the browser's own microphone otherwise). */
    const begin = (track?: MediaStreamTrack) => {
      const recog = new Ctor()
      active = recog
      recognition = recog
      recog.lang = opts.lang ?? (hasWindow ? navigator.language || 'en-US' : 'en-US')
      recog.interimResults = true
      recog.continuous = false
      recog.maxAlternatives = 1
      const heardOn = track ? inputName(track.label) : 'the browser’s microphone'
      noteDebug({ stt: `starting on ${heardOn}` })
      recog.onaudiostart = () => {
        if (active === recog) noteDebug({ stt: `capturing audio on ${heardOn}` })
      }

      recog.onresult = (e) => {
        if (active !== recog) return
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
          micNoticeRef.value = null // heard: whatever was wrong with the microphone no longer is
          noteDebug({ stt: `heard “${finalText.trim()}” (${heardOn})` })
          recog.stop()
          settle(() => resolve(finalText.trim()))
        }
      }
      recog.onerror = (e) => {
        if (active !== recog) return
        noteDebug({ stt: `ended: ${e.error} (${heardOn})` })
        const code = mapRecognitionError(e.error)
        // Silence and aborts are normal outcomes, not failures
        if (code === 'no-speech' || e.error === 'aborted') {
          settle(() => resolve(''))
          return
        }
        settle(() => reject(new VoiceError(code, e.message)))
      }
      recog.onend = () => {
        if (active === recog) settle(() => resolve(finalText.trim()))
      }

      try {
        // Chrome and Edge accept the track to hear on; the DOM types don't know the argument yet.
        if (track) (recog as unknown as { start(audioTrack: MediaStreamTrack): void }).start(track)
        else recog.start()
      } catch (err) {
        settle(() => reject(new VoiceError('unknown', err instanceof Error ? err.message : undefined)))
      }
    }

    // The browser's own microphone proved dead earlier this visit: capture from the one that works and
    // hand its track to recognition. (Never on Apple WebKit, which always follows the system input.)
    if (inputOverride && !isAppleWebKit) {
      const cancel = () => {
        if (cancelPendingStart === cancel) cancelPendingStart = null
        settle(() => resolve(''))
      }
      cancelPendingStart = cancel
      void openMic()
        .catch(() => {})
        .then(() => {
          if (cancelPendingStart === cancel) cancelPendingStart = null
          if (!settled) begin(mediaStream?.getAudioTracks()[0])
        })
      return
    }

    begin()
    // Analyser failure is non-fatal — STT capture is independent of getUserMedia.
    // Skipped on Apple WebKit (see isAppleWebKit) to avoid mic contention with STT.
    if (opts.withAnalyser && !isAppleWebKit) {
      const wanted = () => !settled && listenCall === call
      void openMic()
        .then(() => liveInputInstead(wanted))
        .then((track) => {
          if (!track) return
          if (!wanted()) {
            closeMic()
            return
          }
          // Move the session to the live microphone: drop the recognition that is hearing silence
          // (its abort is ignored) and listen again on the working track.
          const deaf = active
          active = null
          deaf?.abort()
          begin(track)
        })
        .catch(() => {})
    }
  })
}

/** Graceful stop — lets a pending final result flush before resolving. */
function stopListening() {
  cancelPendingStart?.()
  recognition?.stop()
}

/** Hard abort — discards results; the in-flight promise resolves ''. */
function abortListening() {
  cancelPendingStart?.()
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

// Diagnostic snapshot for the on-screen ?debug=1 readout — lets the failure be
// inspected on a user's machine (chosen voice local-vs-remote, last lifecycle
// event) without DevTools. Zero cost when the panel isn't rendered.
export interface VoiceDebug {
  voices: number
  chosen: string
  lastEvent: string
  /** What the cloud voice last did. `chosen` / `lastEvent` only track the browser's backup voice, so a
   *  working session used to read as two dashes — and a failing one looked the same. */
  cloud: string
  /** What speech recognition last did, and on which microphone. */
  stt: string
}
const debugRef = ref<VoiceDebug>({ voices: 0, chosen: '—', lastEvent: '—', cloud: '—', stt: '—' })
const noteDebug = (patch: Partial<VoiceDebug>) => {
  debugRef.value = { ...debugRef.value, ...patch }
}
/** Why the cloud voice last gave up, for the debug box. */
let cloudWhy = ''

/** Marojarvis voice-ranking port — prefers natural/neural voices. Pure, testable.
 *  localService is DOMINANT: a local voice always outranks any remote one. Chrome's
 *  remote/network voices (e.g. "Google UK English Male") intermittently stop
 *  producing audio — the engine reports speaking===true but onstart/audio never
 *  fire, especially after a few cancel/re-speak cycles (the greeting + every
 *  conversational turn). Local voices (Daniel, etc.) start in ~15ms and never
 *  silently drop. This is why the greeting "worked a couple of times then stopped"
 *  in Chrome while Safari (local-only voice list) was always fine. The +100 weight
 *  exceeds the sum of all quality bonuses (max 56), so locals win outright while the
 *  bonuses still order voices *within* the local set (and remotes remain a
 *  last-resort fallback on platforms that expose no local voice). */
// Da Vinci is a male persona — bias the browser (reply) voice toward a male one.
const MALE_VOICE =
  /\b(male|alex|daniel|david|fred|tom|thomas|arthur|oliver|george|aaron|james|mark|guy|eric|matthew|brian|nathan|ryan|paul|gordon|rishi|reed|albert|junior)\b/i
const FEMALE_VOICE =
  /\b(female|samantha|karen|victoria|tessa|moira|fiona|serena|allison|ava|susan|zira|hazel|catherine|kate|stephanie|veena|nicky|joana)\b/i
export function rankVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0
    if (v.localService) s += 100 // local always beats remote — see note above
    if (MALE_VOICE.test(v.name)) s += 40 // prefer a male voice (Da Vinci's persona)
    else if (FEMALE_VOICE.test(v.name)) s -= 25 // de-prioritize obviously-female voices
    if (/online \(natural\)|natural|neural|premium|enhanced/i.test(v.name)) s += 30
    if (/^en[-_]?gb/i.test(v.lang)) s += 50 // UK / British English strongly preferred
    else if (/^en[-_]/i.test(v.lang)) s += 6
    return s
  }
  return [...voices].sort((a, b) => score(b) - score(a))
}

function refreshVoices() {
  rankedVoices = rankVoices(window.speechSynthesis.getVoices())
  debugRef.value = { ...debugRef.value, voices: rankedVoices.length }
}

if (ttsSupported) {
  refreshVoices()
  // Chrome populates the list asynchronously; singleton lives for the app's lifetime
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

// Chrome returns getVoices() empty on a cold load until `voiceschanged` fires;
// speaking before voices exist ships a voiceless utterance that Chrome silently
// drops (intermittent silence). Resolve as soon as voices appear, else cap at
// 700ms — well under the autoGreet probe — so the greeting never hangs. Resolves
// instantly on Safari (voices are synchronous there), so no added latency.
let voicesReady: Promise<void> | null = null
function ensureVoices(): Promise<void> {
  if (!ttsSupported || rankedVoices.length) return Promise.resolve()
  if (voicesReady) return voicesReady
  voicesReady = new Promise<void>((resolve) => {
    let settled = false
    let poll: ReturnType<typeof setInterval>
    let cap: ReturnType<typeof setTimeout>
    const onChanged = () => {
      refreshVoices()
      if (rankedVoices.length) finish()
    }
    function finish() {
      if (settled) return
      settled = true
      clearInterval(poll)
      clearTimeout(cap)
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged)
      refreshVoices()
      resolve()
    }
    refreshVoices()
    if (rankedVoices.length) return finish()
    window.speechSynthesis.addEventListener('voiceschanged', onChanged)
    poll = setInterval(onChanged, 100) // some Chrome builds never fire voiceschanged again
    cap = setTimeout(finish, 700)
  })
  return voicesReady
}

// Safari/iOS only permit speechSynthesis.speak() that *begins* inside a user
// gesture. Replies are spoken from timers (the "thinking" delay), so prime the
// engine once from a real tap/click — then later async speaks are allowed.
let speechUnlocked = false
// True while only the silent unlock primer is queued/speaking. speak() must not
// treat it as real speech to interrupt — cancelling it trips Chrome's "speak
// dropped after cancel" bug and silences the greeting.
let primerPending = false
function unlockSpeech() {
  if (speechUnlocked || !ttsSupported) return
  speechUnlocked = true
  try {
    window.speechSynthesis.resume()
    const primer = new SpeechSynthesisUtterance(' ')
    primer.volume = 0
    primerPending = true
    primer.onend = primer.onerror = () => {
      primerPending = false
    }
    window.speechSynthesis.speak(primer)
  } catch {
    primerPending = false
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

function speakChunk(text: string, rate: number, pitch: number, token: number, onAudible?: () => void): Promise<void> {
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    if (!rankedVoices.length) refreshVoices() // Safari may never fire voiceschanged
    // Chrome reliably emits audio only with an explicit voice OBJECT (lang alone
    // is a complement, not a substitute) — fall back to the platform default.
    const voice =
      rankedVoices[0] ?? window.speechSynthesis.getVoices().find((v) => v.default) ?? window.speechSynthesis.getVoices()[0]
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || (hasWindow && navigator.language) || 'en-US'
      debugRef.value = { ...debugRef.value, chosen: `${voice.name} (${voice.localService ? 'local' : 'REMOTE'})` }
    } else {
      utterance.lang = (hasWindow && navigator.language) || 'en-US' // last resort: no voices at all
      debugRef.value = { ...debugRef.value, chosen: 'none (lang-only)' }
    }

    speakStartedAt = performance.now()
    speakEstimateMs = estimateSpeechMs(text)
    liveUtterances.push(utterance)

    let started = false
    let done = false
    let retryGuard: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(stallGuard)
      if (retryGuard) clearTimeout(retryGuard)
      const idx = liveUtterances.indexOf(utterance)
      if (idx >= 0) liveUtterances.splice(idx, 1)
      resolve()
    }
    // Chrome occasionally swallows onend — never let a chunk hang the chain
    const stallGuard = setTimeout(finish, speakEstimateMs * 2 + 2000)
    utterance.onstart = () => {
      started = true
      debugRef.value = { ...debugRef.value, lastEvent: `onstart @${Math.round(performance.now() - speakStartedAt)}ms` }
      onAudible?.()
    }
    utterance.onend = () => {
      debugRef.value = { ...debugRef.value, lastEvent: 'onend' }
      finish()
    }
    utterance.onerror = (e) => {
      debugRef.value = { ...debugRef.value, lastEvent: `onerror: ${(e as SpeechSynthesisErrorEvent).error}` }
      finish()
    }
    window.speechSynthesis.speak(utterance)
    // Chrome-only self-heal: the cold engine sometimes silently drops the first
    // utterance (speaking flips but onstart/onend never fire). If it hasn't
    // started and the engine is idle shortly after, retry once. Skipped on Safari
    // (fires onstart reliably) and bailed if a newer speak/cancel superseded us
    // (token guard) or it's merely slow-but-working (speaking/pending) — so it can
    // neither double-speak nor reintroduce the cancel→speak trap on the live path.
    if (!isAppleWebKit) {
      retryGuard = setTimeout(() => {
        if (done || started || token !== speakToken) return
        const ss = window.speechSynthesis
        if (ss.speaking || ss.pending) return
        try {
          ss.cancel()
          ss.resume()
          ss.speak(utterance)
        } catch {
          /* best-effort retry */
        }
      }, 450)
    }
  })
}

// ── Cloud TTS (realistic Gemini voice via /api/tts) — falls back to Web Speech ──
// ON: the natural Gemini voice. Per-utterance fallback to the browser voice if a
// synth fails/stalls (we do NOT disable cloud for the whole session). Synthesized
// WAV is cached by text, so the prefetched greeting + any repeated line play
// instantly; only a first-seen dynamic reply pays the ~5s synth.
let cloudTtsEnabled = true
let cloudAbort: AbortController | null = null
let playCtx: AudioContext | null = null
let playAnalyser: AnalyserNode | null = null
let playSource: AudioBufferSourceNode | null = null
const playFreq = new Uint8Array(256) // playback FFT → feeds the orb the real voice
/** The top of the range the orb's bands are cut from while Da Vinci speaks: speech sits below it. */
const VOICE_BAND_HZ = 4000
// text → synthesized WAV bytes. Seeded by prefetch() (e.g. the pre-baked greeting);
// decodeAudioData detaches its input, so always decode a .slice(0) copy.
const cloudAudioCache = new Map<string, ArrayBuffer>()
// Live streaming playback: PCM chunk sources currently scheduled ahead of the playhead —
// cancelSpeech() stops them all. Gemini streaming TTS is L16 24kHz mono.
let streamSources: AudioBufferSourceNode[] | null = null
const CLOUD_PCM_RATE = 24000
/** How long a streamed reply may go without a chunk, once it has started, before it is taken as over. */
const STREAM_STALL_MS = 8000

/**
 * Probe whether the browser will let us play audio right now (autoplay granted via
 * enterprise policy / launch flag / Safari per-site Auto-Play / Chrome MEI / carried
 * activation). Chrome leaves a blocked `resume()` promise PENDING — never await it
 * bare; race it with a short timeout, then read the state.
 */
async function tryUnlockAudio(): Promise<boolean> {
  if (!hasWindow) return false
  if (!playCtx) playCtx = new AudioContext()
  if (playCtx.state === 'suspended') {
    await Promise.race([playCtx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 250))])
  }
  return playCtx.state === 'running'
}

/**
 * Notify when the playback AudioContext becomes running — Chrome auto-resumes it on a
 * later grant/gesture, firing `statechange`. Returns a cleanup fn.
 */
function onAudioUnlocked(cb: () => void): () => void {
  if (!hasWindow) return () => {}
  if (!playCtx) playCtx = new AudioContext()
  const ctx = playCtx
  const handler = () => {
    if (ctx.state === 'running') cb()
  }
  ctx.addEventListener('statechange', handler)
  return () => ctx.removeEventListener('statechange', handler)
}

/**
 * Da Vinci's "open mix" — the audition-winning comm-channel production, as a Web Audio
 * graph applied live to ALL cloud speech (baked lines are raw of it, so it runs exactly
 * once): band-limit → gentle presence/warmth EQ → compression + makeup → two short
 * parallel echo taps. Returns the entry node; the tail is wired into `analyser` so the
 * orb reacts to the processed sound. Nodes are per-playback and GC'd with their sources.
 */
function buildVoiceChain(ctx: AudioContext, analyser: AnalyserNode): AudioNode {
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 120
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 9000
  const warm = ctx.createBiquadFilter()
  warm.type = 'peaking'
  warm.frequency.value = 300
  warm.Q.value = 1
  warm.gain.value = 2
  const presence = ctx.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = 3500
  presence.Q.value = 1
  presence.gain.value = 2
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 2.5
  comp.attack.value = 0.01
  comp.release.value = 0.16
  comp.knee.value = 6
  const makeup = ctx.createGain()
  makeup.gain.value = 1.35
  hp.connect(lp)
  lp.connect(warm)
  warm.connect(presence)
  presence.connect(comp)
  comp.connect(makeup)
  // Dry straight through; two quiet short delay taps in parallel for the hint of room.
  makeup.connect(analyser)
  for (const [delay, level] of [
    [0.045, 0.1],
    [0.07, 0.06],
  ] as const) {
    const d = ctx.createDelay(0.2)
    d.delayTime.value = delay
    const g = ctx.createGain()
    g.gain.value = level
    makeup.connect(d)
    d.connect(g)
    g.connect(analyser)
  }
  return hp
}

// ── Comm-link chime (session open/close earcons; pre-produced WAVs, played plain —
// the voice chain would double-process them). Decoded AudioBuffers are reusable.
const chimeBuffers = new Map<string, AudioBuffer>()
async function playChime(kind: 'open' | 'close'): Promise<void> {
  if (!hasWindow || !(await tryUnlockAudio()) || !playCtx) return
  const ctx = playCtx
  try {
    let buf = chimeBuffers.get(kind)
    if (!buf) {
      const resp = await fetch(`/davinci/chime-${kind}.wav`)
      if (!resp.ok) return
      buf = await ctx.decodeAudioData(await resp.arrayBuffer())
      chimeBuffers.set(kind, buf)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const an = ctx.createAnalyser()
    an.fftSize = 512
    an.smoothingTimeConstant = 0.7
    src.connect(an)
    an.connect(ctx.destination)
    if (!playAnalyser) playAnalyser = an // orb pulses with the chime unless speech owns it
    await new Promise<void>((resolve) => {
      src.onended = () => resolve()
      try {
        src.start()
      } catch {
        resolve()
      }
    })
    if (playAnalyser === an) playAnalyser = null
    try {
      an.disconnect()
    } catch {
      /* noop */
    }
  } catch {
    /* best-effort earcon */
  }
}

/** Decode WAV bytes and play through an analyser (so the orb reacts to the real audio). */
async function playCloudBuffer(arrayBuf: ArrayBuffer, token: number, onAudible?: () => void): Promise<void> {
  if (!playCtx) playCtx = new AudioContext()
  if (playCtx.state === 'suspended') {
    // Race the resume — a blocked Chrome resume() stays pending forever (see tryUnlockAudio).
    await Promise.race([playCtx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 250))])
  }
  // Autoplay-blocked (cold load, no user gesture yet): don't fake playback — bail so
  // the caller's probe shows tap-to-start; the gesture-driven retry will play it.
  if (playCtx.state !== 'running') return
  const audioBuf = await playCtx.decodeAudioData(arrayBuf)
  if (token !== speakToken) return
  const src = playCtx.createBufferSource()
  src.buffer = audioBuf
  const an = playCtx.createAnalyser()
  an.fftSize = 512
  an.smoothingTimeConstant = 0.7
  src.connect(buildVoiceChain(playCtx, an))
  an.connect(playCtx.destination)
  playSource = src
  playAnalyser = an
  speakStartedAt = performance.now()
  speakEstimateMs = audioBuf.duration * 1000
  await new Promise<void>((resolve) => {
    src.onended = () => resolve()
    try {
      src.start()
      onAudible?.() // real audio is now playing (ctx is running)
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
// Cache HIT (pre-baked greeting / prefetched line) → play the full WAV instantly.
// Cache MISS (dynamic reply) → STREAM it: play PCM chunks as they arrive so audio starts
// ~1.8s in instead of after the whole ~5s clip. 'unavailable' → caller falls back to the
// instant browser voice for THAT utterance only (cloud stays on for the next line).
async function speakViaCloud(text: string, token: number, opts: SpeakOptions): Promise<CloudOutcome> {
  const key = text.trim()
  const cached = cloudAudioCache.get(key)
  if (cached) {
    try {
      await playCloudBuffer(cached.slice(0), token, opts.onAudible) // slice: decodeAudioData detaches it
    } catch {
      return token !== speakToken ? 'cancelled' : 'unavailable'
    }
    return token === speakToken ? 'played' : 'cancelled'
  }
  return playCloudStream(key, token, opts)
}

/** Stream a reply: schedule PCM chunks back-to-back on the AudioContext as they arrive from
 *  /api/tts (stream), so the voice starts at the first chunk (~1.8s) rather than the full clip. */
async function playCloudStream(text: string, token: number, opts: SpeakOptions): Promise<CloudOutcome> {
  cloudWhy = ''
  if (!(await tryUnlockAudio()) || !playCtx) {
    cloudWhy = 'the browser is blocking sound until a click'
    return 'unavailable' // autoplay-blocked → browser fallback
  }
  const ctx = playCtx

  const controller = new AbortController()
  cloudAbort = controller
  // Time-cap the WAIT FOR FIRST BYTE only (Gemini stall/quota). Cleared once bytes flow.
  let timedOut = false
  const firstByteGuard = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 12000)
  let resp: Response
  try {
    resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, stream: true }),
      signal: controller.signal,
    })
  } catch {
    clearTimeout(firstByteGuard)
    if (cloudAbort === controller) cloudAbort = null
    cloudWhy = timedOut ? 'no answer from the voice service in 12s' : 'the voice service could not be reached'
    if (timedOut) return 'unavailable'
    return token !== speakToken || controller.signal.aborted ? 'cancelled' : 'unavailable'
  }
  // `cloudAbort` stays set while the body streams (cleanup clears it): Interrupt and End must be able to
  // abort a reply that is still arriving, not only one that has not started.
  if (token !== speakToken) {
    clearTimeout(firstByteGuard)
    if (cloudAbort === controller) cloudAbort = null
    return 'cancelled'
  }
  if (!resp.ok || !resp.body) {
    clearTimeout(firstByteGuard)
    if (cloudAbort === controller) cloudAbort = null
    cloudWhy = `the voice service answered HTTP ${resp.status}`
    return 'unavailable' // 429/503 → browser fallback
  }

  const an = ctx.createAnalyser()
  an.fftSize = 512
  an.smoothingTimeConstant = 0.7
  an.connect(ctx.destination)
  playAnalyser = an // orb reacts to the real audio
  const chainIn = buildVoiceChain(ctx, an)
  const sources: AudioBufferSourceNode[] = []
  streamSources = sources
  let nextTime = 0
  let leftover = new Uint8Array(0)
  let started = false
  speakStartedAt = performance.now()

  // A stream that goes quiet mid-reply used to hang the read for good — the first-byte guard is cleared by
  // then and nothing else ended it, so the hands-free loop sat on "Starting…" until the mic was tapped.
  // Once audio is flowing, a gap this long ends the stream: what has arrived plays out as the reply.
  let stalled = false
  let stallGuard: ReturnType<typeof setTimeout> | undefined
  const armStallGuard = () => {
    clearTimeout(stallGuard)
    stallGuard = setTimeout(() => {
      stalled = true
      controller.abort()
    }, STREAM_STALL_MS)
  }

  const cleanup = () => {
    clearTimeout(firstByteGuard)
    clearTimeout(stallGuard)
    if (cloudAbort === controller) cloudAbort = null
    if (streamSources === sources) streamSources = null
    if (playAnalyser === an) {
      try {
        an.disconnect()
      } catch {
        /* noop */
      }
      playAnalyser = null
    }
  }
  const scheduleChunk = (chunk: Uint8Array) => {
    let bytes = chunk
    if (leftover.length) {
      const merged = new Uint8Array(leftover.length + chunk.length)
      merged.set(leftover)
      merged.set(chunk, leftover.length)
      bytes = merged
    }
    const usable = bytes.length - (bytes.length % 2) // whole 16-bit samples
    leftover = bytes.slice(usable)
    if (usable < 2) return
    const samples = usable / 2
    const dv = new DataView(bytes.buffer, bytes.byteOffset, usable)
    const audioBuf = ctx.createBuffer(1, samples, CLOUD_PCM_RATE)
    const ch = audioBuf.getChannelData(0)
    for (let i = 0; i < samples; i++) ch[i] = dv.getInt16(i * 2, true) / 32768
    const src = ctx.createBufferSource()
    src.buffer = audioBuf
    src.connect(chainIn)
    const at = Math.max(nextTime, ctx.currentTime + 0.08)
    src.start(at)
    nextTime = at + audioBuf.duration
    sources.push(src)
    if (!started) {
      started = true
      clearTimeout(firstByteGuard) // audio is flowing — no longer a stall
      opts.onAudible?.()
    }
  }

  try {
    const reader = resp.body.getReader()
    for (;;) {
      if (started) armStallGuard()
      const { done, value } = await reader.read()
      if (token !== speakToken) throw new Error('cancelled')
      if (done) break
      if (value && value.length) scheduleChunk(value)
    }
  } catch {
    // A stalled stream is not an interruption: fall through and let the audio already scheduled finish.
    if (!stalled || token !== speakToken) {
      for (const s of sources) {
        try {
          s.stop()
        } catch {
          /* already stopped */
        }
      }
      cleanup()
      if (token !== speakToken || controller.signal.aborted) return started ? 'cancelled' : timedOut ? 'unavailable' : 'cancelled'
      return started ? 'played' : 'unavailable'
    }
  }

  // Let the last scheduled chunk finish before resolving (so the reply loop waits for TTS).
  const remainMs = Math.max(0, (nextTime - ctx.currentTime) * 1000)
  await new Promise((r) => setTimeout(r, remainMs))
  cleanup()
  if (token !== speakToken) return 'cancelled'
  return started ? 'played' : 'unavailable'
}

/** Warm the cache for a line so it later plays instantly (no ~5s synth at speak time).
 *  Pass `url` to seed from a pre-baked static asset (e.g. the greeting WAV). Best-effort. */
async function prefetchSpeech(text: string, url?: string): Promise<void> {
  if (!cloudTtsEnabled) return
  const key = text.trim()
  if (!key || cloudAudioCache.has(key)) return
  try {
    const resp = url
      ? await fetch(url)
      : await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: key }),
        })
    if (!resp.ok) return
    const buf = await resp.arrayBuffer()
    if (buf.byteLength) cloudAudioCache.set(key, buf)
  } catch {
    /* best-effort prefetch */
  }
}

async function speakViaBrowser(text: string, token: number, opts: SpeakOptions, didCancel = false): Promise<void> {
  // Chrome drops an utterance enqueued synchronously after cancel() — defer one
  // tick, but only when we actually cancelled (else we'd add the Chrome trap to
  // the greeting, which has nothing to cancel).
  if (didCancel) await new Promise((r) => setTimeout(r, 60))
  if (token !== speakToken) return
  // Chrome can leave the engine paused (esp. after idle/backgrounding) — silently
  // swallowing speak(). resume() before each turn keeps the device voice reliable.
  try {
    window.speechSynthesis.resume()
  } catch {
    /* best-effort */
  }
  // Wait for Chrome's voice list before the first utterance (no-op on Safari).
  await ensureVoices()
  if (token !== speakToken) return
  let audibleFired = false
  const fireAudible = () => {
    if (audibleFired) return
    audibleFired = true
    opts.onAudible?.()
  }
  for (const chunk of chunkSpeech(text)) {
    if (token !== speakToken) return
    await speakChunk(chunk, opts.rate ?? 0.99, opts.pitch ?? 1.0, token, fireAudible)
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
  // Only interrupt when REAL speech is active. The silent unlock primer
  // (primerPending) must not count — cancelling it trips Chrome's "speak
  // dropped after cancel" bug and silences the greeting.
  const realActive =
    speakingRef.value ||
    (ttsSupported && (window.speechSynthesis.speaking || window.speechSynthesis.pending) && !primerPending)
  if (realActive) cancelSpeech()
  const token = ++speakToken

  speakingRef.value = true
  opts.onstart?.()

  try {
    if (mutedRef.value) {
      // Visual-only (muted): no audio, but the orb still pulses
      noteDebug({ cloud: 'silent — voice is switched off' })
      speakStartedAt = performance.now()
      speakEstimateMs = estimateSpeechMs(clean)
      await new Promise((r) => setTimeout(r, speakEstimateMs))
      return
    }
    // 1. Realistic Gemini cloud voice (cached → instant; first synth ~5s)
    if (cloudTtsEnabled) {
      const source = cloudAudioCache.has(clean) ? 'ready-made clip' : 'live from the voice service'
      noteDebug({ cloud: `speaking (${source})…` })
      cloudWhy = ''
      // "Played" only means the clip was handed to the browser. Sound that a browser is holding back
      // until a click never becomes audible, so the box says which it was.
      let audible = false
      const outcome = await speakViaCloud(clean, token, {
        ...opts,
        onAudible: () => {
          audible = true
          opts.onAudible?.()
        },
      })
      noteDebug({
        cloud:
          outcome === 'cancelled' ? `interrupted (${source})`
            : outcome === 'unavailable' ? `failed — ${cloudWhy || 'no audio came back'}; using the browser’s backup voice`
              : audible ? `played (${source})`
                : `no sound came out (${source}) — the browser is holding sound back until a click`,
      })
      if (outcome === 'played' || outcome === 'cancelled') return
      // 'unavailable' → fall through to the browser voice for THIS utterance only
      // (keep cloud enabled so the next line still tries the natural voice).
    }
    // 2. Browser Web Speech fallback
    if (ttsSupported) {
      await speakViaBrowser(clean, token, opts, realActive)
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
  // streaming reply: stop every PCM chunk scheduled ahead of the playhead
  if (streamSources) {
    for (const s of streamSources) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
    streamSources = null
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
const frame: OrbAudioFrame = { micActive: false, micLevel: 0, bands, speakEnergy: 0, voiceActive: false }

// ── Which microphone ─────────────────────────────────────────────────────────
// Chrome and Edge record from the microphone chosen in THEIR settings, not the system's. When that one
// is dead — a laptop's built-in mic with the lid closed, say — it delivers digital silence: recognition
// hears nothing, and the session sat on "Listening…" for good while the merchant spoke into a headset.
// (Safari follows the system input, so the same machine worked there.) The first capture checks the
// chosen microphone; if it is silent and the system's own input is another, live device, every capture
// this visit uses that one instead, and the page says so.
const SYSTEM_INPUT = 'default' // Chrome's and Edge's id for "whatever the system uses"
const micNoticeRef = ref<MicNotice | null>(null)
/** The input to capture instead of the browser's own choice, once that proved dead. */
let inputOverride: string | null = null
/** The browser's choice has been checked this visit (alive, or dead with nothing better). */
let inputChecked = false

if (hasWindow && navigator.mediaDevices?.addEventListener) {
  // A microphone plugged in or pulled out changes the answer: check again on the next capture.
  navigator.mediaDevices.addEventListener('devicechange', () => {
    inputOverride = null
    inputChecked = false
    micNoticeRef.value = null
  })
}

/** "Default - EPOS IMPACT 760T (1395:019f)" → "EPOS IMPACT 760T": a device name as a person would say it. */
const inputName = (label?: string): string =>
  (label ?? '').replace(/^Default - /, '').replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim() || 'your microphone'

/** True when the open mic delivers nothing but digital silence for `ms` — a live mic, however quiet, never does. */
async function micIsSilent(ms: number): Promise<boolean> {
  const node = analyser
  if (!node) return false
  const samples = new Float32Array(node.fftSize)
  const until = performance.now() + ms
  while (performance.now() < until) {
    if (analyser !== node) return false // closed meanwhile — nothing learned
    node.getFloatTimeDomainData(samples)
    if (samples.some((value) => value !== 0)) return false
    await new Promise((r) => setTimeout(r, 100))
  }
  return analyser === node
}

/**
 * Checks the microphone the browser chose (already open). When it is dead and the system's own input is
 * another, live device, opens that one and returns its track to hear on; otherwise null. `wanted` says
 * whether the listen that asked is still going — a mic is never left open for one that has ended.
 */
async function liveInputInstead(wanted: () => boolean): Promise<MediaStreamTrack | null> {
  if (inputChecked || !analyser || audioCtx?.state !== 'running') return null
  const chosen = inputName(mediaStream?.getAudioTracks()[0]?.label)
  const silent = await micIsSilent(1500)
  if (!wanted()) return null // ended while checking: check again next time
  inputChecked = true
  if (!silent) return null

  closeMic()
  await openMic(SYSTEM_INPUT).catch(() => {})
  const track = mediaStream?.getAudioTracks()[0]
  const system = inputName(track?.label)
  const alive = !!track && system !== chosen && !(await micIsSilent(1000))
  if (!wanted()) {
    closeMic()
    return null
  }
  if (alive && track) {
    inputOverride = SYSTEM_INPUT
    micNoticeRef.value = {
      tone: 'info',
      text: `“${chosen}” is silent, so I’m listening on “${system}” — the microphone your system uses.`,
    }
    return track
  }
  // Nothing better to listen on: say so, and keep the chosen one open for the orb.
  closeMic()
  await openMic(null).catch(() => {})
  if (!wanted()) closeMic()
  micNoticeRef.value = {
    tone: 'warning',
    text: `I can’t hear anything from “${chosen}”. Check which microphone your browser is using — the mic icon in the address bar.`,
  }
  return null
}

/** Opens the microphone for the analyser: the override once one is set, else the browser's own choice. */
async function openMic(deviceId: string | null = inputOverride): Promise<void> {
  if (analyser) return
  const session = micSession
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true })
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
  frame.voiceActive = false
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
    // Loudness, over the same wide range as before (the ring's swell is tuned to it).
    const usable = Math.floor(playFreq.length * 0.7)
    let pSum = 0
    for (let i = 0; i < usable; i++) pSum += playFreq[i] ?? 0
    // The 16 bands cover only where a voice lives (up to VOICE_BAND_HZ). Spread over the whole range,
    // speech filled the first three or four and left the rest of the ring with nothing to move to.
    const binHz = playAnalyser.context.sampleRate / playAnalyser.fftSize
    const voiceBins = Math.min(playFreq.length, Math.max(16, Math.round(VOICE_BAND_HZ / binHz)))
    for (let b = 0; b < 16; b++) {
      const start = Math.floor((b / 16) * voiceBins)
      const end = Math.max(start + 1, Math.floor(((b + 1) / 16) * voiceBins))
      let acc = 0
      for (let i = start; i < end; i++) acc += playFreq[i] ?? 0
      const raw = acc / ((end - start) * 255)
      const prev = bands[b] ?? 0
      bands[b] = prev + (raw - prev) * 0.4
    }
    frame.micLevel = 0
    frame.speakEnergy = Math.min(1, (pSum / (usable * 255)) * 2.2)
    frame.voiceActive = true
  } else {
    frame.micLevel = 0
    frame.speakEnergy = currentSpeakEnergy()
  }
  return frame
}

/**
 * What the debug box cannot watch reactively (`?debug=1` on the voice page polls it): whether the browser
 * lets sound play, how many replies are ready-made, and the microphone open right now.
 */
function diagnostics(): { sound: string; readyClips: number; input: string | null } {
  return {
    sound: !playCtx ? 'not started yet' : playCtx.state === 'running' ? 'allowed' : `held back by the browser (${playCtx.state})`,
    readyClips: cloudAudioCache.size,
    input: mediaStream ? inputName(mediaStream.getAudioTracks()[0]?.label) : null,
  }
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
    micNotice: computed(() => micNoticeRef.value),
    muted: computed(() => mutedRef.value),
    voiceDebug: computed(() => debugRef.value),
    diagnostics,
    setMuted,
    startListening,
    stopListening,
    abortListening,
    setThinking,
    speak,
    playChime,
    prefetchSpeech,
    unlockSpeech,
    tryUnlockAudio,
    onAudioUnlocked,
    cancelSpeech,
    getVoiceFrame,
    disposeVoice,
  }
}
