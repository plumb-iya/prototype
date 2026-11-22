import * as React from "react"
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu"
import { toast } from "@ui-sdk/react/toast"
import { ArrowRightIcon, BellOffIcon, CheckCheckIcon, EllipsisIcon, InboxIcon, LinkIcon, PlugIcon, ScanSearchIcon } from "lucide-react"
import { Badge, Button, buttonClass, EmptyState, menuContent, menuItem, Segmented } from "@/components/ui"
import { Page, ToolTile } from "@/components/shell"
import { SYSTEM_NAME, screens, toolName, type Screen } from "@/data"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

type Filter = "all" | "flagged" | "clean" | "error"
type Kind = Exclude<Filter, "all">

const EMPTY: Record<Filter, { icon: React.ElementType; title: string; body: string }> = {
  all: { icon: InboxIcon, title: "No screens yet", body: "New screens from your connected tools show up here as soon as Plumb has checked them." },
  flagged: { icon: CheckCheckIcon, title: "Nothing needs your review", body: "Every checked screen matches your system." },
  clean: { icon: ScanSearchIcon, title: "No matching screens yet", body: "Screens that match your system land here, and never need your attention." },
  error: { icon: PlugIcon, title: "Every screen was checked", body: "No tools are offline right now." },
}

export function Inbox() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = React.useState<Filter>("all")

  const rows = screens.map((s) => {
    const tool = state.tools.find((t) => t.id === s.tool)
    const flags = state.issues.filter((i) => i.screenId === s.id && i.status === "open").length
    const kind: Kind = s.state === "error" && !tool?.connected ? "error" : flags > 0 ? "flagged" : "clean"
    return { s, flags, kind }
  })
  const count = (k: Filter) => (k === "all" ? rows.length : rows.filter((r) => r.kind === k).length)
  const visible = rows.filter((r) => filter === "all" || r.kind === filter)
  const waiting = rows.filter((r) => r.kind === "flagged")
  const openFlags = rows.reduce((n, r) => n + r.flags, 0)

  const summary =
    waiting.length === 0
      ? "Every checked screen matches your design system."
      : `${waiting.length === 1 ? "One screen needs" : `${waiting.length} screens need`} your review, with ${openFlags} open ${openFlags === 1 ? "flag" : "flags"}.`

  const open = (s: Screen, kind: Kind) => {
    if (kind === "error") return dispatch({ type: "go", view: "tools" })
    if (s.id === "checkout") return dispatch({ type: "openScreen", screenId: s.id })
    toast(kind === "clean" ? `${s.name} matches your system` : "This prototype only includes the Checkout review", {
      description: kind === "clean" ? `Plumb checked ${s.elementsChecked} elements and found nothing to flag.` : "It's the flow we're testing with participants.",
    })
  }

  return (
    <Page title="Inbox" description={summary}>
      <Stats openFlags={openFlags} screensWithFlags={waiting.length} />

      {waiting.length > 0 && (
        <section aria-labelledby="waiting-title" className="mt-8 overflow-hidden rounded-xl bg-surface shadow-panel-lift">
          <div className="flex items-center justify-between gap-3 px-5 py-3 max-md:px-4">
            <h2 id="waiting-title" className="flex items-center gap-3.5 font-medium">
              {/* The dot sits in a column as wide as the tiles below, so the heading lines up with their titles. */}
              <span aria-hidden="true" className="grid w-9 place-items-center">
                <span className="size-2 rounded-full bg-drift" />
              </span>
              Waiting on you
            </h2>
            <span className="font-mono text-micro text-muted">
              {waiting.length} {waiting.length === 1 ? "screen" : "screens"}
            </span>
          </div>
          {waiting.map(({ s, flags }, i) => (
            <div key={s.id} className="flex items-center gap-3.5 border-t border-line px-5 py-3.5 max-md:gap-3 max-md:px-4">
              <ToolTile id={s.tool} className="size-9 text-ui" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-body font-medium">{s.name}</span>
                  {s.receivedAgo === "2 min ago" && <Badge tone="ink" dot>New</Badge>}
                </div>
                <div className="mt-0.5 truncate text-caption text-muted">
                  <span className="text-drift-ink">
                    {flags} open {flags === 1 ? "flag" : "flags"}
                  </span>{" "}
                  · {s.author} in {toolName(s.tool)}, {s.receivedAgo}
                </div>
              </div>
              {/* One primary button per view: Plumb's own rule, kept here too. */}
              <Button variant={i === 0 ? "primary" : "secondary"} aria-label={`Review ${s.name}`} onClick={() => open(s, "flagged")}>
                Review <ArrowRightIcon />
              </Button>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="all-title" className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2.5">
          <h2 id="all-title" className="section-label">
            All screens
          </h2>
          <Segmented<Filter>
            label="Filter screens"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: count("all") },
              { value: "flagged", label: "Needs review", count: count("flagged") },
              { value: "clean", label: "Matches", count: count("clean") },
              { value: "error", label: "Couldn't check", count: count("error") },
            ]}
          />
        </div>

        <div className="overflow-hidden rounded-xl bg-surface shadow-panel">
          {visible.length === 0 && <EmptyState {...EMPTY[filter]} />}
          {visible.map(({ s, flags, kind }, idx) => (
            <Row key={s.id} s={s} flags={flags} kind={kind} first={idx === 0} onOpen={() => open(s, kind)} />
          ))}
        </div>
        <p className="mt-3 text-caption text-muted">Plumb checks every screen your connected tools produce. Screens that match your system never need your attention.</p>
      </section>
    </Page>
  )
}

/** The numbers worth a glance, set like the instrument tiles on the mood board. */
function Stats({ openFlags, screensWithFlags }: { openFlags: number; screensWithFlags: number }) {
  const { state } = useStore()
  const offline = state.tools.filter((t) => !t.connected)
  const checked = screens.filter((s) => state.tools.find((t) => t.id === s.tool)?.connected || s.state !== "error")
  const elements = checked.reduce((n, s) => n + s.elementsChecked, 0)

  const tile = "flex min-h-[118px] min-w-0 flex-col justify-between rounded-xl p-4 max-md:min-h-[100px] max-md:p-3.5"
  const value = "font-display text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums"

  return (
    <dl className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-md:gap-2">
      <div className={cn(tile, "relative bg-ink text-paper shadow-panel-lift")}>
        <dt className="section-label text-paper/60">Open flags</dt>
        <dd>
          <div className={value}>{openFlags}</div>
          <div className="mt-1.5 text-caption text-paper/70">
            {screensWithFlags ? `On ${screensWithFlags} ${screensWithFlags === 1 ? "screen" : "screens"}` : "Nothing to review"}
          </div>
        </dd>
        {openFlags > 0 && <span className="absolute top-4 right-4 size-2 rounded-full bg-drift" aria-hidden="true" />}
      </div>
      <div className={cn(tile, "bg-surface shadow-panel")}>
        <dt className="section-label">Screens checked</dt>
        <dd>
          <div className={value}>
            {checked.length}
            <span className="text-heading font-medium tracking-normal text-muted"> of {screens.length}</span>
          </div>
          <div className={cn("mt-1.5 text-caption", offline.length ? "text-drift-ink" : "text-muted")}>
            {offline.length ? `${offline.map((t) => t.name).join(", ")} is offline` : "Every tool is reporting"}
          </div>
        </dd>
      </div>
      <div className={cn(tile, "bg-surface shadow-panel")}>
        <dt className="section-label">Design system</dt>
        <dd>
          <div className={value}>v{state.systemVersion}</div>
          <div className="mt-1.5 truncate text-caption text-muted">
            {SYSTEM_NAME}, {state.rules.length} rules
          </div>
        </dd>
      </div>
      <div className={cn(tile, "bg-surface shadow-panel")}>
        <dt className="section-label">Elements checked</dt>
        <dd>
          <div className={value}>{elements}</div>
          <div className="mt-1.5 text-caption text-muted">Color, shape, type, components</div>
        </dd>
      </div>
    </dl>
  )
}

function Row({ s, flags, kind, first, onOpen }: { s: Screen; flags: number; kind: Kind; first: boolean; onOpen: () => void }) {
  const { dispatch } = useStore()
  const isNew = s.receivedAgo === "2 min ago"
  return (
    <div className={cn("group relative flex min-h-[64px] items-center gap-4 px-4 py-3 transition-colors hover:bg-paper/50 max-md:gap-3", !first && "border-t border-line")}>
      <ToolTile id={s.tool} className="size-9 text-ui" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* The name is the row's link; its ::after covers the whole row so anywhere in it opens the screen. */}
          <button
            type="button"
            onClick={onOpen}
            aria-label={kind === "flagged" ? `Open ${s.name}, ${flags} open ${flags === 1 ? "flag" : "flags"}` : kind === "error" ? `${s.name}, ${toolName(s.tool)} offline. Open Tools` : `${s.name}, matches system`}
            className="cursor-pointer text-body font-medium outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ink"
          >
            {s.name}
          </button>
          {isNew && <Badge tone="ink" dot>New</Badge>}
        </div>
        <div className="mt-0.5 flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-caption text-muted">
            {s.author} in {toolName(s.tool)}
          </span>
          <span className="truncate font-mono text-micro text-faint max-md:hidden">{s.file}</span>
        </div>
      </div>
      <span className="w-20 shrink-0 text-right text-caption whitespace-nowrap text-muted max-md:hidden">{s.receivedAgo}</span>
      <span className="w-36 shrink-0 max-md:w-auto">
        {kind === "flagged" && (
          <Badge tone="drift" dot>
            {flags} {flags === 1 ? "flag" : "flags"}
          </Badge>
        )}
        {kind === "clean" && (
          <Badge tone="ok" dot>
            Matches system
          </Badge>
        )}
        {kind === "error" && (
          <Badge tone="neutral" dot>
            {toolName(s.tool)} offline
          </Badge>
        )}
      </span>
      <span className="relative z-10 flex w-24 shrink-0 justify-end max-md:hidden">
        {kind === "error" && (
          <Button size="sm" onClick={() => dispatch({ type: "go", view: "tools" })}>
            Reconnect
          </Button>
        )}
      </span>
      <Menu
        onAction={(v) => {
          if (v === "review") onOpen()
          if (v === "copy") toast("Link copied", { description: `plumb.app/acme/${s.id}` })
          if (v === "mute") toast(`${s.name} muted for today`, { description: "Plumb keeps checking it and holds new flags until tomorrow." })
        }}
      >
        <MenuTrigger aria-label={`More actions for ${s.name}`} className={buttonClass("ghost", "icon", "relative z-10 size-7 text-muted data-open:bg-paper-2 data-open:text-ink")}>
          <EllipsisIcon />
        </MenuTrigger>
        <MenuContent className={menuContent} align="end" sideOffset={4}>
          <MenuItem value="review" className={menuItem}>
            <ArrowRightIcon /> Open {s.name}
          </MenuItem>
          <MenuItem value="copy" className={menuItem}>
            <LinkIcon /> Copy link
          </MenuItem>
          <MenuSeparator className="my-1 h-px bg-line" />
          <MenuItem value="mute" className={menuItem}>
            <BellOffIcon /> Mute for today
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}
