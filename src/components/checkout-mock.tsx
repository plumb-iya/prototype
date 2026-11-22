import { cn } from "@/lib/utils"
import type { Issue } from "@/data"

// The screen Lovable generated. Each pin is anchored to the element it flags, and
// resolving a flag changes what the screen shows, so a fix is visible right away.
export function CheckoutMock({ issues, selectedId, onPin }: { issues: Issue[]; selectedId: string | null; onPin: (id: string) => void }) {
  const flags = issues.filter((i) => i.screenId === "checkout")
  const status = (id: string) => flags.find((i) => i.id === id)?.status
  const pillFixed = status("pill") === "fixed"
  const blueFixed = status("blue") === "fixed"
  const primaryFixed = status("primary") === "fixed"
  const headingFixed = status("heading") === "fixed"
  const blue = blueFixed ? "var(--brand)" : "var(--off-brand)"

  const Pin = ({ id, className }: { id: string; className: string }) => {
    const idx = flags.findIndex((f) => f.id === id)
    const issue = flags[idx]
    if (!issue) return null
    const open = issue.status === "open"
    const active = selectedId === id
    return (
      <button
        type="button"
        onClick={() => onPin(id)}
        aria-label={`Flag ${idx + 1}: ${issue.title}`}
        aria-pressed={active}
        className={cn(
          "absolute z-10 flex size-6 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold tabular-nums shadow-[0_0_0_2.5px_white] transition-transform",
          open ? "bg-drift text-ink" : "bg-paper-2 text-muted",
          active && open && "scale-110 shadow-[0_0_0_2.5px_white,0_0_0_6px_rgb(255_90_54/0.3)]",
          active && !open && "shadow-[0_0_0_2.5px_white,0_0_0_5px_var(--line-strong)]",
          className
        )}
      >
        {idx + 1}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white px-10 pt-9 pb-10 shadow-[0_1px_2px_rgb(18_20_26/0.05),0_16px_40px_-16px_rgb(18_20_26/0.22)]">
      <div className="relative inline-block">
        <h2 className={cn("font-semibold tracking-tight text-[#12141A]", headingFixed ? "text-[30px]" : "text-[36px]")}>Checkout</h2>
        <Pin id="heading" className="top-0 -right-8" />
      </div>

      <div className="mt-6 space-y-1.5">
        <div className="text-[12px] font-medium text-[#5C5E66]">Email</div>
        <div className="h-10 rounded-[8px] bg-[#EEEEF0] px-3 text-[13px] leading-10 text-[#5C5E66]">you@example.com</div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="text-[12px] font-medium text-[#5C5E66]">Card number</div>
        <div className="h-10 rounded-[8px] bg-[#EEEEF0] px-3 font-mono text-[13px] leading-10 text-[#5C5E66]">4242 4242 4242 4242</div>
      </div>

      <div className="relative mt-5 inline-block">
        <span
          className={cn("inline-flex h-9 items-center px-5 text-[13px] font-semibold", primaryFixed ? "border border-[#D1CCBF] text-[#12141A]" : "text-white")}
          style={{ background: primaryFixed ? "transparent" : blue, borderRadius: pillFixed || primaryFixed ? 8 : 999 }}
        >
          Apply coupon
        </span>
        <Pin id="primary" className="-top-2.5 -right-2.5" />
      </div>

      <div className="mt-6 space-y-2 text-[14px] text-[#5C5E66]">
        <div className="flex justify-between"><span>Subtotal</span><span>$44.00</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>$4.00</span></div>
        <div className="my-3 h-px bg-[#E5E2DA]" />
        <div className="flex justify-between text-[15px] font-semibold text-[#12141A]"><span>Total</span><span>$48.00</span></div>
      </div>

      <div className="relative mt-7">
        <div className="flex h-12 items-center justify-center text-[15px] font-semibold text-white" style={{ background: blue, borderRadius: pillFixed ? 8 : 999 }}>
          Pay $48.00
        </div>
        <Pin id="blue" className="-top-2.5 -left-2.5" />
        <Pin id="pill" className="-top-2.5 -right-2.5" />
      </div>
    </div>
  )
}
