import * as React from "react"
import { flushSync } from "react-dom"
import { Resizable, ResizableHandle, ResizablePanel } from "@ui-sdk/react/resizable"
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { Listbox, ListboxItem } from "@ui-sdk/react/listbox"
import { ArrowRightIcon, CheckIcon, CircleAlertIcon, FileCodeIcon, FlagIcon, LayersIcon, MinusIcon, RotateCcwIcon, ScanSearchIcon, WandSparklesIcon, WrenchIcon } from "lucide-react"
import { Badge, Button, Hint } from "@/components/ui"
import { CheckoutMock } from "@/components/checkout-mock"
import { SYSTEM_NAME, getRuleProposal, impactComponents, screens, toolName, type Confidence as ConfidenceLevel, type Issue, type Screen } from "@/data"
import { useIssueActions } from "@/actions"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"
import { AllowModal, WrongModal } from "@/screens/review-modals"

export const STATUS: Record<Issue["status"], { label: string; tone: "neutral" | "ok" }> = {
  open: { label: "Open", tone: "neutral" },
  fixed: { label: "Fix sent", tone: "ok" },
  allowed: { label: "Allowed here", tone: "ok" },
  promoted: { label: "Now a rule", tone: "ok" },
  wrong: { label: "Dismissed", tone: "neutral" },
}

const LEVEL = { high: "High", medium: "Medium", low: "Low" } as const

export function ConfidenceMeter({ level, suffix }: { level: ConfidenceLevel; suffix?: string }) {
  const bars = { high: 3, medium: 2, low: 1 }[level]
  return (
    <span className="inline-flex items-center gap-1.5 text-small text-muted">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px]", i < bars ? "bg-ink-2" : "bg-line-strong")} style={{ height: 5 + i * 3 }} />
        ))}
      </span>
      {LEVEL[level]}
      {suffix}
    </span>
  )
}

/** Counts up every time a flag on this screen changes state, so the canvas can show Plumb re-checking it. */
function useCheckRun(issues: Issue[]) {
  const signature = issues.map((i) => i.status).join(",")
  const [run, setRun] = React.useState(1)
  // Compared with the last signature, not a "first run" flag, so React's double-run of effects in development doesn't count as a change.
  const last = React.useRef(signature)
  React.useEffect(() => {
    if (last.current === signature) return
    last.current = signature
    setRun((r) => r + 1)
  }, [signature])
  return run
}

