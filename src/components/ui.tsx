import * as React from "react"
import { Button as UIButton } from "@ui-sdk/react/button"
import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@ui-sdk/react/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-sdk/react/tooltip"
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "drift"
type Size = "sm" | "md" | "lg" | "icon"

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-edge/60 hover:bg-paper/60 shadow-[0_1px_1px_rgb(18_20_26/0.04)]",
  ghost: "text-muted hover:text-ink hover:bg-paper-2/70",
  danger: "bg-drift-ink text-white hover:bg-drift-ink/90",
  drift: "bg-drift text-ink hover:bg-drift/90",
}
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-caption gap-1.5 rounded-md",
  md: "h-8 px-3 text-ui gap-2 rounded-md",
  lg: "h-10 px-4 text-body gap-2 rounded-lg",
  icon: "size-8 rounded-md",
}

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-medium whitespace-nowrap transition-[background,color,box-shadow,transform] active:translate-y-px data-disabled:pointer-events-none data-disabled:opacity-45 data-pending:cursor-progress data-pending:opacity-80 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className
  )
}

export function Button({
  variant,
  size,
  className,
  ...props
}: Omit<React.ComponentProps<typeof UIButton>, "className"> & { variant?: Variant; size?: Size; className?: string }) {
  return <UIButton className={buttonClass(variant, size, className)} {...props} />
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1 font-mono text-[10.5px] font-medium text-muted shadow-[0_1px_0_var(--line-strong)]", className)}>
      {children}
    </kbd>
  )
}

export function Badge({
  tone = "neutral",
  dot,
  children,
  className,
}: {
  tone?: "neutral" | "drift" | "ok" | "ink"
  dot?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full text-small leading-none font-medium whitespace-nowrap",
        // With a dot, a badge is a status: the dot and the words, no fill. Without one, it's a small chip.
        dot ? "px-0" : "px-2",
        tone === "neutral" && (dot ? "text-muted" : "bg-paper-2 text-ink-2"),
        tone === "drift" && (dot ? "text-drift-ink" : "bg-drift-soft text-drift-ink"),
        tone === "ok" && (dot ? "text-ok" : "bg-ok-soft text-ok"),
        tone === "ink" && (dot ? "text-ink" : "bg-ink text-paper"),
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", tone === "drift" && "bg-drift", tone === "ok" && "bg-ok", tone === "neutral" && "bg-faint", tone === "ink" && (dot ? "bg-ink" : "bg-paper"))}
        />
      )}
      {children}
    </span>
  )
}

export function Hint({ label, children, side = "right" }: { label: string; children: React.ReactElement; side?: "right" | "bottom" | "top" | "left" }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        side={side}
        sideOffset={8}
        className="z-50 rounded-md bg-ink px-2 py-1 text-small font-medium text-paper shadow-pop transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export const dialogBackdrop =
  "fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:opacity-0"
export const dialogContent =
  "fixed inset-x-0 top-[12vh] z-50 mx-auto w-[calc(100vw-32px)] rounded-xl border border-line bg-surface text-ink shadow-sheet outline-none transition-[opacity,scale,translate] duration-200 ease-out data-ending-style:pointer-events-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop className={dialogBackdrop} />
      <DialogContent initialFocus="content" className={cn(dialogContent, "max-w-md p-6", className)}>
        <div className="mb-5 pr-8">
          <DialogTitle className="font-display text-[18px] leading-snug font-bold tracking-[-0.01em]">{title}</DialogTitle>
          {description && <DialogDescription className="mt-1.5 text-ui leading-relaxed text-muted">{description}</DialogDescription>}
        </div>
        {children}
        <DialogClose aria-label="Close" className={buttonClass("ghost", "icon", "absolute top-4 right-4 size-7")}>
          <XIcon />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className="relative inline-flex h-8 items-center rounded-lg bg-paper-2/80 p-0.5"
    >
      <SegmentedControlIndicator className="rounded-md bg-surface shadow-[0_1px_2px_rgb(18_20_26/0.12)]" />
      {options.map((o) => (
        <SegmentedControlItem
          key={o.value}
          value={o.value}
          className="relative z-10 flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 text-ui font-medium text-muted transition-colors hover:text-ink data-checked:text-ink"
        >
          {o.label}
          {o.count !== undefined && <span className="text-small text-muted tabular-nums">{o.count}</span>}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}

export const fieldLabel = "text-ui font-medium text-ink"
export const inputClass =
  "h-9 w-full rounded-lg border border-edge bg-surface px-3 text-ui text-ink shadow-[inset_0_1px_1px_rgb(18_20_26/0.03)] outline-none transition-shadow placeholder:text-faint focus:border-ink focus:ring-3 focus:ring-ink/10 aria-invalid:border-drift aria-invalid:ring-3 aria-invalid:ring-drift/15"
export const textareaClass = cn(inputClass, "h-auto min-h-24 py-2 leading-relaxed")
export const menuContent =
  "z-50 min-w-48 rounded-lg border border-line bg-surface p-1 text-ui shadow-pop outline-none transition-[opacity,scale] duration-100 origin-(--transform-origin) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
export const menuItem =
  "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-ink outline-none data-highlighted:bg-paper data-disabled:opacity-40 [&_svg]:size-4 [&_svg]:text-muted"

/** An empty state: a tile with an icon, what's empty, and one sentence on why or what to do. */
export function EmptyState({ icon: Icon, title, body, children }: { icon: React.ElementType; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[26rem] flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-paper shadow-hairline" aria-hidden="true">
        <Icon className="size-5 text-muted" strokeWidth={1.75} />
      </span>
      <div className="font-display text-heading font-bold tracking-[-0.01em]">{title}</div>
      <p className="leading-relaxed text-pretty text-muted">{body}</p>
      {children}
    </div>
  )
}
