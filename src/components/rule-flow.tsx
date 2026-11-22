import * as React from "react"
import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@ui-sdk/react/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { Textarea } from "@ui-sdk/react/textarea"
import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react/radio"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress"
import { Timeline, TimelineConnector, TimelineDescription, TimelineItem, TimelineMarker, TimelineTitle } from "@ui-sdk/react/timeline"
import { AlertTriangleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon, MinusIcon, XIcon } from "lucide-react"
import { Button, buttonClass, dialogBackdrop, dialogContent, fieldLabel, inputClass, textareaClass } from "@/components/ui"
import { ToolTile } from "@/components/shell"
import { SYSTEM_NAME, impactComponents } from "@/data"
import { useStore, type FlowStep } from "@/store"
import { cn } from "@/lib/utils"

const STEPS: { id: FlowStep; title: string; detail: string }[] = [
  { id: "define", title: "Define the rule", detail: "Name, reason and scope" },
  { id: "impact", title: "Review the impact", detail: "What it reaches" },
  { id: "publish", title: "Publish", detail: "Send it to every tool" },
]

export function RuleFlow() {
  const { state, dispatch } = useStore()
  const flow = state.flow
  const issue = state.issues.find((i) => i.id === flow?.issueId)
  const stepIndex = flow ? (flow.published ? STEPS.length : STEPS.findIndex((s) => s.id === flow.step)) : 0

  return (
    <Dialog open={!!flow?.open} onOpenChange={(o) => !o && dispatch({ type: "closeFlow" })}>
      <DialogBackdrop className={dialogBackdrop} />
      <DialogContent initialFocus="content" className={cn(dialogContent, "top-[7vh] grid max-w-[920px] grid-cols-[232px_minmax(0,1fr)] overflow-hidden p-0 max-md:top-[4vh] max-md:grid-cols-1")}>
        <aside className="border-r border-line bg-paper/70 p-5 max-md:hidden">
          <div className="text-body font-medium">Make it a rule</div>
          <DialogDescription className="mt-0.5 mb-7 text-caption leading-snug text-muted">From the flag “{issue?.title}”</DialogDescription>
          <Timeline aria-label="Steps" className="flex flex-col">
            {STEPS.map((s, i) => {
              const status = i < stepIndex ? "complete" : i === stepIndex ? "current" : "upcoming"
              return (
                <TimelineItem key={s.id} status={status} className="group relative grid grid-cols-[20px_1fr] gap-x-3 pb-6 last:pb-0">
                  <TimelineMarker className="relative z-10 flex size-5 items-center justify-center rounded-full border border-edge bg-surface text-micro font-semibold text-muted tabular-nums group-data-complete:border-ink group-data-complete:bg-ink group-data-complete:text-paper group-data-current:border-ink group-data-current:text-ink">
                    {status === "complete" ? <CheckIcon className="size-3" /> : i + 1}
                  </TimelineMarker>
                  <TimelineConnector className="absolute top-5 bottom-0 left-[9.5px] w-px bg-line-strong group-last:hidden group-data-complete:bg-ink" />
                  <div>
                    <TimelineTitle className="text-ui leading-5 font-medium text-muted group-data-complete:text-ink group-data-current:text-ink">{s.title}</TimelineTitle>
                    <TimelineDescription className="text-caption text-muted">{s.detail}</TimelineDescription>
                  </div>
                </TimelineItem>
              )
            })}
          </Timeline>
        </aside>

        <div className="relative flex max-h-[80vh] min-h-[520px] flex-col max-md:max-h-[90dvh] max-md:min-h-0">
          <DialogClose aria-label="Close" className={buttonClass("ghost", "icon", "absolute top-3 right-3 z-10")}>
            <XIcon />
          </DialogClose>
          {flow?.step === "define" && <Define />}
          {flow?.step === "impact" && <Impact />}
          {flow?.step === "publish" && <Publish />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepHeader({ title }: { title: string }) {
  return (
    <div className="px-7 pt-6 pb-4 max-md:px-5 max-md:pt-5 max-md:pr-12">
      <DialogTitle className="font-display text-[21px] font-bold tracking-tight">{title}</DialogTitle>
    </div>
  )
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex items-center gap-2 border-t border-line bg-paper/40 px-7 py-3.5 max-md:flex-wrap max-md:px-5">{children}</div>
}

function Define() {
  const { state, dispatch } = useStore()
  const flow = state.flow!
  const issue = state.issues.find((i) => i.id === flow.issueId)
  const [tried, setTried] = React.useState(false)
  const whyRef = React.useRef<HTMLTextAreaElement>(null)
  const whyInvalid = tried && flow.why.trim().length < 8
  const scopeLabel = flow.scope === "checkout" ? "checkout screens" : "every screen"

  const next = () => {
    setTried(true)
    const why = whyRef.current?.value ?? flow.why
    if (why.trim().length < 8) {
      whyRef.current?.focus()
      return
    }
    dispatch({ type: "updateFlow", patch: { why, step: "impact" } })
  }

  return (
    <>
      <StepHeader title="Define the rule" />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_260px] gap-6 overflow-y-auto px-7 pb-6 max-md:grid-cols-1 max-md:px-5">
        <div className="flex flex-col gap-5">
          <Field className="flex flex-col gap-1.5">
            <FieldLabel className={fieldLabel}>Rule name</FieldLabel>
            <Input className={inputClass} defaultValue={flow.name} onValueChange={(v) => dispatch({ type: "updateFlow", patch: { name: String(v) } })} />
          </Field>

          <Field invalid={whyInvalid} className="flex flex-col gap-1.5">
            <FieldLabel className={fieldLabel}>Why this is the right call</FieldLabel>
            <Textarea
              ref={whyRef}
              rows={4}
              className={textareaClass}
              defaultValue={flow.why}
              placeholder="What makes this the right choice? Your team and AI tools will read this."
              onValueChange={(v) => dispatch({ type: "updateFlow", patch: { why: String(v) } })}
            />
            {whyInvalid && <FieldError match className="text-caption text-drift-ink">Add a reason. Teammates and AI tools see it with the rule, so they know it isn't a mistake.</FieldError>}
            {!whyInvalid && <FieldDescription className="text-caption text-muted">Shown wherever the rule comes up, to people and to AI tools.</FieldDescription>}
          </Field>

          <Field className="flex flex-col gap-2">
            <FieldLabel className={fieldLabel}>Where it applies</FieldLabel>
            <RadioGroup value={flow.scope} onValueChange={(v) => v && dispatch({ type: "updateFlow", patch: { scope: v as "checkout" | "everywhere" } })} className="grid gap-2">
              {[
                ["checkout", "Checkout screens only", "Every other button keeps 8px corners."],
                ["everywhere", "Everywhere", "Replaces the rule for every primary button."],
              ].map(([v, t, d]) => (
                <label key={v} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 transition-colors hover:bg-paper/60 has-data-checked:border-ink has-data-checked:bg-paper/60">
                  <Radio value={v} className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-edge bg-surface data-checked:border-ink data-checked:bg-ink">
                    <RadioIndicator className="size-1.5 rounded-full bg-paper" />
                  </Radio>
                  <span>
                    <span className="block font-medium">{t}</span>
                    <span className="block text-caption text-muted">{d}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </Field>
        </div>

        <div>
          <h3 className="section-label mb-2">How AI tools will read it</h3>
          <pre className="rounded-lg bg-ink p-4 font-mono text-micro leading-relaxed whitespace-pre-wrap text-paper">
{`## ${flow.name}

applies to: ${scopeLabel}
replaces:   "${issue?.ruleText}"

why: ${flow.why.trim() || "(add a reason)"}

follow this rule when generating
UI, and don't flag it as drift.`}
          </pre>
          <p className="mt-2 text-caption leading-snug text-muted">Nothing is sent until you approve it on the next step.</p>
        </div>
      </div>
      <Footer>
        <Button variant="ghost" onClick={() => dispatch({ type: "closeFlow" })}>Cancel</Button>
        <Button variant="primary" className="ml-auto" onClick={next}>
          Review impact <ArrowRightIcon />
        </Button>
      </Footer>
    </>
  )
}

function Impact() {
  const { state, dispatch } = useStore()
  const flow = state.flow!
  const everywhere = flow.scope === "everywhere"
  const components = everywhere ? impactComponents : impactComponents.slice(0, 6)
  const tools = state.tools.filter((t) => t.id !== "figma")
  const next = state.systemVersion + 1

  return (
    <>
      <StepHeader title="Here's what this rule reaches" />
      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6 max-md:px-5">
        <p className="mb-6 max-w-[56ch] text-body leading-relaxed text-ink-2">
          This rule changes <strong className="font-semibold text-ink">{components.length} components</strong> in{" "}
          <strong className="font-semibold text-ink">{everywhere ? "3 projects" : "1 project"}</strong> and reaches{" "}
          <strong className="font-semibold text-ink">{tools.length} AI tools</strong>.
        </p>

        <h3 className="section-label mb-2">Change to {SYSTEM_NAME}, v{state.systemVersion} to v{next}</h3>
        <div className="mb-5 overflow-hidden rounded-lg border border-line font-mono text-small">
          <div className="flex gap-3 px-3.5 py-1.5 text-muted"><span className="w-2"> </span>radius.control: 8px</div>
          <div className="flex gap-3 bg-ok-soft px-3.5 py-1.5 text-ok"><span className="w-2">+</span>radius.pay-button: pill  # {everywhere ? "everywhere" : "checkout only"}</div>
          <div className="flex gap-3 bg-ok-soft px-3.5 py-1.5 text-ok"><span className="w-2">+</span><span className="min-w-0">why: {flow.why}</span></div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 max-md:grid-cols-1">
          <div>
            <h3 className="section-label mb-2">Components that change</h3>
            <div className="flex flex-wrap gap-1.5">
              {components.map((c) => (
                <span key={c} className="inline-flex items-center gap-2 rounded-md border border-line bg-paper/50 py-1 pr-2 pl-2.5 font-mono text-micro">
                  {c}
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="h-2.5 w-5 rounded-[2px] bg-brand" />
                    <ArrowRightIcon className="size-2.5 text-faint" />
                    <span className="h-2.5 w-5 rounded-full bg-brand" />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="section-label mb-2">Who gets the new rule</h3>
            <div className="divide-y divide-line rounded-lg border border-line">
              {tools.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 px-3 py-2">
                  <ToolTile id={t.id} className="size-6" />
                  <span className="flex-1 font-medium">{t.name}</span>
                  {t.connected ? (
                    <span className="flex items-center gap-1 text-small text-ok"><CheckIcon className="size-3.5" /> Ready</span>
                  ) : (
                    <span className="flex items-center gap-1 text-small text-muted"><AlertTriangleIcon className="size-3.5" /> Offline</span>
                  )}
                </div>
              ))}
            </div>
            {tools.some((t) => !t.connected) && <p className="mt-2 text-caption text-pretty text-muted">Replit gets this rule once you reconnect it.</p>}
            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2.5">
              Tell Jordan and Sam
              <Switch defaultChecked className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-line-strong p-0.5 transition-colors data-checked:bg-ink">
                <SwitchThumb className="size-4 rounded-full bg-surface shadow-sm transition-transform data-checked:translate-x-4" />
              </Switch>
            </label>
          </div>
        </div>
      </div>
      <Footer>
        <Button variant="ghost" onClick={() => dispatch({ type: "updateFlow", patch: { step: "define" } })}>
          <ArrowLeftIcon /> Back
        </Button>
        <span className="ml-auto text-caption text-muted max-md:order-first max-md:ml-0 max-md:w-full">You can revert this from History at any time.</span>
        <Button
          variant="primary"
          data-agent-confirm={`Publishes "${flow.name}" to ${SYSTEM_NAME} and every connected AI tool`}
          onClick={() => dispatch({ type: "updateFlow", patch: { step: "publish" } })}
        >
          Approve and publish v{next}
        </Button>
      </Footer>
    </>
  )
}

function Publish() {
  const { state, dispatch } = useStore()
  const flow = state.flow!
  const [target] = React.useState(state.systemVersion + 1)
  const replitConnected = state.tools.find((t) => t.id === "replit")?.connected
  const steps = React.useMemo(
    () => [
      { label: `Write rule to ${SYSTEM_NAME} v${target}`, skip: false },
      { label: "Update Claude's context", skip: false },
      { label: "Update Lovable's context", skip: false },
      { label: "Update Replit's context", skip: !replitConnected },
      { label: "Re-check Checkout with the new rule", skip: false },
    ],
    [target, replitConnected]
  )
  const [done, setDone] = React.useState(0)
  const published = React.useRef(false)

  React.useEffect(() => {
    if (done >= steps.length) return
    const t = setTimeout(() => setDone((d) => d + 1), 650)
    return () => clearTimeout(t)
  }, [done, steps.length])

  React.useEffect(() => {
    if (done >= 1 && !published.current) {
      published.current = true
      dispatch({ type: "publish" })
    }
  }, [done, dispatch])

  const finished = done >= steps.length
  const pct = Math.round((done / steps.length) * 100)

  React.useEffect(() => {
    if (finished && !flow.published) dispatch({ type: "updateFlow", patch: { published: true } })
  }, [finished, flow.published, dispatch])

  return (
    <>
      <StepHeader title={finished ? `${SYSTEM_NAME} v${target} is live` : "Sending your rule to every tool"} />
      <div className="min-h-0 flex-1 px-7 pb-6 max-md:px-5">
        <Progress value={pct} aria-label="Publishing progress" className="mb-6">
          <ProgressTrack className="h-1 overflow-hidden rounded-full bg-paper-2">
            <ProgressIndicator className="h-full w-(--progress-value) rounded-full bg-ink transition-[width] duration-500" />
          </ProgressTrack>
        </Progress>
        <Timeline aria-label="Publishing steps" className="flex flex-col gap-3.5">
          {steps.map((s, i) => {
            const status = i < done ? "complete" : i === done ? "current" : "upcoming"
            const skipped = status === "complete" && s.skip
            return (
              <TimelineItem key={s.label} status={status} className="group flex items-center gap-3">
                <TimelineMarker className="flex size-5 items-center justify-center">
                  {status === "complete" && !skipped && <CheckIcon className="size-4 text-ok" />}
                  {skipped && <MinusIcon className="size-4 text-drift" />}
                  {status === "current" && <Loader2Icon className="size-4 animate-spin" />}
                  {status === "upcoming" && <span className="size-2 rounded-full bg-line-strong" />}
                </TimelineMarker>
                <TimelineTitle className="group-data-upcoming:text-faint">
                  {s.label}
                  {skipped && <span className="text-muted"> (skipped, Replit is offline)</span>}
                </TimelineTitle>
              </TimelineItem>
            )
          })}
        </Timeline>
        {finished && (
          <div className="mt-7 flex items-start gap-3 rounded-lg bg-ok-soft p-4 text-ok">
            <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="leading-relaxed">
              The pay button flag is resolved. Claude and Lovable now treat the pill as correct on {flow.scope === "everywhere" ? "every screen" : "checkout screens"}.
            </p>
          </div>
        )}
      </div>
      <Footer>
        {finished ? (
          <>
            <Button variant="ghost" onClick={() => { dispatch({ type: "closeFlow" }); dispatch({ type: "go", view: "history" }) }}>
              View in history
            </Button>
            <Button variant="primary" className="ml-auto" onClick={() => dispatch({ type: "closeFlow" })}>
              Back to Checkout
            </Button>
          </>
        ) : (
          <span className="text-caption text-muted" aria-live="polite">Publishing, {pct}% done</span>
        )}
      </Footer>
    </>
  )
}