export function Review() {
  const { state, dispatch } = useStore()
  const screen = screens.find((s) => s.id === state.screenId) ?? screens[0]
  const issues = state.issues.filter((i) => i.screenId === screen.id)
  const selected = issues.find((i) => i.id === state.selectedIssueId) ?? null
  const openCount = issues.filter((i) => i.status === "open").length
  const run = useCheckRun(issues)

  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">Review {screen.name}</h1>
      <Resizable className="min-h-0 flex-1">
        <ResizablePanel minSize={40} className="relative flex flex-col canvas-grid">
          <FitToCanvas>
            <CheckoutMock issues={state.issues} selectedId={state.selectedIssueId} onPin={(id) => dispatch({ type: "select", issueId: id })} />
            <Sweep key={run} />
          </FitToCanvas>
          <CheckChip key={run} label={run === 1 ? `Checking ${screen.elementsChecked} elements` : `Re-checking against v${state.systemVersion}`} />
        </ResizablePanel>

        <ResizableHandle
          aria-label="Resize inspector"
          className="relative w-px bg-line outline-none after:absolute after:inset-y-0 after:-left-1 after:w-2 after:content-[''] data-dragging:bg-ink data-hovering:bg-edge"
        />

        <ResizablePanel defaultSize={38} minSize={32} maxSize={50} className="flex flex-col bg-surface">
          <Tabs defaultValue="flags" className="flex min-h-0 flex-1 flex-col">
            <TabsList aria-label="Inspector" className="relative flex h-10 shrink-0 items-stretch gap-6 border-b border-line px-5">
              <TabsTab value="flags" className="flex cursor-pointer items-center gap-1.5 text-ui font-medium text-muted outline-none hover:text-ink data-selected:text-ink">
                Flags
                <span className={cn("rounded-full px-1.5 font-mono text-micro tabular-nums", openCount ? "bg-ink text-paper" : "bg-paper-2 text-muted")}>{openCount}</span>
              </TabsTab>
              <TabsTab value="context" className="flex cursor-pointer items-center text-ui font-medium text-muted outline-none hover:text-ink data-selected:text-ink">
                What Plumb compared
              </TabsTab>
              <TabsIndicator className="absolute bottom-[-1px] left-(--active-tab-left) h-0.5 w-(--active-tab-width) rounded-full bg-ink transition-[left,width] duration-200" />
            </TabsList>

            <TabsPanel value="flags" className="min-h-0 flex-1 overflow-y-auto outline-none">
              {openCount === 0 && (
                <div className="mx-3 mt-3 flex items-start gap-3 rounded-lg bg-ok-soft px-4 py-3 text-ok">
                  <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-medium">{screen.name} matches your system</div>
                    <div className="text-caption">
                      Every flag is resolved against {SYSTEM_NAME} v{state.systemVersion}.
                    </div>
                  </div>
                </div>
              )}
              <Listbox
                aria-label="Flags on this screen"
                value={state.selectedIssueId}
                onValueChange={(v) => v && flushSync(() => dispatch({ type: "select", issueId: v as string }))}
                className="flex flex-col gap-px p-1.5 outline-none"
              >
                {issues.map((issue, idx) => (
                  <ListboxItem
                    key={issue.id}
                    value={issue.id}
                    className="flex h-8 cursor-pointer items-center gap-3 rounded-lg px-2.5 outline-none data-highlighted:bg-paper/70 data-selected:bg-paper data-selected:shadow-[inset_0_0_0_1px_var(--line-strong)]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-micro font-medium tabular-nums",
                        issue.status === "open" ? "bg-ink text-paper" : "bg-paper-2 text-muted"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate", issue.status !== "open" && "text-muted")}>{issue.title}</span>
                    {issue.status === "open" ? (
                      <span aria-hidden="true">
                        <ConfidenceMeter level={issue.confidence} />
                      </span>
                    ) : (
                      <>
                        <span className="sr-only">, </span>
                        <Badge tone={STATUS[issue.status].tone}>{STATUS[issue.status].label}</Badge>
                      </>
                    )}
                  </ListboxItem>
                ))}
              </Listbox>
              {selected && <Detail issue={selected} screen={screen} />}
            </TabsPanel>

            <TabsPanel value="context" className="min-h-0 flex-1 overflow-y-auto px-5 py-5 outline-none">
              <h2 className="section-label">Inputs to this check</h2>
              <p className="mt-1.5 mb-4 text-muted">Plumb compares the screen against your rules, element by element.</p>
              <dl className="divide-y divide-line rounded-lg bg-surface shadow-panel">
                <Ctx icon={LayersIcon} label="Your rules" value={`${SYSTEM_NAME} v${state.systemVersion}, ${state.rules.length} rules`} />
                <Ctx icon={FileCodeIcon} label="This screen" value={screen.file} mono />
                <Ctx icon={ScanSearchIcon} label="Checked" value={`${screen.elementsChecked} elements for color, shape, type and components`} />
              </dl>
              <p className="mt-3 text-caption text-muted">Copy and images on this screen aren't checked yet.</p>
            </TabsPanel>
          </Tabs>
        </ResizablePanel>
      </Resizable>

      <DecisionBar issue={selected} index={selected ? issues.indexOf(selected) : -1} screen={screen} />
      <StatusBar screen={screen} openCount={openCount} />

      <AllowModal />
      <WrongModal />
    </div>
  )
}

