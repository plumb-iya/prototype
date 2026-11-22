import * as React from "react"
import { GuideBar, GuideButton } from "@/components/guide"
import { PlumbMark } from "@/components/brand"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

/** The window's buttons, drawn inactive so they stay out of the one-accent palette. Decoration only. */
export function TrafficLights({ className, small }: { className?: string; small?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-center", small ? "gap-1.5" : "gap-2", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("rounded-full bg-ink/[0.13] shadow-[inset_0_0_0_0.5px_rgb(18_20_26/0.12)]", small ? "size-2.5" : "size-3")} />
      ))}
    </span>
  )
}

/**
 * The app sits in a window on a desk. Everything that belongs to the study, not to Plumb, lives
 * on the desk above the window: what this is, and the walkthrough. Facilitator tools stay in ⌘K
 * so participants don't see them.
 */
export function Frame({ guide, children }: { guide: boolean; children: React.ReactNode }) {
  const { state } = useStore()
  return (
    <div className="flex h-full flex-col bg-desk md:min-w-[1180px]">
      <div className="grid h-11 shrink-0 grid-cols-[minmax(150px,1fr)_minmax(0,auto)_minmax(150px,1fr)] items-center gap-4 px-5 max-md:flex max-md:h-auto max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-2 max-md:px-3 max-md:py-2">
        <div className="flex min-w-0 items-center gap-2 max-md:h-7 max-md:flex-1">
          <PlumbMark size={20} />
          <span className="font-display text-body font-bold tracking-[-0.01em]">Plumb</span>
          <span className="font-mono text-micro tracking-[0.06em] text-muted uppercase">Prototype</span>
        </div>
        <div className="flex min-w-0 justify-center max-md:order-last max-md:w-full max-md:empty:hidden">{guide && state.guide.visible ? <div className="w-[min(720px,100%)] min-w-0"><GuideBar /></div> : null}</div>
        <div className="flex min-w-0 justify-end">{guide && !state.guide.visible ? <GuideButton /> : null}</div>
      </div>
      <div className="min-h-0 flex-1 px-3 pb-3 max-md:p-0">
        <div className="relative flex h-full overflow-hidden rounded-[12px] bg-paper shadow-window max-md:rounded-none max-md:shadow-hairline">{children}</div>
      </div>
    </div>
  )
}
