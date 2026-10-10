"use client"

import * as React from "react"


/*
 * The sound library: every component's own synthesised voice (Web Audio, no files), the
 * design's tones ported as they are, for buttons, text fields and progress. They play only inside a
 * SoundProvider that's switched on (its choice is saved in this browser), so a page without the
 * provider stays silent. The AudioContext is made on the first sound, which always follows a gesture.
 */

let audio: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext | undefined }).webkitAudioContext
    if (!Ctor) return null
    audio ??= new Ctor()
    if (audio.state === "suspended") void audio.resume()
    return audio
  } catch {
    return null
  }
}

/** A tone. f: Hz, d: seconds, v: peak gain, w: delay (s), to: pitch glide target (Hz). */
function tone(f: number, d: number, type: OscillatorType = "sine", v = 0.06, w = 0, to?: number) {
  const a = context()
  if (!a) return
  const t = a.currentTime + w
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + d)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(v, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d)
  osc.connect(gain)
  gain.connect(a.destination)
  osc.start(t)
  osc.stop(t + d + 0.03)
}

/** Band-passed white noise; freq → to sweeps the filter. */
function noise(d: number, v: number, freq: number, to?: number, w = 0) {
  const a = context()
  if (!a) return
  const t = a.currentTime + w
  const length = Math.floor(a.sampleRate * d)
  const buffer = a.createBuffer(1, length, a.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) channel[i] = Math.random() * 2 - 1
  const source = a.createBufferSource()
  source.buffer = buffer
  const filter = a.createBiquadFilter()
  filter.type = "bandpass"
  filter.Q.value = 0.9
  filter.frequency.setValueAtTime(freq, t)
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + d)
  const gain = a.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(v, t + d * 0.35)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(a.destination)
  source.start(t)
  source.stop(t + d + 0.02)
}

