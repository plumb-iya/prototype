// Mock data for the Plumb prototype. Everything here is illustrative.

export type ToolId = "claude" | "lovable" | "replit" | "figma"
export type Confidence = "high" | "medium" | "low"
export type IssueStatus = "open" | "fixed" | "allowed" | "promoted" | "wrong"

export interface Tool {
  id: ToolId
  name: string
  connected: boolean
  lastSync: string
}

export interface Issue {
  id: string
  screenId: string
  title: string
  ruleId: string
  ruleText: string
  found: string
  why: string
  confidence: Confidence
  pin: { x: number; y: number } // percent position on the screen preview
  status: IssueStatus
  expected: "radius" | "color" | "primary" | "heading"
}

export interface Screen {
  id: string
  name: string
  file: string
  tool: ToolId
  author: string
  receivedAgo: string
  elementsChecked: number
  state: "flagged" | "clean" | "error"
}

export interface Rule {
  id: string
  name: string
  category: "Color" | "Shape" | "Type" | "Components" | "Content"
  value: string
  why: string
  scope: string
  version: number
  author: string
  isNew?: boolean
}

export interface Version {
  version: number
  summary: string
  author: string
  when: string
  diff: { kind: "add" | "remove" | "same"; text: string }[]
}

export const SYSTEM_NAME = "Acme Commerce"

export const initialTools: Tool[] = [
  { id: "claude", name: "Claude", connected: true, lastSync: "2 min ago" },
  { id: "lovable", name: "Lovable", connected: true, lastSync: "2 min ago" },
  { id: "replit", name: "Replit", connected: false, lastSync: "3 days ago" },
  { id: "figma", name: "Figma", connected: true, lastSync: "1 hr ago" },
]

export const screens: Screen[] = [
  { id: "checkout", name: "Checkout", file: "src/pages/Checkout.tsx", tool: "lovable", author: "Jordan", receivedAgo: "2 min ago", elementsChecked: 42, state: "flagged" },
  { id: "settings", name: "Account settings", file: "app/settings/page.tsx", tool: "claude", author: "Sam", receivedAgo: "1 hr ago", elementsChecked: 61, state: "flagged" },
  { id: "pricing", name: "Pricing", file: "app/pricing/page.tsx", tool: "claude", author: "Sam", receivedAgo: "3 hr ago", elementsChecked: 38, state: "clean" },
  { id: "onboarding", name: "Onboarding", file: "client/Onboarding.jsx", tool: "replit", author: "Priya", receivedAgo: "yesterday", elementsChecked: 0, state: "error" },
]

export const initialIssues: Issue[] = [
  {
    id: "pill",
    screenId: "checkout",
    title: "Pill-shaped primary button",
    ruleId: "shape-radius",
    ruleText: "Buttons use an 8px corner radius",
    found: "Pay button uses a full pill radius (999px)",
    why: "Your system says buttons use 8px corners so they read as one family. This one is a full pill, and it doesn't match any other button on the screen.",
    confidence: "high",
    pin: { x: 95, y: 83 },
    status: "open",
    expected: "radius",
  },
  {
    id: "blue",
    screenId: "checkout",
    title: "Color isn't in your palette",
    ruleId: "color-primary",
    ruleText: "Primary actions use Brand 600 (#404DD1)",
    found: "Two buttons use #1A6FE3, which isn't in the palette",
    why: "The nearest palette color is Brand 600. #1A6FE3 looks like a framework default, which usually means the tool didn't read your tokens.",
    confidence: "high",
    pin: { x: 5, y: 83 },
    status: "open",
    expected: "color",
  },
  {
    id: "primary",
    screenId: "checkout",
    title: "Second primary button",
    ruleId: "comp-one-primary",
    ruleText: "One primary button per view",
    found: "“Apply coupon” and “Pay” are both primary",
    why: "Two primary buttons compete for attention. Your rule keeps one clear next step per view. “Apply coupon” is usually a secondary action.",
    confidence: "medium",
    pin: { x: 39.5, y: 57 },
    status: "open",
    expected: "primary",
  },
  {
    id: "heading",
    screenId: "checkout",
    title: "Heading size is off the type scale",
    ruleId: "type-scale",
    ruleText: "Headings use the type scale (24, 32, 40)",
    found: "“Checkout” is set at 44px",
    why: "44px isn't on the scale this check used. The nearest step is 40px. Confidence is low because the scale was edited recently.",
    confidence: "low",
    pin: { x: 49, y: 9 },
    status: "open",
    expected: "heading",
  },
  {
    id: "settings-toggle",
    screenId: "settings",
    title: "Toggle uses a custom track color",
    ruleId: "color-primary",
    ruleText: "Controls use Brand 600 when on",
    found: "Notification toggles use #10B981",
    why: "Green isn't in your control palette. Brand 600 is used for every other control.",
    confidence: "medium",
    pin: { x: 80, y: 40 },
    status: "open",
    expected: "color",
  },
]

