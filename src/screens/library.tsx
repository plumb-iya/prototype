import * as React from "react"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react/alert-dialog"
import { Timeline, TimelineConnector, TimelineItem, TimelineMarker, TimelineTime, TimelineTitle } from "@ui-sdk/react/timeline"
import { toast } from "@ui-sdk/react/toast"
import { Loader2Icon, PlugZapIcon, RotateCcwIcon } from "lucide-react"
import { Badge, Button, buttonClass, dialogBackdrop, dialogContent, Segmented } from "@/components/ui"
import { Page, ToolTile } from "@/components/shell"
import { SYSTEM_NAME, type Rule } from "@/data"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

type Cat = "all" | Rule["category"]
// On a phone each rule becomes a stacked card.
const RULE_COLS = "grid grid-cols-[104px_minmax(0,1fr)_minmax(0,1.15fr)_96px] gap-x-6 max-md:grid-cols-1 max-md:gap-y-1.5"

export function Rules() {
  const { state } = useStore()
  const [cat, setCat] = React.useState<Cat>("all")
  const cats: Cat[] = ["all", "Color", "Shape", "Type", "Components", "Content"]
  const rows = state.rules.filter((r) => cat === "all" || r.category === cat)

  return (
    <Page
      title="Rules"
      description={`${SYSTEM_NAME} v${state.systemVersion}. Every rule carries the reason behind it, and Plumb shares both with your AI tools so they can tell a mistake from a deliberate choice.`}
    >
      <div className="mb-3">
        <Segmented<Cat>
          label="Filter rules by category"
          value={cat}
          onChange={setCat}
          options={cats.map((c) => ({ value: c, label: c === "all" ? "All" : c, count: c === "all" ? state.rules.length : state.rules.filter((r) => r.category === c).length }))}
        />
      </div>
      <div className="overflow-hidden rounded-xl bg-surface shadow-panel">
        <div className={cn(RULE_COLS, "section-label h-9 items-center border-b border-line px-4 max-md:hidden")}>
          <span>Category</span>
          <span>Rule</span>
          <span>Why</span>
          <span className="text-right">Applies to</span>
        </div>
        {rows.map((r, idx) => (
          <div key={r.id} className={cn(RULE_COLS, "items-start px-4 py-4", idx > 0 && "border-t border-line", r.isNew && "bg-ok-soft/50")}>
            <span className="text-caption text-muted max-md:section-label">{r.category}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                {r.name}
                {r.isNew && <Badge tone="ok">New</Badge>}
              </div>
              <div className="mt-1 font-mono text-small text-muted">{r.value}</div>
            </div>
            <p className="leading-relaxed text-ink-2">{r.why}</p>
            <div className="text-right max-md:flex max-md:gap-2 max-md:text-left max-md:text-caption max-md:text-muted">
              <div>{r.scope}</div>
              <div className="mt-0.5 font-mono text-small text-muted max-md:mt-0">v{r.version}</div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

export function History() {
  const { state, dispatch } = useStore()
  const [selected, setSelected] = React.useState(state.versions[0]?.version)
  const current = state.versions.find((v) => v.version === selected) ?? state.versions[0]
  const latest = state.versions[0]
  const previous = state.versions[1]

  React.useEffect(() => {
    if (!state.versions.some((v) => v.version === selected)) setSelected(state.versions[0]?.version)
  }, [state.versions, selected])

  return (
    <Page title="History" description={`Every change to ${SYSTEM_NAME}, newest first. If a change causes problems, revert the live version.`}>
      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-8 max-md:grid-cols-1 max-md:gap-5">
        <Timeline aria-label="Versions" className="flex flex-col">
          {state.versions.map((v, i) => {
            const active = v.version === current?.version
            return (
              <TimelineItem key={v.version} status={i === 0 ? "current" : "complete"} className="group relative grid grid-cols-[14px_1fr] gap-x-3">
                <TimelineMarker
                  className={cn("relative z-10 mt-[18px] size-2.5 rounded-full ring-4 ring-paper", i === 0 ? "bg-ok" : "border-[1.5px] border-edge bg-paper")}
                />
                <TimelineConnector className="absolute top-8 bottom-[-14px] left-[4.5px] w-px bg-line-strong group-last:hidden" />
                <Button
                  variant="ghost"
                  onClick={() => setSelected(v.version)}
                  aria-pressed={active}
                  className={cn(
                    "mb-1.5 h-auto flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left font-normal whitespace-normal",
                    active ? "bg-surface text-ink shadow-panel hover:bg-surface" : "text-ink hover:bg-paper-2/60"
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-small text-muted">v{v.version}</span>
                    {i === 0 && <Badge tone="ok" dot>Live</Badge>}
                  </span>
                  <TimelineTitle className="leading-snug font-medium">{v.summary}</TimelineTitle>
                  <TimelineTime className="text-caption text-muted">
                    {v.author}, {v.when.toLowerCase()}
                  </TimelineTime>
                </Button>
              </TimelineItem>
            )
          })}
        </Timeline>

        {current && (
          <section aria-label={`Changes in v${current.version}`}>
            <div className="mb-3 flex min-h-8 items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2.5">
              <div>
                <h2 className="text-body font-medium">What changed in v{current.version}</h2>
                <p className="text-caption text-muted">{current.summary}</p>
              </div>
              {latest && previous && current.version === latest.version && (
                <AlertDialog
                  onOpenChange={(open, details) => {
                    if (open || details.returnValue !== "confirm") return
                    dispatch({ type: "revert", toVersion: previous.version })
                    toast(`Reverted to v${previous.version}`, { description: "Claude and Lovable have the previous rules again." })
                  }}
                >
                  <AlertDialogTrigger className={buttonClass("secondary", "sm")}>
                    <RotateCcwIcon /> Revert to v{previous.version}
                  </AlertDialogTrigger>
                  <AlertDialogBackdrop className={dialogBackdrop} />
                  <AlertDialogContent initialFocus="content" className={cn(dialogContent, "max-w-md p-6")}>
                    <AlertDialogTitle className="font-display text-[18px] font-bold tracking-[-0.01em]">Revert to v{previous.version}?</AlertDialogTitle>
                    <AlertDialogDescription className="mt-1.5 leading-relaxed text-muted">
                      "{latest.summary}" will be removed from your system, and connected tools will get v{previous.version} again. Flags it resolved will reopen.
                    </AlertDialogDescription>
                    <div className="mt-6 flex justify-end gap-2">
                      <AlertDialogClose className={buttonClass("ghost")}>Cancel</AlertDialogClose>
                      <AlertDialogClose
                        value="confirm"
                        data-agent-confirm={`Reverts ${SYSTEM_NAME} from v${latest.version} to v${previous.version} for every connected tool`}
                        className={buttonClass("danger")}
                      >
                        Revert system
                      </AlertDialogClose>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="overflow-hidden rounded-xl bg-surface shadow-panel font-mono text-caption leading-relaxed">
              {current.diff.map((d, i) => (
                <div
                  key={i}
                  className={cn("flex gap-3 px-4 py-2", d.kind === "add" && "bg-ok-soft text-ok", d.kind === "remove" && "bg-drift-soft text-drift-ink", d.kind === "same" && "text-muted")}
                >
                  <span className="w-2 select-none" aria-hidden="true">
                    {d.kind === "add" ? "+" : d.kind === "remove" ? "−" : " "}
                  </span>
                  <span className="sr-only">{d.kind === "add" ? "Added: " : d.kind === "remove" ? "Removed: " : "Unchanged: "}</span>
                  <span className="min-w-0 break-words">{d.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  )
}

export function Tools() {
  const { state, dispatch } = useStore()
  return (
    <Page title="Tools" description="Plumb checks every screen these tools produce, and keeps your rules in each one." width="max-w-[760px]">
      <div className="overflow-hidden rounded-xl bg-surface shadow-panel">
        {state.tools.map((t, idx) => (
          <div key={t.id} className={cn("flex min-h-[68px] items-center gap-4 px-4 py-3 max-md:flex-wrap max-md:gap-3", idx > 0 && "border-t border-line")}>
            <ToolTile id={t.id} className="size-9 text-ui" />
            <div className="min-w-0 flex-1">
              <div className="text-body font-medium">{t.name}</div>
              <div className="text-caption text-muted">
                {t.connected ? `Last check ${t.lastSync === "Just now" ? "just now" : t.lastSync}` : `Offline for ${t.lastSync.replace(" ago", "")}. Screens from ${t.name} aren't being checked.`}
              </div>
            </div>
            {t.connected ? (
              <Badge tone="ok" dot>
                Connected
              </Badge>
            ) : (
              <Button
                variant="primary"
                size="sm"
                pendingAnnouncement="Reconnecting"
                onClick={() =>
                  new Promise<void>((resolve) =>
                    setTimeout(() => {
                      dispatch({ type: "setTool", id: t.id, connected: true })
                      toast(`${t.name} reconnected`, { description: "Plumb is checking Onboarding and sending your latest rules." })
                      resolve()
                    }, 1200)
                  )
                }
              >
                <PlugZapIcon className="in-data-pending:hidden" />
                <Loader2Icon className="hidden animate-spin in-data-pending:block" />
                Reconnect {t.name}
              </Button>
            )}
          </div>
        ))}
      </div>
    </Page>
  )
}