const SFX = {
  tick: () => tone(1500, 0.03, "triangle", 0.035),
  press: () => tone(320, 0.07, "triangle", 0.07, 0, 190),
  chime: () => {
    tone(659, 0.22, "sine", 0.055)
    tone(988, 0.38, "sine", 0.05, 0.09)
  },
  pop: () => tone(420, 0.09, "sine", 0.09, 0, 900),
  drop: () => tone(720, 0.1, "sine", 0.07, 0, 320),
  whoosh: () => noise(0.42, 0.1, 450, 4200),
  thud: () => {
    tone(150, 0.25, "sine", 0.16, 0, 45)
    noise(0.18, 0.06, 900, 250)
  },
  buzz: () => {
    tone(120, 0.08, "square", 0.035)
    tone(105, 0.1, "square", 0.035, 0.11)
  },
  toggle: () => {
    tone(1100, 0.025, "square", 0.022)
    tone(520, 0.06, "triangle", 0.05, 0.035)
  },
  cancel: () => tone(260, 0.06, "triangle", 0.04),
  sparkle: () => [0, 1, 2].forEach((i) => tone(1500 + i * 380, 0.1, "sine", 0.035, i * 0.055)),
  paper: () => {
    noise(0.09, 0.07, 3500, 7000)
    tone(1200, 0.03, "triangle", 0.03, 0.04)
  },
  snap: () => {
    tone(1200, 0.03, "square", 0.03)
    tone(1600, 0.08, "triangle", 0.05, 0.05)
  },
  bell: () => {
    tone(1320, 0.35, "sine", 0.04)
    tone(1760, 0.3, "sine", 0.03, 0.04)
    tone(1320, 0.25, "sine", 0.025, 0.16)
  },
  ratchet: () => [0, 1, 2].forEach((i) => tone(2200, 0.012, "square", 0.02, i * 0.06)),
  uhOh: () => {
    tone(1500, 0.03, "triangle", 0.035)
    tone(560, 0.08, "triangle", 0.04, 0.06, 420)
  },
  cash: () => {
    tone(784, 0.12, "sine", 0.06)
    tone(988, 0.12, "sine", 0.06, 0.08)
    tone(1319, 0.45, "sine", 0.06, 0.16)
  },
  print: (n = 10) => {
    for (let i = 0; i < n; i++) tone(2300 + Math.random() * 500, 0.008, "square", 0.016, i * 0.075)
  },
  lift: () => tone(300, 0.08, "sine", 0.05, 0, 520),
  land: () => tone(160, 0.1, "sine", 0.1, 0, 90),
  rewind: () => noise(0.25, 0.05, 3000, 600),
  regen: () => {
    noise(0.5, 0.05, 2400, 500)
    tone(500, 0.08, "triangle", 0.04)
  },
  /** Seven faint ticks as new words land. */
  words: () => {
    for (let i = 0; i < 7; i++) tone(1700 + Math.random() * 600, 0.012, "triangle", 0.014, i * 0.045)
  },
  sparkleHi: () => tone(1400, 0.08, "sine", 0.03, 0.08),
  softTick: () => tone(900, 0.03, "triangle", 0.03),
  arpeggio: () => [0, 1, 2, 3].forEach((i) => tone(900 + i * 160, 0.04, "sine", 0.035, 0.04 + i * 0.045)),
  recStart: () => {
    tone(600, 0.05, "sine", 0.05)
    tone(900, 0.07, "sine", 0.05, 0.07)
  },
  recStop: () => tone(900, 0.06, "sine", 0.05, 0, 500),
  // Messages and pickers.
  /** A two-note motif per tone: info, success, warning, error (rising for the good news). */
  toneSig: (k: 0 | 1 | 2 | 3) => [[659, 988], [784, 1175], [587, 740], [330, 247]][k]!.forEach((f, i) => tone(f, 0.16, "sine", 0.045, i * 0.08)),
  toastSig: (k: 0 | 1 | 2 | 3) => [[880, 1320], [740, 988], [622, 523], [330, 262]][k]!.forEach((f, i) => tone(f, 0.12, "sine", 0.04, i * 0.07)),
  dismiss: () => noise(0.25, 0.04, 2600, 600),
  restore: () => noise(0.25, 0.04, 600, 2600),
  /** A month or page turn: 1 forward, -1 back. */
  turn: (dir: 1 | -1) => noise(0.18, 0.025, dir > 0 ? 900 : 2400, dir > 0 ? 2400 : 900),
  /** A wheel detent; `i` is the row index in the hour or minute column. */
  wheel: (i: number, kind: "h" | "m") => (kind === "h" ? tone(700 + (i + 1) * 30, 0.012, "triangle", 0.025) : tone(900 + i * 6, 0.01, "triangle", 0.02)),
  /** Hovering across a range: pitch rises with the length. */
  hover: (i: number) => tone(600 + Math.min(40, i) * 20, 0.012, "triangle", 0.018),
  // Charts.
  /** A range or metric change: one swoosh. */
  morph: () => noise(0.22, 0.03, 700, 2600),
  /** Rows re-sorting. */
  reorder: () => noise(0.35, 0.03, 600, 2800),
  /** A live burst; pitch climbs with its size. */
  burst: (n: number) => tone(600 + Math.min(900, n * 3), 0.08, "sine", 0.05, 0, 900 + Math.min(1200, n * 4)),
  /** A level from 0 (low) to 1 (high). */
  level: (t: number) => tone(500 + t * 800, 0.04, "sine", 0.03),
  /** A check's state: 0 failing … 3 excellent. */
  pass: (lv: number) => tone([440, 620, 820, 1100][lv] ?? 1100, 0.14, "sine", 0.035),
  source: (i: number) => tone(1300 + i * 160, 0.02, "triangle", 0.025),
  // Text fields.
  /** A keystroke; the pitch varies so typing never sounds mechanical. */
  key: () => tone(1900 + Math.random() * 700, 0.014, "triangle", 0.012),
  del: () => tone(1100 + Math.random() * 200, 0.016, "triangle", 0.012),
  focus: () => tone(880, 0.03, "sine", 0.018),
  /** Ascending note n = 0..4 (C5 E5 G5 C6 E6), e.g. password rules met. */
  ding: (n: number) => tone([523, 659, 784, 1047, 1319][n] ?? 1047, 0.2, "sine", 0.045),
  clear: () => noise(0.18, 0.04, 2500, 900),
  swooshIn: () => noise(0.25, 0.04, 600, 2600),
  swooshOut: () => noise(0.22, 0.035, 2600, 600),
  decode: () => tone(2000 + Math.random() * 900, 0.008, "square", 0.008),
  detent: (v: number) => tone(1000 + ((v / 10) % 12) * 40, 0.012, "triangle", 0.025),
  taken: () => tone(220, 0.12, "triangle", 0.04, 0, 180),
  // Progress.
  /** A decile tick: call when floor(pct / 10) increases. */
  decile: (d: number) => tone(900 + d * 45, 0.02, "triangle", 0.025),
  cell: (i: number) => tone(480 + i * 26, 0.025, "triangle", 0.03),
  tickTock: (n: number, urgent = false) => tone(n % 2 ? 1250 : 980, 0.012, "triangle", urgent ? 0.035 : 0.012),
  rise: () => tone(700, 0.1, "sine", 0.04, 0, 1100),
  alertWarn: () => tone(660, 0.12, "triangle", 0.05),
  offline: () => tone(520, 0.14, "triangle", 0.05, 0, 260),
  online: () => tone(400, 0.12, "sine", 0.05, 0, 900),
  fall: () => tone(700, 0.12, "sine", 0.04, 0, 420),
  settle: () => tone(900, 0.1, "sine", 0.04, 0, 400),
  warn: () => {
    tone(880, 0.12, "triangle", 0.05)
    tone(660, 0.16, "triangle", 0.05, 0.14)
  },
  stepFwd: (i: number) => {
    noise(0.2, 0.025, 800, 2400)
    tone(600 + i * 120, 0.06, "triangle", 0.045)
  },
  stepBack: (i: number) => {
    noise(0.2, 0.025, 2400, 800)
    tone(700 + i * 60, 0.06, "triangle", 0.04, 0, 450)
  },
  reveal: () => {
    tone(880, 0.08, "sine", 0.035)
    tone(1320, 0.1, "sine", 0.025, 0.08)
  },
  /** A pitched step: a stepper's quantity, a progress decile. */
  step: (n: number, base = 480, inc = 70) => tone(base + n * inc, 0.06, "triangle", 0.06),
  // Data: sorting, folding, selecting, scrubbing and flipping an operator.
  sortSwoosh: (asc: boolean) => {
    noise(0.22, 0.03, 900, 2600)
    tone(asc ? 700 : 900, 0.04, "triangle", 0.04, 0.05, asc ? 900 : 700)
  },
  open: () => tone(900, 0.03, "triangle", 0.035, 0, 1150),
  close: () => tone(650, 0.03, "triangle", 0.035, 0, 500),
  select: () => tone(1300, 0.015, "triangle", 0.025),
  scrub: (i: number) => tone(1100 + i * 14, 0.01, "triangle", 0.016),
  flip: (negative: boolean) => tone(negative ? 620 : 880, 0.035, "triangle", 0.04, 0, negative ? 480 : 1040),
  // Moments and navigation.
  play: () => tone(420, 0.09, "sine", 0.08, 0, 900),
  pause: () => tone(700, 0.08, "sine", 0.06, 0, 380),
  /** A track or page skip: 1 forward, -1 back. */
  skip: (dir: 1 | -1) => noise(0.25, 0.03, dir > 0 ? 900 : 2600, dir > 0 ? 2600 : 900),
  /** A like: a rising pop with a high glint. */
  heart: () => {
    tone(520, 0.09, "sine", 0.08, 0, 1100)
    tone(1320, 0.12, "sine", 0.03, 0.08)
  },
  hum: () => tone(220, 0.25, "sine", 0.02, 0, 330),
  /** A reel detent; the pitch walks with the row. */
  reel: (i: number, base = 900, step = 25) => tone(base + i * step, 0.01, "triangle", 0.022),
  /** The mic opens (listening, recording) and closes. */
  listen: () => tone(660, 0.08, "sine", 0.05, 0, 990),
  unlisten: () => tone(800, 0.08, "sine", 0.04, 0, 420),
  // Motion: flicks, tucks, stretch sliders and swipe thresholds.
  flick: () => noise(0.3, 0.05, 2200, 500),
  tuck: () => noise(0.25, 0.04, 1600, 400),
  /** A slider detent every 5%; v = 0..100. */
  detentPct: (v: number) => tone(500 + v * 7, 0.012, "triangle", 0.022),
  /** A low thump at a slider's end. */
  rubber: () => tone(170, 0.08, "sine", 0.06),
  /** A gesture's threshold, armed (past) or released. */
  threshold: (past: boolean) => tone(past ? 1000 : 760, 0.03, "triangle", 0.035, 0, past ? 1300 : 600),
  markDone: () => tone(880, 0.06, "sine", 0.04, 0, 1320),
  /** Billing set to yearly: a two-note rise, then three sparkle ticks. */
  yearly: () => {
    tone(784, 0.1, "sine", 0.035)
    tone(1175, 0.14, "sine", 0.03, 0.08)
    ;[0, 1, 2].forEach((i) => tone(1400 + i * 160, 0.03, "triangle", 0.02, 0.18 + i * 0.07))
  },
  /** Billing set back to monthly: a falling tick. */
  monthly: () => tone(700, 0.06, "triangle", 0.035, 0, 500),
  /** A card under the pointer, pitched by its position. */
  cardHover: (i: number) => tone(880 + i * 110, 0.02, "triangle", 0.018),
  /** A request on its way. */
  send: () => tone(520, 0.05, "triangle", 0.035, 0, 780),
  /** A price tier crossed, up or down. */
  tierShift: (up: boolean) => {
    tone(up ? 1046 : 520, 0.12, "sine", 0.04)
    tone(up ? 1318 : 440, 0.14, "sine", 0.03, 0.08)
  },
  /** A seat count step, rising with the count. */
  seats: (n: number) => tone(600 + n / 4, 0.02, "triangle", 0.03),
  /** A list narrowing to fewer rows (on) or opening back up. */
  narrow: (on: boolean) => noise(0.3, 0.03, on ? 2600 : 800, on ? 800 : 2600),
  /** A raw tone, for one-off pitches (a sync count, a deploy stage). */
  tone,
  /** Raw noise, for sweeps (a passkey scan). */
  noise,
}