export const initialRules: Rule[] = [
  { id: "color-primary", name: "Primary color", category: "Color", value: "Brand 600, #404DD1", why: "One accent keeps the next step obvious.", scope: "Everywhere", version: 9, author: "Amber" },
  { id: "shape-radius", name: "Corner radius", category: "Shape", value: "8px on buttons, inputs, cards", why: "Matching corners make controls read as one family.", scope: "Everywhere", version: 12, author: "Amber" },
  { id: "comp-one-primary", name: "One primary button per view", category: "Components", value: "Max 1 primary button", why: "Every view should have one clear next step.", scope: "Everywhere", version: 11, author: "Amber" },
  { id: "type-scale", name: "Type scale", category: "Type", value: "24, 32, 40, 44 (Display)", why: "Display 44 was added for marketing and checkout heroes.", scope: "Everywhere", version: 14, author: "Amber" },
  { id: "content-pay", name: "Payment button label", category: "Content", value: "“Pay $amount”", why: "Showing the amount reduces checkout drop-off.", scope: "Checkout", version: 6, author: "Amber" },
]

export const initialVersions: Version[] = [
  {
    version: 14,
    summary: "Added Display 44 to the type scale",
    author: "Amber",
    when: "6 days ago",
    diff: [
      { kind: "same", text: "type.scale: 24, 32, 40" },
      { kind: "add", text: "type.scale.display: 44" },
      { kind: "add", text: "why: Display 44 is for marketing and checkout heroes." },
    ],
  },
  {
    version: 13,
    summary: "Renamed Brand Blue to Brand 600",
    author: "Amber",
    when: "3 weeks ago",
    diff: [
      { kind: "remove", text: "color.brand-blue: #404DD1" },
      { kind: "add", text: "color.brand-600: #404DD1" },
    ],
  },
  {
    version: 12,
    summary: "Corner radius unified at 8px",
    author: "Amber",
    when: "1 month ago",
    diff: [
      { kind: "remove", text: "radius.button: 6px" },
      { kind: "remove", text: "radius.card: 12px" },
      { kind: "add", text: "radius.control: 8px" },
      { kind: "add", text: "why: Matching corners make controls read as one family." },
    ],
  },
]

export const impactComponents = [
  "CheckoutPayButton",
  "ExpressPayButton",
  "PaymentRetryButton",
  "PayPalConfirmButton",
  "ApplePayConfirmButton",
  "OrderSummaryCTA",
  "PrimaryButton",
  "SubscribeButton",
  "CartCheckoutButton",
  "GiftCardRedeemButton",
  "UpsellAddButton",
  "MobileStickyCheckout",
  "ReturnsStartButton",
  "CheckoutHeroCTA",
]

export const toolName = (id: ToolId) => initialTools.find((t) => t.id === id)?.name ?? id
