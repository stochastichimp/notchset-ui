"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { PaneStack } from "@/components/ui/notchset/blocks/auth/pane-stack"
import { PillField } from "@/components/ui/notchset/blocks/auth/pill-field"
import { SegmentSwitch } from "@/components/ui/notchset/blocks/auth/segment-switch"
import { ArrowCta, isArrowCtaFailure } from "@/lib/notchset/arrow-cta"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel, inertRef } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Setup Form: three short steps (name, owner, review) with a progress bar you can click back through and
 * a review where every row jumps back to its step, then a done screen. Moving forward sweeps up and
 * moving back sweeps down; an empty name shakes and buzzes. Create calls onCreate with the values.
 */

interface SetupMember {
  id: string
  name: string
  role?: string | undefined
  avatar?: string | undefined
  color?: string | undefined
}

interface SetupValues {
  name: string
  description: string
  ownerId: string
  visibility: "private" | "team" | "link"
}

interface SetupFormBlockProps extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  members: SetupMember[]
  defaultOwnerId?: string | undefined
  /** Shown under the name, e.g. (slug) => `acme.app/projects/${slug}`. */
  urlFor?: ((slug: string) => string) | undefined
  onCreate: (values: SetupValues) => unknown
  /** The team's name, in the visibility text. */
  team?: string | undefined
  tag?: string | undefined
  sound?: boolean | undefined
}

const STEPS = ["Name", "Owner", "Review"]
const TITLES = ["Name your project", "Pick an owner", "Check and create", "All set"]
const SUBS = ["A short name works best. You can change it later.", "They get updates and make the final call.", "One last look before it goes live.", "Your team can see it now."]
const VIS = [
  { value: "private", label: "Only me" },
  { value: "team", label: "My team" },
  { value: "link", label: "Link" },
] as const

function Avatar({ m, className }: { m: SetupMember; className?: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-cover bg-center font-semibold", className)}
      style={{
        backgroundImage: m.avatar ? `url(${m.avatar})` : undefined,
        backgroundColor: m.avatar ? "var(--muted)" : `color-mix(in oklab, ${m.color ?? "var(--chart-1)"} 24%, var(--background))`,
        color: `color-mix(in oklab, ${m.color ?? "var(--chart-1)"} 60%, var(--foreground))`,
      }}
    >
      {m.avatar ? null : m.name.slice(0, 1)}
    </span>
  )
}