type Sfx = typeof SFX

const SILENT = Object.fromEntries(Object.keys(SFX).map((k) => [k, () => undefined])) as unknown as Sfx

/** A continuous rising tone for hold-to-confirm; stop() on release or completion. */
function startHoldTone(durationS = 1.1) {
  const a = context()
  if (!a) return { stop() {} }
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(140, t)
  osc.frequency.exponentialRampToValueAtTime(560, t + durationS)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.035, t + 0.08)
  osc.connect(gain)
  gain.connect(a.destination)
  osc.start(t)
  return {
    stop() {
      const now = a.currentTime
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value || 0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
        osc.stop(now + 0.1)
      } catch {}
    },
  }
}

/** From onChange: a key when the text grew, a delete when it shrank. */
function typedSound(sfx: Sfx, prev: string, next: string) {
  if (next.length > prev.length) sfx.key()
  else if (next.length < prev.length) sfx.del()
}

/** The sound switch a SoundProvider shares with every component inside it. */
type SoundSwitch = { enabled: boolean; setEnabled: (on: boolean) => void }
const SoundContext = React.createContext<SoundSwitch | null>(null)

/** The provider's switch (null outside one), for a mute control. */
function useSoundSwitch() {
  return React.useContext(SoundContext)
}

/**
 * The sounds for one component: live inside a switched-on SoundProvider, silent otherwise.
 * `sound={false}` on a component silences it alone.
 */
function useSound(sound = true) {
  const enabled = Boolean(React.useContext(SoundContext)?.enabled) && sound
  return React.useMemo(() => ({ sfx: enabled ? SFX : SILENT, holdTone: enabled ? startHoldTone : () => ({ stop() {} }) }), [enabled])
}

export { SoundContext, typedSound, useSound, useSoundSwitch, type Sfx, type SoundSwitch }
