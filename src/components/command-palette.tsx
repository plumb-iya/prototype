import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandList,
  CommandSeparator,
} from "@ui-sdk/react/command"
import { Dialog, DialogBackdrop, DialogContent, DialogShortcut, DialogTitle, DialogTrigger } from "@ui-sdk/react/dialog"
import { toast } from "@ui-sdk/react/toast"
import {
  BookOpenIcon,
  CompassIcon,
  CircleAlertIcon,
  FlagIcon,
  HistoryIcon,
  InboxIcon,
  PlugIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  WandSparklesIcon,
  WrenchIcon,
} from "lucide-react"
import { buttonClass, dialogBackdrop, dialogContent, Kbd } from "@/components/ui"
import { useIssueActions } from "@/actions"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

const group = "section-label px-2 pt-3 pb-1.5"
const item =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-ui text-ink outline-none data-highlighted:bg-paper-2/70 data-disabled:opacity-40 [&_[data-slot=command-item-icon]_svg]:size-4 [&_[data-slot=command-item-icon]]:text-muted"

export function CommandPalette({
  open,
  onOpenChange,
  children,
  triggerClassName,
  triggerLabel,
  shortcut = true,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  children: React.ReactNode
  triggerClassName?: string
  triggerLabel?: string
  shortcut?: boolean
}) {
  const { state, dispatch } = useStore()
  const actions = useIssueActions()
  const selected = state.view === "review" ? state.issues.find((i) => i.id === state.selectedIssueId && i.status === "open") : undefined
  const openFlags = state.issues.filter((i) => i.screenId === "checkout" && i.status === "open")

  const run = (value: string) => {
    onOpenChange(false)
    if (value.startsWith("go-")) return dispatch({ type: "go", view: value.slice(3) as "inbox" })
    if (value.startsWith("flag-")) return dispatch({ type: "openScreen", screenId: "checkout", issueId: value.slice(5) })
    if (!selected && ["fix", "allow", "rule", "wrong"].includes(value)) return
    switch (value) {
      case "fix":
        return actions.fix(selected!.id)
      case "allow":
        return dispatch({ type: "modal", modal: "allow" })
      case "wrong":
        return dispatch({ type: "modal", modal: "wrong" })
      case "rule":
        return dispatch({ type: "startFlow", issueId: selected!.id })
      case "inject":
        dispatch({ type: "inject" })
        return toast("New screen from Claude", { description: "Account settings has a new flag: spacing off the 4px grid." })
      case "guide":
        return dispatch({ type: "guide", patch: { visible: !state.guide.visible } })
      case "reset":
        dispatch({ type: "reset" })
        return toast("Demo reset")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger shortcut="mod+k" aria-label={triggerLabel} className={triggerClassName ?? buttonClass("secondary", "md", "h-8 justify-between rounded-lg pr-1.5 text-caption font-normal")}>
        {children}
        {shortcut && <DialogShortcut className="ml-auto font-mono text-micro text-muted" />}
      </DialogTrigger>
      <DialogBackdrop className={dialogBackdrop} />
      <DialogContent className={cn(dialogContent, "top-[14vh] max-w-[580px] overflow-hidden p-0")}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command onAction={run} loop>
          <div className="flex h-12 items-center gap-2.5 border-b border-line px-4">
            <SearchIcon className="size-4 text-faint" aria-hidden="true" />
            <CommandInput aria-label="Search commands" placeholder="Type a command or search flags" className="h-full flex-1 bg-transparent text-body outline-none placeholder:text-faint" />
          </div>
          <CommandEmpty className="text-center text-muted data-empty:px-4 data-empty:py-8">No matching commands.</CommandEmpty>
          <CommandList className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
            {selected && (
              <CommandGroup>
                <CommandGroupLabel className={group}>{selected.title}</CommandGroupLabel>
                <CommandItem value="fix" className={item}><CommandItemIcon><WrenchIcon /></CommandItemIcon>Fix to match</CommandItem>
                <CommandItem value="allow" className={item}><CommandItemIcon><CircleAlertIcon /></CommandItemIcon>Allow here</CommandItem>
                <CommandItem value="rule" className={item}><CommandItemIcon><WandSparklesIcon /></CommandItemIcon>Make it a rule</CommandItem>
                <CommandItem value="wrong" className={item}><CommandItemIcon><FlagIcon /></CommandItemIcon>Report a wrong flag</CommandItem>
                <CommandSeparator className="my-1.5 h-px bg-line" />
              </CommandGroup>
            )}
            <CommandGroup>
              <CommandGroupLabel className={group}>Go to</CommandGroupLabel>
              <CommandItem value="go-inbox" className={item}><CommandItemIcon><InboxIcon /></CommandItemIcon>Inbox</CommandItem>
              <CommandItem value="go-rules" className={item}><CommandItemIcon><BookOpenIcon /></CommandItemIcon>Rules</CommandItem>
              <CommandItem value="go-history" className={item}><CommandItemIcon><HistoryIcon /></CommandItemIcon>Version history</CommandItem>
              <CommandItem value="go-tools" className={item}><CommandItemIcon><PlugIcon /></CommandItemIcon>Connected tools</CommandItem>
            </CommandGroup>
            {openFlags.length > 0 && (
              <CommandGroup>
                <CommandSeparator className="my-1.5 h-px bg-line" />
                <CommandGroupLabel className={group}>Open flags on Checkout</CommandGroupLabel>
                {openFlags.map((f) => {
                  const n = state.issues.filter((i) => i.screenId === "checkout").findIndex((i) => i.id === f.id) + 1
                  return (
                    <CommandItem key={f.id} value={`flag-${f.id}`} className={item}>
                      <CommandItemIcon>
                        <span className="flex size-4 items-center justify-center rounded-full bg-ink font-mono text-[10px] font-medium text-paper tabular-nums">{n}</span>
                      </CommandItemIcon>
                      {f.title}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            <CommandGroup>
              <CommandSeparator className="my-1.5 h-px bg-line" />
              <CommandGroupLabel className={group}>Facilitator tools</CommandGroupLabel>
              <CommandItem value="inject" className={item}><CommandItemIcon><SendIcon /></CommandItemIcon>Send a new flag</CommandItem>
              <CommandItem value="reset" className={item}><CommandItemIcon><RotateCcwIcon /></CommandItemIcon>Reset demo</CommandItem>
              <CommandItem value="guide" className={item}><CommandItemIcon><CompassIcon /></CommandItemIcon>{state.guide.visible ? "Hide" : "Show"} walkthrough</CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="flex items-center gap-4 border-t border-line bg-paper/60 px-4 py-2 text-small text-muted">
            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> Move</span>
            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> Run</span>
            <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> Close</span>
            <span className="ml-auto flex items-center gap-1.5"><SparklesIcon className="size-3.5" aria-hidden="true" /> <span className="font-mono text-micro">Checking against v{state.systemVersion}</span></span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
