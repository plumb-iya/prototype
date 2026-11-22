import type { ToolId } from "@/data"
import { cn } from "@/lib/utils"

/**
 * Plumb's mark, straight from the FP1 title slide: a coral plumb line ending in a round coral bob.
 * Under 32px the line thickens and the bob grows a little so it stays crisp in a sidebar or a browser tab.
 */
export function PlumbMark({ size, className }: { size: number; className?: string }) {
  const small = size < 32
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn("shrink-0", className)} aria-hidden="true">
      <line x1="16" y1="3" x2="16" y2="19.5" stroke="var(--drift)" strokeWidth={small ? 2.2 : 1.6} />
      <circle cx="16" cy={small ? 22.5 : 23} r={small ? 5.5 : 4.5} fill="var(--drift)" />
    </svg>
  )
}

/** The mark on its ink tile: the app icon, at any size. */
export function PlumbTile({ size, label, className }: { size: number; label?: string; className?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex shrink-0 items-center justify-center bg-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]", className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.24) }}
    >
      <PlumbMark size={Math.round(size * 0.82)} />
    </span>
  )
}

export function ToolTile({ id, className }: { id: ToolId; className?: string }) {
  const letter = { claude: "C", lovable: "L", replit: "R", figma: "F" }[id]
  return (
    <span aria-hidden="true" className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-paper text-small font-semibold text-ink-2 shadow-hairline", className)}>
      {letter}
    </span>
  )
}
