import * as React from "react"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@ui-sdk/react/popover"
import { CheckIcon, ChevronDownIcon, CompassIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { Button, buttonClass, Modal } from "@/components/ui"
import { PlumbTile } from "@/components/brand"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

export function useGuideSteps() {
  const { state } = useStore()
  const st = (id: string) => state.issues.find((i) => i.id === id)?.status
  const resolvedOne = state.issues.some((i) => i.id !== "pill" && i.id !== "heading" && (i.status === "fixed" || i.status === "allowed"))
  const steps = [
    { done: state.view === "review" || state.issues.some((i) => i.status !== "open"), title: "Open the Checkout review", hint: "In the inbox, choose Review next to Checkout." },
    { done: resolvedOne, title: "Fix or allow a flag", hint: "Select flag 2 or 3, then choose Fix to match or Allow here." },
    { done: st("pill") === "promoted", title: "Make the pill button a rule", hint: "Select flag 1, choose Make it a rule, give a reason, and publish." },
    { done: st("heading") === "wrong", title: "Tell Plumb when it's wrong", hint: "Select flag 4 and choose Report a wrong flag." },
    { done: state.guide.sawHistory, title: "Find your rule in History", hint: "Open History in the sidebar. You can revert from there." },
    { done: state.guide.usedPalette, title: "Try the command palette", hint: "Press Ctrl+K, or ⌘K on a Mac, to search and run commands." },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const nextIdx = steps.findIndex((s) => !s.done)
  return { steps, doneCount, nextIdx }
}

function Progress({ steps, current }: { steps: { done: boolean }[]; current: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {steps.map((s, i) => (
        <span key={i} className={cn("h-1.5 w-3.5 rounded-full", s.done ? "bg-ok" : i === current ? "bg-ink" : "bg-line-strong")} />
      ))}
    </span>
  )
}

function StepList() {
  const { steps, nextIdx } = useGuideSteps()
  return (
    <ol className="flex flex-col gap-0.5">
      {steps.map((s, i) => (
        <li key={s.title} className={cn("flex gap-2.5 rounded-md px-2 py-1.5", i === nextIdx && "bg-paper")}>
          <span
            aria-hidden="true"
            className={cn(
              "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border text-micro font-semibold tabular-nums",
              s.done ? "border-ok bg-ok text-white" : i === nextIdx ? "border-ink text-ink" : "border-edge text-muted"
            )}
          >
            {s.done ? <CheckIcon className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className="min-w-0">
            <span className={cn("block leading-snug", s.done ? "text-muted" : "font-medium text-ink")}>
              {s.title}
              {s.done && <span className="sr-only"> (done)</span>}
            </span>
            {i === nextIdx && <span className="mt-0.5 block text-small leading-snug text-muted">{s.hint}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** The walkthrough, drawn as a capsule in the prototype strip above the app window, outside the app itself. */
export function GuideBar() {
  const { dispatch } = useStore()
  const { steps, doneCount, nextIdx } = useGuideSteps()
  const finished = nextIdx === -1
  const current = steps[nextIdx]

  return (
    <section aria-label="Walkthrough" className="flex h-8 min-w-0 items-center gap-3 rounded-full bg-surface pr-1 pl-3.5 shadow-panel">
      <CompassIcon className="size-4 shrink-0 text-ink" aria-hidden="true" />
      <Progress steps={steps} current={nextIdx} />
      <p className="min-w-0 flex-1 truncate">
        {finished ? (
          <span className="font-medium text-ok">You finished the walkthrough. Thanks for trying Plumb.</span>
        ) : (
          <>
            <span className="font-medium">Step {nextIdx + 1} of {steps.length}: {current.title}.</span>{" "}
            <span className="text-muted">{current.hint}</span>
          </>
        )}
      </p>
      <Popover>
        <PopoverTrigger className={buttonClass("ghost", "sm", "shrink-0 rounded-full text-muted data-open:bg-paper-2 data-open:text-ink")}>
          All steps <span className="font-mono text-micro tabular-nums">{doneCount}/{steps.length}</span>
          <ChevronDownIcon />
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 w-[320px] rounded-xl border border-line bg-surface p-2 shadow-pop transition-[opacity,scale] duration-100 origin-(--transform-origin) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
        >
          <PopoverTitle className="section-label px-2 pt-1 pb-2">Walkthrough</PopoverTitle>
          <StepList />
          <div className="mt-2 border-t border-line px-1 pt-2">
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "reset" })}>
              <RotateCcwIcon /> Start over
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" aria-label="Hide walkthrough" className="size-6 shrink-0 rounded-full" onClick={() => dispatch({ type: "guide", patch: { visible: false } })}>
        <XIcon />
      </Button>
    </section>
  )
}

export function GuideButton() {
  const { dispatch } = useStore()
  const { steps, doneCount } = useGuideSteps()
  return (
    <Button variant="ghost" size="sm" className="text-ink-2 hover:bg-surface/60" onClick={() => dispatch({ type: "guide", patch: { visible: true } })}>
      <CompassIcon /> Walkthrough <span className="font-mono text-micro text-muted tabular-nums">{doneCount}/{steps.length}</span>
    </Button>
  )
}

export function GuideIntro() {
  const { state, dispatch } = useStore()
  return (
    <Modal
      open={state.guide.intro}
      onOpenChange={(o) => !o && dispatch({ type: "guide", patch: { intro: false } })}
      title="Welcome to the Plumb prototype"
      description="Built for IDSN 523. Everything here is sample data, so try anything."
      className="max-w-[500px]"
    >
      <div className="mb-5 flex gap-3.5 rounded-lg bg-paper p-4 shadow-hairline">
        <PlumbTile size={52} />
        <p className="leading-relaxed text-ink-2">
          You're <span className="font-semibold text-ink">Amber</span>, the only designer on a team of six. Your teammates build screens with Claude, Lovable and Replit. Jordan just shipped a checkout screen from Lovable, and Plumb found four places where it drifts from your design system.
        </p>
      </div>
      <p className="mb-6 leading-relaxed text-muted">Review the screen and decide what happens to each flag. A short walkthrough above the app shows the next step, and you can hide it at any time.</p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => dispatch({ type: "guide", patch: { intro: false, visible: false } })}>
          Explore on my own
        </Button>
        <Button variant="primary" onClick={() => dispatch({ type: "guide", patch: { intro: false, visible: true } })}>
          Start the walkthrough
        </Button>
      </div>
    </Modal>
  )
}

export function useIsSmallScreen() {
  const query = "(max-width: 1023px)"
  const [small, setSmall] = React.useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setSmall(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return small
}

export function SmallScreenNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-paper p-6">
      <div className="max-w-sm text-center">
        <PlumbTile size={64} className="mx-auto mb-5" />
        <h1 className="font-display text-title font-bold tracking-[-0.01em]">Plumb is a desktop app</h1>
        <p className="mt-2 leading-relaxed text-muted">Designers review drift at their desk, next to the tools that make it. Open this link on a laptop for the full walkthrough.</p>
        <Button variant="secondary" className="mt-6" onClick={onContinue}>
          Continue anyway
        </Button>
      </div>
    </div>
  )
}
