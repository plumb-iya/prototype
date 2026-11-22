import { Toast, ToastAction, ToastClose, ToastDescription, ToastRegion, ToastTitle } from "@ui-sdk/react/toast"
import { XIcon } from "lucide-react"
import { Shell } from "@/components/shell"
import { Frame } from "@/components/frame"
import { RuleFlow } from "@/components/rule-flow"
import { GuideIntro } from "@/components/guide"
import { StoreProvider, useStore, type View } from "@/store"
import { Inbox } from "@/screens/inbox"
import { Review } from "@/screens/review"
import { History, Rules, Tools } from "@/screens/library"

function Screen() {
  const { state } = useStore()
  switch (state.view) {
    case "inbox": return <Inbox />
    case "review": return <Review />
    case "rules": return <Rules />
    case "history": return <History />
    case "tools": return <Tools />
  }
}

export function Toasts() {
  return (
    <ToastRegion side="bottom" align="start" data-agent-hidden>
      {(item) => (
        <Toast className="flex items-start gap-3 rounded-xl bg-ink py-3 pr-2.5 pl-4 text-paper shadow-sheet">
          <div className="min-w-0 flex-1 py-0.5">
            <ToastTitle className="text-ui font-medium" />
            <ToastDescription className="mt-0.5 text-caption leading-snug text-paper/70" />
          </div>
          {item.action && <ToastAction className="h-7 shrink-0 cursor-pointer rounded-md bg-white/12 px-2.5 text-caption font-medium text-paper hover:bg-white/20" />}
          <ToastClose aria-label="Dismiss" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-paper/50 hover:bg-white/10 hover:text-paper">
            <XIcon className="size-3.5" />
          </ToastClose>
        </Toast>
      )}
    </ToastRegion>
  )
}

export default function App({ initialView }: { initialView?: View }) {
  return (
    <StoreProvider initialView={initialView}>
      <Frame guide={!initialView}>
        <Shell>
          <Screen />
        </Shell>
      </Frame>
      <RuleFlow />
      {!initialView && <GuideIntro />}
      <Toasts />
    </StoreProvider>
  )
}
