import * as React from "react"
import { BookOpenIcon, ChevronRightIcon, HistoryIcon, InboxIcon, PanelLeftIcon, PlugIcon, SearchIcon } from "lucide-react"
import { Button, buttonClass, Hint } from "@/components/ui"
import { CommandPalette } from "@/components/command-palette"
import { TrafficLights } from "@/components/frame"
import { SYSTEM_NAME, screens, toolName } from "@/data"
import { PlumbTile, ToolTile } from "@/components/brand"
export { PlumbMark, PlumbTile, ToolTile } from "@/components/brand"
import { useStore, type View } from "@/store"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/use-mobile"

const NAV: { id: View; label: string; icon: React.ElementType; match: View[] }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon, match: ["inbox", "review"] },
  { id: "rules", label: "Rules", icon: BookOpenIcon, match: ["rules"] },
  { id: "history", label: "History", icon: HistoryIcon, match: ["history"] },
  { id: "tools", label: "Tools", icon: PlugIcon, match: ["tools"] },
]

const TITLES: Record<View, string> = { inbox: "Inbox", review: "Checkout", rules: "Rules", history: "History", tools: "Tools" }

const ME = { name: "Amber", initial: "A", role: "Designer" }

/**
 * The window's contents: a labeled sidebar beside the work. On Review the sidebar folds to an icon
 * rail so the screen being reviewed gets the room; ⌘\ or the toolbar button switches it either way.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  const mobile = useIsMobile()
  const [railOnReview, setRailOnReview] = React.useState(true)
  const [railElsewhere, setRailElsewhere] = React.useState(false)
  const onReview = state.view === "review"
  const collapsed = onReview ? railOnReview : railElsewhere
  const toggle = React.useCallback(() => (onReview ? setRailOnReview((v) => !v) : setRailElsewhere((v) => !v)), [onReview])

  // Tell the toast region where the work area is: beside the sidebar, and above the decision bar on Review.
  // On a phone: above the tab bar, and above the decision bar too on Review.
  React.useLayoutEffect(() => {
    const root = document.documentElement.style
    if (mobile) {
      root.setProperty("--toast-left", "12px")
      root.setProperty("--toast-bottom", `${56 + (onReview ? 120 : 0) + 12}px`)
      return
    }
    root.setProperty("--toast-left", `${12 + (collapsed ? 60 : 228) + 16}px`)
    root.setProperty("--toast-bottom", `${12 + (onReview ? 28 + 60 : 0) + 16}px`)
  }, [collapsed, onReview, mobile])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  if (mobile) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar collapsed onToggle={toggle} mobile />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        <TabBar />
      </div>
    )
  }

  return (
    <>
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar collapsed={collapsed} onToggle={toggle} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </>
  )
}

/** Opening the palette counts toward the walkthrough's last step. */
function usePalette() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = React.useState(false)
  const onOpenChange = (o: boolean) => {
    setOpen(o)
    if (o && !state.guide.usedPalette) dispatch({ type: "guide", patch: { usedPalette: true } })
  }
  return { open, onOpenChange }
}

/** On a phone the sidebar becomes a tab bar along the bottom, with the same four places. */
function TabBar() {
  const { state, dispatch } = useStore()
  const { open, offline } = useCounts()
  return (
    <nav aria-label="Main" className="grid shrink-0 grid-cols-4 border-t border-line bg-paper-2 pb-[env(safe-area-inset-bottom)]">
      {NAV.map((n) => {
        const active = n.match.includes(state.view)
        const label = n.id === "inbox" && open > 0 ? `${n.label}, ${open} open ${open === 1 ? "flag" : "flags"}` : n.id === "tools" && offline.length ? `${n.label}, ${offline.length} offline` : undefined
        return (
          <button
            key={n.id}
            type="button"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => dispatch({ type: "go", view: n.id })}
            className={cn("flex h-14 cursor-pointer flex-col items-center justify-center gap-1 text-micro font-medium outline-none", active ? "text-ink" : "text-muted")}
          >
            <span className="relative">
              <n.icon className="size-5" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
              {n.id === "inbox" && open > 0 && (
                <span aria-hidden="true" className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-mono text-micro text-paper tabular-nums ring-2 ring-paper-2">
                  {open}
                </span>
              )}
              {n.id === "tools" && offline.length > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-drift-ink ring-2 ring-paper-2" />}
            </span>
            {n.label}
          </button>
        )
      })}
    </nav>
  )
}

