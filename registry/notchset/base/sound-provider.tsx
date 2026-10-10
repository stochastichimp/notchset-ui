"use client"

/**
 * Sound Provider (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/sound-provider
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { SoundContext, useSoundSwitch } from "@/lib/notchset/sound"

/*
 * Sound: wrap the app once and the components with sound play it inside. The choice
 * is saved in this browser ("notchset-sound"); `defaultEnabled` applies until the visitor picks. Nothing
 * plays before the visitor's first press, and nothing at all without this provider.
 */

const KEY = "notchset-sound"
const listeners = new Set<() => void>()

function readSaved(): boolean | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === "on" ? true : v === "off" ? false : null
  } catch {
    return null
  }
}

interface SoundProviderProps {
  children?: React.ReactNode | undefined
  /** On until the visitor turns it off. Default true. */
  defaultEnabled?: boolean | undefined
}

function SoundProvider({ children, defaultEnabled = true }: SoundProviderProps) {
  const saved = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    readSaved,
    () => null
  )
  const enabled = saved ?? defaultEnabled
  const value = React.useMemo(
    () => ({
      enabled,
      setEnabled(on: boolean) {
        try {
          localStorage.setItem(KEY, on ? "on" : "off")
        } catch {}
        listeners.forEach((l) => l())
      },
    }),
    [enabled]
  )
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

/** The provider's switch, for your own mute control: `const { enabled, setEnabled } = useSoundSwitch()!`. */
export { SoundProvider, useSoundSwitch, type SoundProviderProps }