/**
 * Shows the screen at its real width (420px) and scales it down, never up, so the whole screen
 * fits the canvas at any window size. The zoom level sits in the corner, the way a design tool shows it.
 */
function FitToCanvas({ children }: { children: React.ReactNode }) {
  const outer = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  const [fit, setFit] = React.useState({ scale: 1, w: 0, h: 0 })

  React.useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const measure = () => {
      const pad = 44
      const w = i.offsetWidth
      const h = i.offsetHeight
      const scale = Math.min(1, (o.clientWidth - pad * 2) / w, (o.clientHeight - pad * 2) / h)
      setFit({ scale: Math.max(0.4, scale), w, h })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(o)
    ro.observe(i)
    measure()
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div className="relative shrink-0" style={fit.w ? { width: fit.w * fit.scale, height: fit.h * fit.scale } : undefined}>
        <div ref={inner} className="absolute top-0 left-0 w-[420px] origin-top-left" style={{ transform: `scale(${fit.scale})` }}>
          {children}
        </div>
      </div>
      <span className="absolute right-3 bottom-3 flex h-6 items-center rounded-md bg-surface/90 px-2 font-mono text-micro text-muted shadow-panel tabular-nums">
        {fit.scale < 1 ? `Fit, ${Math.round(fit.scale * 100)}%` : "100%"}
      </span>
    </div>
  )
}

/**
 * Plumb's signature: a level line with the plumb bob sweeps down the screen whenever Plumb checks it,
 * on arrival and again after every decision. Hidden for people who prefer reduced motion.
 */
function Sweep() {
  const [on, setOn] = React.useState(true)
  if (!on) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl" aria-hidden="true">
      <div className="plumb-sweep absolute inset-x-0 h-20 -translate-y-full" onAnimationEnd={() => setOn(false)}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink/[0.06]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-ink/70" />
        <span className="absolute right-2 bottom-0 size-2.5 translate-y-1/2 rounded-full bg-drift" />
      </div>
    </div>
  )
}

function CheckChip({ label }: { label: string }) {
  const [on, setOn] = React.useState(true)
  if (!on) return null
  return (
    <div
      role="status"
      onAnimationEnd={() => setOn(false)}
      className="plumb-chip pointer-events-none absolute top-4 left-1/2 flex h-7 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-3 font-mono text-micro tracking-[0.06em] text-paper uppercase shadow-pop"
    >
      <span className="size-1.5 rounded-full bg-drift" aria-hidden="true" />
      {label}
    </div>
  )
}

function Ctx({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 px-3.5 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className={cn("min-w-0 break-words", mono && "font-mono text-small leading-5")}>{value}</dd>
    </div>
  )
}

function Comparison({ issue }: { issue: Issue }) {
  const pay = (radius: number, color: string, label = "Pay $48.00") => (
    <div className="flex h-8 items-center justify-center text-micro font-semibold text-white" style={{ background: color, borderRadius: radius }}>
      {label}
    </div>
  )
  const brand = "var(--brand)"
  const off = "var(--off-brand)"
  // Each side is a subgrid, so the labels, samples and notes line up across the two columns.
  const cell = (rule: boolean, body: React.ReactNode, note: string) => (
    <div className="row-span-3 grid grid-rows-subgrid">
      <div className={rule ? "section-label" : "kicker"}>{rule ? "Design system" : "This screen"}</div>
      <div className="self-center">{body}</div>
      <div className={cn("font-mono text-micro leading-snug", rule ? "text-muted" : "text-drift-ink")}>{note}</div>
    </div>
  )
  const pair = (a: React.ReactNode, an: string, b: React.ReactNode, bn: string) => (
    <div className="grid grid-cols-2 grid-rows-[auto_auto_auto] gap-x-5 gap-y-2.5">
      {cell(true, a, an)}
      {cell(false, b, bn)}
    </div>
  )
  switch (issue.expected) {
    case "radius":
      return pair(pay(8, brand), "8px corners", pay(999, off), "Full pill, 999px")
    case "color":
      return pair(
        <div className="h-8 rounded-md" style={{ background: brand }} />,
        "Brand 600, #404DD1",
        <div className="h-8 rounded-md" style={{ background: off }} />,
        "#1A6FE3, not in your palette"
      )
    case "primary":
      return pair(
        <div className="space-y-1">
          <div className="flex h-6 items-center justify-center rounded-md border border-line-strong bg-white text-[10.5px] font-semibold">Apply coupon</div>
          {pay(8, brand)}
        </div>,
        "One primary button",
        <div className="space-y-1">
          {pay(999, off, "Apply coupon")}
          {pay(999, off)}
        </div>,
        "Two primary buttons"
      )
    case "heading":
      return pair(<div className="text-[28px] leading-none font-semibold">Aa</div>, "40px, a step on your scale", <div className="text-[32px] leading-none font-semibold">Aa</div>, "Set at 44px")
  }
}

