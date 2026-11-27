import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import App from "@/App"
import { agent } from "@/agent"
import { getRuleProposal, initialIssues, initialRules } from "@/data"

const name = "Approved payment accent"
const reason = "Customers recognize this accent at payment."

function define(flag: number, ruleName: string, why: string) {
  render(<App initialView="review" />)
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Flag ${flag}:`) }))
  fireEvent.click(screen.getByRole("button", { name: "Make it a rule" }))
  const dialog = within(screen.getByRole("dialog"))
  fireEvent.input(dialog.getByRole("textbox", { name: "Rule name" }), { target: { value: ruleName } })
  fireEvent.input(dialog.getByRole("textbox", { name: "Why this is the right call" }), { target: { value: why } })
  return dialog
}

function navigate(page: string) {
  const nav = within(screen.getByRole("navigation", { name: "Main" }))
  fireEvent.click(nav.getByRole("button", { name: new RegExp(`^${page}`) }))
}

test.each([
  { flag: 2, category: "color", value: /#1A6FE3/i },
  { flag: 3, category: "component", value: /two primary|2 primary|primary[^\n]{0,24}\b2\b/i },
  { flag: 4, category: "type", value: /44/ },
])("the $category approval describes the selected change, not a button radius", ({ flag, value }) => {
  const dialog = define(flag, "Team decision", "This pattern works for our customers.")
  expect.soft(screen.getByRole("dialog").textContent).not.toMatch(/8px corners/)
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  // The draft title and reason deliberately do not contain the value under test.
  const approval = screen.getByRole("dialog").textContent
  expect(dialog.getByRole("group", { name: "Proposed rule changes" }).textContent).toMatch(value)
  expect(approval).toContain("Team decision")
  expect(approval).not.toMatch(/radius\.control|radius\.pay-button|8px corners/i)
  expect(approval).not.toMatch(/ExpressPayButton|PaymentRetryButton/)
})

test("the color flag does not borrow the shape rule's reach estimate", () => {
  render(<App initialView="review" />)
  fireEvent.click(screen.getByRole("button", { name: /^Flag 2:/ }))
  const details = screen.getByRole("region", { name: /Color isn't in your palette, details/ })
  expect(details.textContent).not.toMatch(/14 components in 3 projects/)
})

test("the untouched shape draft shows different permissions for the two scopes", () => {
  render(<App initialView="review" />)
  fireEvent.click(screen.getByRole("button", { name: "Make it a rule" }))
  const dialog = within(screen.getByRole("dialog"))
  const checkout = dialog.getByRole("radio", { name: /Checkout screens only/, checked: true })
  const everywhere = dialog.getByRole("radio", { name: /Everywhere/ })
  expect.soft(checkout.closest("label")?.textContent).toMatch(/pay buttons only/i)
  expect.soft(everywhere.closest("label")?.textContent).toMatch(/any primary button/i)
  expect((dialog.getByRole("textbox", { name: "Rule name" }) as HTMLInputElement).value).toBe("Pill-shaped button corners")
})

test.each([
  { scope: "Checkout", covered: /on a checkout, pay is covered/i, outside: /apply coupon is not/i },
  { scope: "Everywhere", covered: /a primary subscribe button is covered/i, outside: /secondary buttons, inputs and cards are not/i },
])("the $scope shape approval shows what is inside and outside the permission", ({ scope, covered, outside }) => {
  const dialog = define(1, "Team decision", reason)
  if (scope === "Everywhere") fireEvent.click(dialog.getByRole("radio", { name: /Everywhere/ }))
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  const text = screen.getByRole("dialog").textContent
  expect.soft(text).not.toContain("OrderSummaryCTA")
  expect.soft(text).toMatch(covered)
  expect.soft(text).toMatch(outside)
  fireEvent.click(dialog.getByRole("button", { name: "Back" }))
  expect((dialog.getByRole("textbox", { name: "Rule name" }) as HTMLInputElement).value).toBe("Team decision")
  expect((dialog.getByRole("textbox", { name: "Why this is the right call" }) as HTMLTextAreaElement).value).toBe(reason)
  expect(dialog.getByRole("radio", { checked: true, name: new RegExp(scope) })).toBeTruthy()
})

test.each([
  { scope: "Checkout", value: "Pay buttons may use a pill shape" },
  { scope: "Everywhere", value: "Primary buttons may use a pill shape" },
])("the agent asks for the $scope permission and target version before acting", async ({ scope, value }) => {
  const dialog = define(1, "Team decision", reason)
  if (scope === "Everywhere") fireEvent.click(dialog.getByRole("radio", { name: /Everywhere/ }))
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  try {
    const result = await act(() => agent.act({ steps: [{ ref: "Approve and publish v15", action: "press" }] }))
    expect(result.ok).toBe(false)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveBeenCalledWith(`An AI agent wants to: publish Acme Commerce v15 with this rule: ${value} (${scope}). Allow it?`)
    expect(dialog.getByRole("button", { name: "Approve and publish v15" })).toBeTruthy()
    fireEvent.click(dialog.getByRole("button", { name: "Back" }))
    fireEvent.click(dialog.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("option", { name: /Pill-shaped primary button/ }).textContent).not.toContain("Now a rule")
    navigate("Rules")
    expect(within(screen.getByRole("main")).queryByText("Team decision")).toBeNull()
    navigate("History")
    expect(screen.getByRole("region", { name: "Changes in v14" })).toBeTruthy()
  } finally {
    confirm.mockRestore()
  }
})

test("the Account settings fixture does not offer a rule proposal", () => {
  const flag = initialIssues.find((issue) => issue.id === "settings-toggle")!
  expect(getRuleProposal(flag, initialRules)).toBeNull()
})

test("a Checkout proposal still explains when there is no saved baseline rule", () => {
  const flag = initialIssues.find((issue) => issue.id === "heading")!
  const rulesAtV13 = initialRules.filter((rule) => rule.version <= 13)
  expect(getRuleProposal(flag, rulesAtV13)?.baseline).toBe("No matching rule is saved in this version.")
})

test("a missing reason and a cancelled preview do not change the system", () => {
  const dialog = define(2, name, "")
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  expect(dialog.getByRole("textbox", { name: "Why this is the right call" })).toBe(document.activeElement)
  expect(dialog.queryByRole("button", { name: /Approve and publish/ })).toBeNull()
  fireEvent.input(dialog.getByRole("textbox", { name: "Why this is the right call" }), { target: { value: reason } })
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  fireEvent.click(dialog.getByRole("button", { name: "Back" }))
  fireEvent.click(dialog.getByRole("button", { name: "Cancel" }))
  expect(screen.getByRole("option", { name: /Color isn't in your palette/ }).textContent).not.toContain("Now a rule")
  navigate("Rules")
  expect(within(screen.getByRole("main")).queryByText(reason)).toBeNull()
  navigate("History")
  expect(screen.getByRole("region", { name: "Changes in v14" })).toBeTruthy()
})

test.each([
  { flag: 1, category: "Shape", scope: "Checkout", value: "Pay buttons may use a pill shape" },
  { flag: 1, category: "Shape", scope: "Everywhere", value: "Primary buttons may use a pill shape" },
  { flag: 2, category: "Color", scope: "Checkout", value: "Primary actions may also use #1A6FE3" },
  { flag: 2, category: "Color", scope: "Everywhere", value: "Primary actions may also use #1A6FE3" },
  { flag: 3, category: "Components", scope: "Everywhere", value: "A view may have up to two primary buttons" },
  { flag: 4, category: "Type", scope: "Checkout", value: "Other headings may use 44px" },
])("publishing $category for $scope keeps the receipt, flag, rule and version in agreement", async ({ flag, category, scope, value }) => {
  const dialog = define(flag, name, reason)
  if (scope === "Everywhere") {
    fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
    fireEvent.click(dialog.getByRole("button", { name: "Back" }))
    fireEvent.click(dialog.getByRole("radio", { name: /Everywhere/ }))
  }
  fireEvent.click(dialog.getByRole("button", { name: "Review impact" }))
  const change = `${value} (${scope})`
  expect(dialog.getByRole("group", { name: "Proposed rule changes" }).textContent).toContain(change)
  fireEvent.click(dialog.getByRole("button", { name: "Approve and publish v15" }))
  const back = await dialog.findByRole("button", { name: "Back to Checkout" }, { timeout: 7000 })
  const details = dialog.getByRole("region", { name: "Publishing details" })
  const receipt = within(details)
  const permission = receipt.getByText(`${value}. Applies to ${scope === "Checkout" ? "checkout screens only" : "every screen"}. The flag is resolved.`)
  const title = receipt.getByText(name, { exact: true })
  expect(details.tabIndex).toBe(0)
  expect(permission.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  fireEvent.click(back)
  const flags = within(screen.getByRole("listbox", { name: "Flags on this screen" })).getAllByRole("option")
  expect(flags.map((option) => option.textContent.includes("Now a rule"))).toEqual(flags.map((_, index) => index === flag - 1))

  navigate("Rules")
  const main = within(screen.getByRole("main"))
  fireEvent.click(main.getByRole("radio", { name: new RegExp(`^${category}`) }))
  const ruleRow = main.getByText(reason).parentElement!
  for (const text of [name, value, scope]) expect(ruleRow.textContent).toContain(text)
  if (category !== "Shape") {
    fireEvent.click(main.getByRole("radio", { name: /^Shape/ }))
    expect(main.queryByText(name)).toBeNull()
  }

  navigate("History")
  const history = screen.getByRole("region", { name: "Changes in v15" }).textContent
  for (const text of [name, reason, change]) expect(history).toContain(text)
}, 12000)
