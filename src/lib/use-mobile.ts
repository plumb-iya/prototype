import * as React from "react"

/** Phones get their own layout below this width. Matches Tailwind's `md` breakpoint, so `max-md:` classes agree with it. */
const QUERY = "(max-width: 767px)"

function matches() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches
}

export function useIsMobile() {
  const [mobile, setMobile] = React.useState(matches)
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const mq = window.matchMedia(QUERY)
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return mobile
}
