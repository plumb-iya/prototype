import { createAgent, registerTools } from "@ui-sdk/react/agent"

// Lets a browser agent (WebMCP) operate Plumb through the same components a person uses.
// Anything marked data-agent-confirm, like publishing or reverting, asks the person first.
export const agent = createAgent({
  allow: (step) => {
    if (!step.confirm) return true
    try {
      return window.confirm(`An AI agent wants to: ${step.confirm}. Allow it?`)
    } catch {
      return false
    }
  },
})

export function connectBrowserAgent() {
  return registerTools(agent, { allow: () => true })
}
