import * as React from "react"
import { toast } from "@ui-sdk/react/toast"
import type { IssueStatus } from "@/data"
import { useStore } from "@/store"

export function useIssueActions() {
  const { state, dispatch } = useStore()

  const resolve = React.useCallback(
    (issueId: string, status: IssueStatus, title: string, description: string) => {
      dispatch({ type: "setStatus", issueId, status })
      const next = state.issues.find((i) => i.screenId === "checkout" && i.status === "open" && i.id !== issueId)
      dispatch({ type: "select", issueId: next?.id ?? issueId })
      toast(title, {
        description,
        action: { label: "Undo", onAction: () => dispatch({ type: "setStatus", issueId, status: "open" }) },
      })
    },
    [dispatch, state.issues]
  )

  return {
    fix: (issueId: string) => resolve(issueId, "fixed", "Fix sent to Lovable", "The preview shows the result. Jordan will see it on their next run."),
    allow: (issueId: string) => resolve(issueId, "allowed", "Allowed on Checkout", "Plumb won't flag this here again."),
    wrong: (issueId: string) =>
      resolve(
        issueId,
        "wrong",
        "Flag dismissed",
        issueId === "heading" ? "Plumb re-checked with v14. Display 44 is on your type scale." : "Plumb won't raise this flag again."
      ),
  }
}