const SetupFormBlock = React.forwardRef<HTMLElement, SetupFormBlockProps>(function SetupFormBlock(
  { members, defaultOwnerId, urlFor, onCreate, team = "your team", tag = "New project", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [owner, setOwner] = React.useState(defaultOwnerId ?? members[0]?.id ?? "")
  const [vis, setVis] = React.useState<SetupValues["visibility"]>("team")
  const [shakes, setShakes] = React.useState(0)
  const cta = React.useRef<HTMLButtonElement>(null)
  const ids = React.useId()
  const nameOk = name.trim().length > 1
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const ownerM = members.find((m) => m.id === owner) ?? members[0]
  const visText = { private: "Only you can see it", team: `Everyone in ${team} can see it`, link: "Anyone with the link can view it" }[vis]

  const go = (n: number) => {
    if (n === step) return
    if (n > step && step === 0 && !nameOk) {
      setShakes((k) => k + 1)
      sfx.buzz()
      return
    }
    if (n > step) {
      sfx.noise(0.2, 0.025, 800, 2400)
      sfx.tone(600 + n * 120, 0.06, "triangle", 0.045)
    } else {
      sfx.noise(0.2, 0.025, 2400, 800)
      sfx.tone(700 + n * 60, 0.06, "triangle", 0.04, 0, 450)
    }
    setStep(n)
  }
  const reset = () => {
    setStep(0)
    setName("")
    setDesc("")
    setOwner(defaultOwnerId ?? members[0]?.id ?? "")
    setVis("team")
    sfx.pop()
  }

  return (
    <section ref={ref} aria-label="Create a project" data-slot="setup-form-block" data-notchset="" className={cn("mx-auto w-full max-w-[580px]", className)} {...props}>
      <div className="rounded-[var(--ns-corner-frame,min(34px,calc(var(--radius,999px)*3.4)))] bg-[var(--muted)] p-2.5">
        <div className="flex flex-col gap-5 rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))] bg-[var(--background)] px-2 pt-2 pb-[22px]">
          <div className="flex flex-col gap-5 rounded-[19px] bg-[color-mix(in_oklab,var(--chart-2)_var(--ns-tint-panel),var(--background))] px-5 pt-[18px] pb-5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex h-7 items-center rounded-full bg-[var(--background)] px-3 text-[length:var(--ns-type-label)] font-semibold shadow-[0_1px_2px_rgba(0,0,0,.06)]">{tag}</span>
              <span className="flex items-baseline text-[length:var(--ns-type-label)] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
                Step
                <span className="ms-1 flex font-semibold text-[var(--foreground)]">
                  <NumberFlow tight value={Math.min(3, step + 1)} />
                </span>
                <span className="ms-1">of 3</span>
              </span>
            </div>
            <div aria-live="polite" className="flex flex-col gap-1">
              <h2 className="m-0 text-[24px] font-semibold tracking-[-0.03em]">
                <RollingLabel align="start" index={step} rowHeight={30} rows={TITLES} />
              </h2>
              {/* A sentence may wrap on a phone, so it swaps in (a fade and rise) rather than rolling. */}
              <span key={step} className="animate-[ns-row-in_.4s_var(--ns-ease-settle)] text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty] motion-reduce:animate-none">
                {SUBS[step]}
              </span>
            </div>
            <nav aria-label="Steps" className="grid grid-cols-3 gap-1.5">
              {STEPS.map((t, i) => {
                const doneStep = step > i
                const canGo = i < step && step < 3
                return (
                  <button
                    key={t}
                    type="button"
                    aria-current={step === i ? "step" : undefined}
                    aria-disabled={!canGo || undefined}
                    onClick={() => canGo && go(i)}
                    className={cn(
                      "flex flex-col gap-2 rounded-[4px] text-start outline-none [transition:color_.3s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-4",
                      canGo ? "cursor-pointer" : "cursor-default",
                      step >= i ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
                    )}
                  >
                    <span aria-hidden="true" className="block h-1 overflow-hidden rounded-[2px] bg-[var(--background)]">
                      <span
                        className="block h-full rounded-[2px] bg-[var(--foreground)] [transition:width_.55s_var(--ns-ease-settle)] motion-reduce:transition-none"
                        style={{ width: doneStep ? "100%" : step === i ? "34%" : "0%", transitionDelay: step === i ? ".12s" : "0s" }}
                      />
                    </span>
                    <span className={cn("flex items-center gap-1.5 text-[length:var(--ns-type-label)] whitespace-nowrap", step === i ? "font-semibold" : "font-medium")}>
                      <span aria-hidden="true" className="flex overflow-hidden text-[var(--success,var(--foreground))] [transition:max-width_.35s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ maxWidth: doneStep ? 16 : 0 }}>
                        <svg viewBox="0 0 24 24" className="block size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      {t}
                      {doneStep && <span className="sr-only">, done</span>}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
          <PaneStack
            index={step}
            className={cn("px-3.5", shakes > 0 && (shakes % 2 ? "animate-[ns-shake-sm_.42s]" : "animate-[ns-shake-sm-b_.42s]"))}
            panes={[
              <div key="name" className="flex flex-col gap-[18px]">
                <PillField
                  label="Project name"
                  placeholder="Spring launch"
                  value={name}
                  onValueChange={setName}
                  valid={nameOk}
                  invalid={shakes > 0 && !nameOk}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      cta.current?.click()
                    }
                  }}
                  sound={sound}
                />
                <span aria-live="polite" className={cn("-mt-2 truncate ps-[18px] text-[length:var(--ns-type-label)]", !nameOk && shakes > 0 ? "text-[var(--destructive)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
                  {nameOk ? (urlFor ? urlFor(slug) : slug) : "Give it at least two letters"}
                </span>
                <div className="flex flex-col gap-2">
                  <label htmlFor={`${ids}-desc`} className="flex justify-between text-[length:var(--ns-type-copy)] font-medium">
                    What is it for?
                    <span className="font-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">Optional</span>
                  </label>
                  <textarea
                    id={`${ids}-desc`}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    placeholder="One or two lines so the team knows the goal"
                    className="box-border resize-none rounded-[20px] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] py-3.5 text-[15px] leading-[var(--ns-leading-prose)] text-[var(--foreground)] outline-none [transition:border-color_.2s,box-shadow_var(--ns-time-state)] placeholder:text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] focus:border-[color-mix(in_oklab,var(--foreground)_55%,var(--border))] focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]"
                  />
                </div>
              </div>,
              <div key="owner" className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-2">
                  <span id={`${ids}-owner`} className="text-[length:var(--ns-type-copy)] font-medium">
                    Who owns it
                  </span>
                  <div role="radiogroup" aria-labelledby={`${ids}-owner`} className="flex flex-col gap-1.5">
                    {members.map((m, i) => {
                      const on = m.id === owner
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            if (on) return
                            setOwner(m.id)
                            sfx.tone(620 + i * 140, 0.05, "triangle", 0.035)
                          }}
                          className={cn(
                            "flex h-[54px] cursor-pointer items-center gap-3 rounded-2xl border ps-2 pe-3.5 text-start text-[var(--foreground)] outline-none [transition:border-color_var(--ns-time-color),background-color_var(--ns-time-color),box-shadow_var(--ns-time-state)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
                            on ? "border-[var(--foreground)] bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))] shadow-[0_0_0_3px_color-mix(in_oklab,var(--foreground)_7%,transparent)]" : "border-[var(--border)] bg-[var(--background)]"
                          )}
                        >
                          <Avatar m={m} className="size-9 text-[length:var(--ns-type-label)]" />
                          <span className="flex min-w-0 flex-1 flex-col gap-px">
                            <span className="truncate text-[length:var(--ns-type-copy)] font-semibold">{m.name}</span>
                            {m.role && <span className="truncate text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{m.role}</span>}
                          </span>
                          <span aria-hidden="true" className={cn("box-border size-[18px] shrink-0 rounded-full [transition:border-width_.3s_var(--ns-ease-pop),border-color_.2s]", on ? "border-[5.5px] border-[var(--foreground)]" : "border-[1.5px] border-[var(--border)]")} />
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[length:var(--ns-type-copy)] font-medium">Who can see it</span>
                  <SegmentSwitch
                    label="Who can see it"
                    variant="soft"
                    options={VIS}
                    value={vis}
                    onValueChange={(v) => {
                      setVis(v)
                      sfx.tone(760 + VIS.findIndex((o) => o.value === v) * 120, 0.04, "triangle", 0.035)
                    }}
                  />
                </div>
              </div>,
              <div key="review" className="flex flex-col gap-[18px]">
                <dl className="m-0 flex flex-col overflow-hidden rounded-[20px] border border-[var(--border)]">
                  {[
                    { l: "Name", v: name.trim() || "Untitled", to: 0 },
                    { l: "Purpose", v: desc.trim() || "No description yet", to: 0, muted: !desc.trim() },
                    { l: "Owner", v: ownerM?.name ?? "", to: 1, who: ownerM },
                    { l: "Visibility", v: VIS.find((o) => o.value === vis)!.label, to: 1 },
                  ].map((r, j) => (
                    <div key={r.l} className={cn("flex min-h-[54px] items-center gap-3 py-2 ps-[18px] pe-2", j > 0 && "border-t border-[var(--border)]")}>
                      <dt className="w-24 shrink-0 text-[13.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{r.l}</dt>
                      <dd className="m-0 flex min-w-0 flex-1 items-center gap-2 text-[length:var(--ns-type-copy)] font-medium">
                        {r.who && <Avatar m={r.who} className="size-6 text-[10px]" />}
                        <span className={cn("truncate", r.muted && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{r.v}</span>
                      </dd>
                      <button
                        type="button"
                        aria-label={`Edit ${r.l.toLowerCase()}`}
                        onClick={() => go(r.to)}
                        className="h-[var(--ns-control-compact)] shrink-0 cursor-pointer rounded-full bg-[var(--muted)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap text-[var(--foreground)] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </dl>
              </div>,
              <div key="done" className="flex flex-col items-center gap-3 pt-[26px] pb-2.5 text-center">
                <span aria-hidden="true" className={cn("grid size-14 place-items-center rounded-full bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))]", step === 3 && "animate-[ns-chip_.5s_var(--ns-ease-rebound)] motion-reduce:animate-none")}>
                  <svg viewBox="0 0 24 24" className="block size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-[20px] font-semibold tracking-[-0.02em]">{name.trim() || "Your project"} is ready</span>
                <span className="max-w-[300px] text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty]">
                  {visText}. {ownerM?.name.split(" ")[0]} is the owner.
                </span>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-1.5 h-[var(--ns-control-regular)] cursor-pointer rounded-full border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  Start another
                </button>
              </div>,
            ]}
          />
          <div ref={inertRef(step === 3)} className={cn("flex flex-wrap items-center gap-2.5 px-3.5", step === 3 && "hidden")}>
            <button
              type="button"
              onClick={() => go(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex h-[var(--ns-control-roomy)] cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] ps-3.5 pe-[18px] text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)] outline-none [transition:opacity_.25s,background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="m11 18-6-6 6-6" />
              </svg>
              Back
            </button>
            <span className="flex-1 pe-1 text-end text-[12.5px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] max-sm:hidden">Enter to continue</span>
            <div className="ms-auto w-[210px] shrink-0">
              <ArrowCta
                ref={cta}
                size="lg"
                variant="primary"
                labels={[step === 2 ? "Create project" : "Continue", "Creating", "Created"]}
                instant={step < 2}
                resetAfter={800}
                onAction={async () => {
                  if (step < 2) return go(step + 1)
                  // A failed create stays here with its message; only a real success moves on.
                  const result = await onCreate({ name: name.trim(), description: desc.trim(), ownerId: owner, visibility: vis })
                  if (isArrowCtaFailure(result)) return result
                  window.setTimeout(() => setStep(3), 750)
                }}
                sound={sound}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export { SetupFormBlock, type SetupFormBlockProps, type SetupValues, type SetupMember }