function Detail({ issue, screen }: { issue: Issue; screen: Screen }) {
  const { state, dispatch } = useStore()
  const rule = state.rules.find((r) => r.id === issue.ruleId)
  const proposal = getRuleProposal(issue, state.rules)
  const aiTools = state.tools.filter((t) => t.id !== "figma").length
  const open = issue.status === "open"
  return (
    <section aria-label={`${issue.title}, details`} className="border-t border-line px-5 pt-4 pb-8">
      {open ? (
        <p className="kicker">
          Drift detected <span aria-hidden="true">·</span> {screen.name} <span aria-hidden="true">·</span> {toolName(screen.tool)}
        </p>
      ) : (
        <p className={cn("section-label", STATUS[issue.status].tone === "ok" && "text-ok")}>
          Resolved <span aria-hidden="true">·</span> {STATUS[issue.status].label}
        </p>
      )}
      <h2 className="mt-1.5 font-display text-title leading-snug font-bold tracking-[-0.015em]">{issue.title}</h2>
      <p className="mt-0.5 text-muted">{issue.found}</p>

      <div className="mt-5">
        <Comparison issue={issue} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="section-label">Why it was flagged</h3>
        <p className="mt-1.5 leading-relaxed text-ink-2">{issue.why}</p>
        {rule && (
          <p className="mt-2 text-caption text-muted">
            From the{" "}
            <button className="cursor-pointer text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink" onClick={() => dispatch({ type: "go", view: "rules" })}>
              {rule.name}
            </button>{" "}
            rule, v{rule.version}, added by {rule.author}.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <h3 className="section-label">Confidence</h3>
        <ConfidenceMeter level={issue.confidence} />
      </div>

      {open && proposal && (
        <div className="mt-4">
          <h3 className="section-label">If it became a rule</h3>
          <p className="mt-1.5 leading-relaxed text-ink-2">
            {issue.id === "pill" ? `Could reach up to ${impactComponents.length} components in 3 projects and ${aiTools} AI tools.` : proposal.value + "."}{" "}
            You'll choose where it applies before you publish.
          </p>
        </div>
      )}
    </section>
  )
}

/**
 * The bar along the bottom of the review that names the decision and holds the choices, the way
 * an approval gate does. It spans the canvas and the inspector so the explanation above keeps its room.
 */
function DecisionBar({ issue, index, screen }: { issue: Issue | null; index: number; screen: Screen }) {
  const { state, dispatch } = useStore()
  const actions = useIssueActions()
  const tool = toolName(screen.tool)

  if (!issue) {
    return (
      <div className="flex h-[60px] shrink-0 items-center border-t border-line bg-surface px-5 text-muted">Select a flag to decide what happens to it.</div>
    )
  }

  if (issue.status !== "open") {
    const nextOpen = state.issues.find((i) => i.screenId === screen.id && i.status === "open")
    const after: Record<Exclude<Issue["status"], "open">, string> = {
      fixed: `${tool} has the fix. ${screen.author} sees it on their next run.`,
      allowed: `Allowed on ${screen.name} only. Plumb still flags it everywhere else.`,
      promoted: `Part of ${SYSTEM_NAME} v${state.systemVersion}. Claude and ${tool} now treat it as correct.`,
      wrong: "Dismissed. Plumb won't raise this flag again.",
    }
    return (
      <div className="flex min-h-[60px] shrink-0 items-center gap-4 border-t border-line bg-surface px-5 py-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
            STATUS[issue.status].tone === "ok" ? "bg-ok-soft text-ok" : "bg-paper-2 text-muted"
          )}
        >
          {STATUS[issue.status].tone === "ok" ? <CheckIcon className="size-4" strokeWidth={2.5} /> : <MinusIcon className="size-4" strokeWidth={2.5} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {issue.title}: {STATUS[issue.status].label.toLowerCase()}
          </div>
          <div className="mt-0.5 truncate text-caption text-muted">{after[issue.status as Exclude<Issue["status"], "open">]}</div>
        </div>
        <Button variant="ghost" onClick={() => dispatch({ type: "setStatus", issueId: issue.id, status: "open" })}>
          <RotateCcwIcon /> Reopen flag
        </Button>
        {nextOpen ? (
          <Button onClick={() => dispatch({ type: "select", issueId: nextOpen.id })}>
            Next open flag <ArrowRightIcon />
          </Button>
        ) : (
          <Button variant="primary" onClick={() => dispatch({ type: "go", view: "inbox" })}>
            Back to Inbox <ArrowRightIcon />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-[60px] shrink-0 items-center gap-4 border-t border-line bg-surface px-5 py-2.5">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-ink font-mono text-ui font-medium text-paper">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">What should happen to “{issue.title}”?</div>
        <div className="mt-0.5 line-clamp-2 text-caption leading-snug text-muted">
          Fix sends {tool} a corrected version. Allow keeps it on {screen.name} only. A rule makes it your new standard.
        </div>
      </div>
      <Button variant="ghost" className="text-muted" onClick={() => dispatch({ type: "modal", modal: "wrong" })}>
        <FlagIcon /> Report a wrong flag
      </Button>
      <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      <div className="flex shrink-0 gap-2">
        <Hint label={`Send ${tool} a fix that follows your rule`} side="top">
          <Button onClick={() => actions.fix(issue.id)}>
            <WrenchIcon /> Fix to match
          </Button>
        </Hint>
        <Hint label={`Keep it on ${screen.name} only`} side="top">
          <Button onClick={() => dispatch({ type: "modal", modal: "allow" })}>
            <CircleAlertIcon /> Allow here
          </Button>
        </Hint>
        <Hint label="Make this the new standard" side="top">
          <Button onClick={() => dispatch({ type: "startFlow", issueId: issue.id })}>
            <WandSparklesIcon /> Make it a rule
          </Button>
        </Hint>
      </div>
    </div>
  )
}

/** What this check ran against, in the mono the deck uses for system data. */
function StatusBar({ screen, openCount }: { screen: Screen; openCount: number }) {
  const { state } = useStore()
  const sep = <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
  return (
    <div className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-paper-2/50 px-5 font-mono text-micro whitespace-nowrap text-muted">
      <span className="flex items-center gap-1.5 text-ink-2">
        <span className={cn("size-1.5 rounded-full", openCount ? "bg-drift" : "bg-ok")} aria-hidden="true" />
        {screen.file}
      </span>
      <span className="ml-auto flex items-center gap-3">
        <span>
          {SYSTEM_NAME} v{state.systemVersion}
        </span>
        {sep}
        <span>{state.rules.length} rules</span>
        {sep}
        <span>{screen.elementsChecked} elements checked</span>
      </span>
    </div>
  )
}