function useCounts() {
  const { state } = useStore()
  const open = state.issues.filter((i) => i.status === "open").length
  const offline = state.tools.filter((t) => !t.connected)
  return { open, offline, rules: state.rules.length, version: state.systemVersion, tools: state.tools }
}

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { state, dispatch } = useStore()
  const { open, offline, rules, version, tools } = useCounts()
  const { open: paletteOpen, onOpenChange: onPalette } = usePalette()

  const meta = (id: View) => {
    if (id === "inbox" && open > 0)
      return (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1.5 font-mono text-micro text-paper tabular-nums">
          {open}
          <span className="sr-only"> open {open === 1 ? "flag" : "flags"}</span>
        </span>
      )
    if (id === "rules") return <span className="ml-auto font-mono text-micro text-muted tabular-nums">{rules}</span>
    if (id === "history") return <span className="ml-auto font-mono text-micro text-muted">v{version}</span>
    if (id === "tools" && offline.length)
      return (
        <span className="ml-auto flex items-center gap-1.5 font-mono text-micro text-drift-ink">
          <span className="size-1.5 rounded-full bg-drift-ink" aria-hidden="true" />
          {offline.length} offline
        </span>
      )
    return null
  }

  if (collapsed) {
    return (
      <aside className="flex w-[60px] shrink-0 flex-col items-center border-r border-line bg-paper-2 pb-3">
        <div className="flex h-12 shrink-0 items-center">
          <TrafficLights small />
        </div>
        <PlumbTile size={32} label={`Plumb, ${SYSTEM_NAME}`} className="mb-3" />
        <Hint label="Search  ⌘K">
          <span>
            <CommandPalette open={paletteOpen} onOpenChange={onPalette} shortcut={false} triggerLabel="Search or run a command" triggerClassName={railButton(false)}>
              <SearchIcon className="!size-[18px]" strokeWidth={1.75} />
            </CommandPalette>
          </span>
        </Hint>
        <span className="my-2 h-px w-6 bg-line-strong" aria-hidden="true" />
        <nav aria-label="Main" className="flex flex-col gap-1.5">
          {NAV.map((n) => {
            const active = n.match.includes(state.view)
            return (
              <Hint key={n.id} label={n.label}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={n.id === "inbox" && open > 0 ? `${n.label}, ${open} open ${open === 1 ? "flag" : "flags"}` : n.id === "tools" && offline.length ? `${n.label}, ${offline.length} offline` : n.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => dispatch({ type: "go", view: n.id })}
                  className={railButton(active)}
                >
                  <n.icon className="!size-[18px]" strokeWidth={1.75} />
                  {n.id === "inbox" && open > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] text-paper tabular-nums ring-2 ring-paper-2">
                      {open}
                    </span>
                  )}
                  {n.id === "tools" && offline.length > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-drift-ink ring-2 ring-paper-2" />}
                </Button>
              </Hint>
            )
          })}
        </nav>
        <div className="mt-auto flex size-8 items-center justify-center rounded-full bg-surface text-small font-semibold text-ink-2 shadow-hairline" role="img" aria-label={`Signed in as ${ME.name}`}>
          {ME.initial}
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-line bg-paper-2">
      <div className="flex h-12 shrink-0 items-center px-4">
        <TrafficLights />
      </div>
      <div className="px-3">
        <div className="flex h-9 items-center gap-2.5 px-2">
          <PlumbTile size={24} />
          <span className="truncate font-semibold tracking-[-0.01em]">{SYSTEM_NAME}</span>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={onPalette} triggerClassName={cn(ROW, "mt-1 w-full text-muted hover:bg-surface/60 hover:text-ink")}>
          <SearchIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span>Search</span>
        </CommandPalette>
      </div>

      <nav aria-label="Main" className="mt-4 grid gap-0.5 px-3">
        {NAV.map((n) => {
          const active = n.match.includes(state.view)
          return (
            <button
              key={n.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => dispatch({ type: "go", view: n.id })}
              className={cn(ROW, active ? "bg-surface font-medium text-ink shadow-panel" : "text-ink-2 hover:bg-surface/60 hover:text-ink")}
            >
              <n.icon className={cn("size-4 shrink-0", active ? "text-ink" : "text-muted")} strokeWidth={1.75} aria-hidden="true" />
              {n.label}
              {meta(n.id)}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto p-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "go", view: "tools" })}
          className="block w-full cursor-pointer rounded-xl bg-surface p-3 text-left shadow-panel transition-shadow hover:shadow-panel-lift"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className={cn("size-2 shrink-0 rounded-full", offline.length ? "bg-drift-ink" : "bg-ok")} aria-hidden="true" />
            {offline.length ? `${offline.map((t) => t.name).join(", ")} is offline` : "All tools checking"}
          </span>
          <span className="mt-1 block text-caption leading-snug text-muted">
            {offline.length ? "Its screens wait until you reconnect." : `${tools.length} tools, checked against v${version}`}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-small font-semibold text-ink-2 shadow-hairline" aria-hidden="true">
          {ME.initial}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-medium">{ME.name}</span>
          <span className="block text-caption text-muted">{ME.role}</span>
        </span>
      </div>
    </aside>
  )
}

