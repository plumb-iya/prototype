import * as React from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Textarea } from "@ui-sdk/react/textarea"
import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react/radio"
import { SparklesIcon } from "lucide-react"
import { Button, fieldLabel, Modal, textareaClass } from "@/components/ui"
import { useIssueActions } from "@/actions"
import { useStore } from "@/store"

export function AllowModal() {
  const { state, dispatch } = useStore()
  const actions = useIssueActions()
  const issueId = state.selectedIssueId
  return (
    <Modal
      open={state.modal === "allow"}
      onOpenChange={(o) => !o && dispatch({ type: "modal", modal: null })}
      title="Allow this on Checkout?"
      description="Your system doesn't change. Plumb stops flagging this on Checkout and still flags it everywhere else."
    >
      <Field className="flex flex-col gap-1.5">
        <FieldLabel className={fieldLabel}>Note for your team</FieldLabel>
        <Textarea className={textareaClass} placeholder="Seasonal promo, remove after the holiday sale" />
        <FieldDescription className="text-caption text-muted">Optional. Shown next to the exception.</FieldDescription>
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => dispatch({ type: "modal", modal: null })}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            dispatch({ type: "modal", modal: null })
            if (issueId) actions.allow(issueId)
          }}
        >
          Allow on Checkout
        </Button>
      </div>
    </Modal>
  )
}

export function WrongModal() {
  const { state, dispatch } = useStore()
  const actions = useIssueActions()
  const [reason, setReason] = React.useState<string | null>(null)
  const [tried, setTried] = React.useState(false)
  const open = state.modal === "wrong"
  const issueId = state.selectedIssueId
  React.useEffect(() => {
    if (open) {
      setReason(null)
      setTried(false)
    }
  }, [open])

  return (
    <Modal open={open} onOpenChange={(o) => !o && dispatch({ type: "modal", modal: null })} title="What did Plumb get wrong?" description="Your answer helps Plumb check better next time.">
      <Field invalid={tried && !reason} className="flex flex-col gap-2">
        <FieldLabel className={fieldLabel}>Reason</FieldLabel>
        <RadioGroup value={reason} onValueChange={(v) => setReason(v as string | null)} className="flex flex-col gap-1">
          {[
            ["system", "It's already in our system"],
            ["misread", "Plumb misread the screen"],
            ["other", "Something else"],
          ].map(([v, l]) => (
            <label key={v} className="-mx-2 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-paper">
              <Radio value={v} className="flex size-4 items-center justify-center rounded-full border border-edge bg-surface data-checked:border-ink data-checked:bg-ink">
                <RadioIndicator className="size-1.5 rounded-full bg-paper" />
              </Radio>
              {l}
            </label>
          ))}
        </RadioGroup>
        {tried && !reason && <FieldError match className="text-caption text-drift-ink">Pick a reason first.</FieldError>}
      </Field>

      {reason === "system" && issueId === "heading" && (
        <div className="mt-3 rounded-lg border border-line bg-paper/70 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-small font-medium text-muted"><SparklesIcon className="size-3.5" aria-hidden="true" /> Plumb</div>
          <p className="leading-relaxed">You're right. This check used v13 of your type scale. Display 44 was added in v14, so the heading is on scale. I'll re-check this screen with v14.</p>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => dispatch({ type: "modal", modal: null })}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            setTried(true)
            if (!reason || !issueId) return
            dispatch({ type: "modal", modal: null })
            actions.wrong(issueId)
          }}
        >
          Dismiss flag
        </Button>
      </div>
    </Modal>
  )
}
