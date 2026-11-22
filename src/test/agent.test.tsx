import { act, render, screen } from "@testing-library/react"
import { createAgent } from "@ui-sdk/react/agent"
import { expect, test } from "vitest"
import App from "@/App"

let approve = false
const agent = createAgent({ allow: (step) => !step.confirm || approve })

test("an agent can find every control on the review screen and resolve a flag", async () => {
  render(<App initialView="review" />)

  const entries = agent.snapshot().filter((e) => !e.offPage && e.component !== "more")
  for (const entry of entries) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy()
  }
  const labels = entries.map((e) => e.label)
  for (const label of ["Flags on this screen", "Fix to match", "Allow here", "Make it a rule", "Report a wrong flag", "Inspector", "Resize inspector"]) {
    expect(labels.some((l) => l?.includes(label)), `${label} is missing from the snapshot`).toBe(true)
  }

  const result = await act(() =>
    agent.act({
      steps: [
        { ref: "Flags on this screen", action: "setValue", args: ["Color isn't in your palette"] },
        { ref: "Fix to match", action: "press" },
      ],
    })
  )
  expect(result.ok, result.error?.message).toBe(true)
  expect(screen.getByRole("option", { name: /Color isn't in your palette/ }).textContent).toContain("Fix sent")
})

test("publishing a rule needs a person's approval", async () => {
  render(<App initialView="review" />)

  const setup = await act(() =>
    agent.act({
      steps: [
        { ref: "Make it a rule", action: "press" },
        { ref: "Why this is the right call", action: "setValue", args: ["The pill marks the one action that charges the customer."] },
        { ref: "Review impact", action: "press" },
      ],
    })
  )
  expect(setup.ok, setup.error?.message).toBe(true)

  const publish = { steps: [{ ref: "Approve and publish v15", action: "press" }] }
  const refused = await act(() => agent.act(publish))
  expect(refused.ok).toBe(false)

  approve = true
  const allowed = await act(() => agent.act(publish))
  expect(allowed.ok, allowed.error?.message).toBe(true)
  expect(await screen.findByText("Sending your rule to every tool")).toBeTruthy()
})