const ROW = "flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left outline-none transition-colors"

function railButton(active: boolean) {
  return cn(
    "relative flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface/60 hover:text-ink",
    active && "bg-surface text-ink shadow-panel hover:bg-surface"
  )
}

function Toolbar({ collapsed, onToggle, mobile }: { collapsed: boolean; onToggle: () => void; mobile?: boolean }) {
  const { state, dispatch } = useStore()
  const palette = usePalette()
  const screen = screens.find((s) => s.id === state.screenId) ?? screens[0]
  const openOnScreen = state.issues.filter((i) => i.screenId === screen.id && i.status === "open").length
  const review = state.view === "review"

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 max-md:gap-2 max-md:px-3">
      {mobile ? (
        <PlumbTile size={24} label={`Plumb, ${SYSTEM_NAME}`} />
      ) : (
      <Hint label={collapsed ? "Show sidebar  ⌘\\" : "Hide sidebar  ⌘\\"} side="bottom">
        <Button variant="ghost" size="icon" aria-label={collapsed ? "Show sidebar" : "Hide sidebar"} onClick={onToggle} className="-ml-1 size-7 text-muted">
          <PanelLeftIcon strokeWidth={1.75} />
        </Button>
      </Hint>
      )}
      <span className="h-4 w-px shrink-0 bg-line-strong" aria-hidden="true" />
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        {review ? (
          <>
            <button className="cursor-pointer rounded text-muted hover:text-ink" onClick={() => dispatch({ type: "go", view: "inbox" })}>
              Inbox
            </button>
            <ChevronRightIcon className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
            <span className="truncate font-medium" aria-current="page">
              {screen.name}
            </span>
          </>
        ) : (
          <span className="font-medium" aria-current="page">
            {TITLES[state.view]}
          </span>
        )}
      </nav>
      {review && (
        <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-surface px-2.5 text-small font-medium shadow-hairline">
          <span className={cn("size-1.5 rounded-full", openOnScreen ? "bg-drift" : "bg-ok")} aria-hidden="true" />
          {openOnScreen ? `${openOnScreen} open ${openOnScreen === 1 ? "flag" : "flags"}` : "Matches your system"}
        </span>
      )}
      {review && !mobile && (
        <span className="ml-auto flex min-w-0 items-center gap-2 text-caption text-muted">
          <ToolTile id={screen.tool} className="size-6 text-micro" />
          <span className="truncate">
            Built by <span className="text-ink">{screen.author}</span> in <span className="text-ink">{toolName(screen.tool)}</span>, {screen.receivedAgo}
          </span>
        </span>
      )}
      {mobile && (
        <span className="ml-auto">
          <CommandPalette open={palette.open} onOpenChange={palette.onOpenChange} shortcut={false} triggerLabel="Search or run a command" triggerClassName={buttonClass("ghost", "icon", "text-muted")}>
            <SearchIcon strokeWidth={1.75} />
          </CommandPalette>
        </span>
      )}
    </header>
  )
}

export function Page({
  title,
  description,
  actions,
  children,
  width = "max-w-[1040px]",
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={cn("px-10 pt-9 pb-20 max-md:px-4 max-md:pt-6 max-md:pb-10", width)}>
        <div className="mb-7 flex items-end justify-between gap-6 max-md:mb-5 max-md:flex-col max-md:items-start max-md:gap-4">
          <div>
            <h1 className="font-display text-display leading-[1.1] font-bold tracking-[-0.025em]">{title}</h1>
            {description && <p className="mt-2 max-w-[62ch] text-body leading-relaxed text-muted">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  )
}
