import * as React from "react"
import {
  initialIssues,
  initialRules,
  initialTools,
  initialVersions,
  type Issue,
  type IssueStatus,
  type Rule,
  type Tool,
  type ToolId,
  type Version,
} from "@/data"

export type View = "inbox" | "review" | "rules" | "history" | "tools"
export const VIEWS: View[] = ["inbox", "review", "rules", "history", "tools"]

export type FlowStep = "define" | "impact" | "publish"
export interface RuleFlow {
  issueId: string
  step: FlowStep
  name: string
  why: string
  scope: "checkout" | "everywhere"
  published?: boolean
  open: boolean
}

interface State {
  view: View
  screenId: string
  selectedIssueId: string | null
  issues: Issue[]
  rules: Rule[]
  versions: Version[]
  tools: Tool[]
  flow: RuleFlow | null
  modal: "allow" | "wrong" | null
  systemVersion: number
  guide: { visible: boolean; intro: boolean; usedPalette: boolean; sawHistory: boolean }
}

type Action =
  | { type: "go"; view: View }
  | { type: "openScreen"; screenId: string; issueId?: string | null }
  | { type: "select"; issueId: string | null }
  | { type: "setStatus"; issueId: string; status: IssueStatus }
  | { type: "startFlow"; issueId: string }
  | { type: "updateFlow"; patch: Partial<RuleFlow> }
  | { type: "closeFlow" }
  | { type: "publish" }
  | { type: "revert"; toVersion: number }
  | { type: "setTool"; id: ToolId; connected: boolean }
  | { type: "inject" }
  | { type: "modal"; modal: "allow" | "wrong" | null }
  | { type: "guide"; patch: Partial<State["guide"]> }
  | { type: "reset" }

const FLOW_NAMES: Record<string, string> = {
  pill: "Checkout pay button uses a pill shape",
  blue: "Add #1A6FE3 to the palette",
  primary: "Checkout can show two primary buttons",
  heading: "Headings can use 44px",
  "settings-toggle": "Toggles can use green when on",
}

const initialState: State = {
  view: "inbox",
  screenId: "checkout",
  selectedIssueId: "pill",
  issues: initialIssues,
  rules: initialRules,
  versions: initialVersions,
  tools: initialTools,
  flow: null,
  modal: null,
  systemVersion: 14,
  guide: { visible: true, intro: true, usedPalette: false, sawHistory: false },
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "go":
      return {
        ...state,
        view: action.view,
        guide: action.view === "history" && state.issues.some((i) => i.status === "promoted") ? { ...state.guide, sawHistory: true } : state.guide,
      }
    case "openScreen":
      return {
        ...state,
        view: "review",
        screenId: action.screenId,
        selectedIssueId:
          action.issueId === undefined
            ? state.issues.find((i) => i.screenId === action.screenId && i.status === "open")?.id ?? null
            : action.issueId,
      }
    case "select":
      return { ...state, selectedIssueId: action.issueId }
    case "setStatus":
      return { ...state, issues: state.issues.map((i) => (i.id === action.issueId ? { ...i, status: action.status } : i)) }
    case "startFlow":
      return {
        ...state,
        flow:
          state.flow?.issueId === action.issueId
            ? { ...state.flow, step: "define", open: true }
            : { issueId: action.issueId, step: "define", name: FLOW_NAMES[action.issueId] ?? "New rule", why: "", scope: "checkout", open: true },
      }
    case "updateFlow":
      return state.flow ? { ...state, flow: { ...state.flow, ...action.patch } } : state
    case "closeFlow":
      return { ...state, flow: !state.flow || state.flow.step === "publish" ? null : { ...state.flow, step: "define", open: false } }
    case "publish": {
      const f = state.flow
      if (!f) return state
      const v = state.systemVersion + 1
      const scope = f.scope === "checkout" ? "Checkout" : "Everywhere"
      const rule: Rule = {
        id: `rule-v${v}`,
        name: f.name,
        category: "Shape",
        value: f.issueId === "pill" ? "Pill radius on the pay button" : state.issues.find((i) => i.id === f.issueId)?.found ?? "",
        why: f.why,
        scope,
        version: v,
        author: "Amber",
        isNew: true,
      }
      const version: Version = {
        version: v,
        summary: `Added rule: ${f.name}`,
        author: "Amber",
        when: "Just now",
        diff: [
          { kind: "same", text: "radius.control: 8px" },
          { kind: "add", text: f.issueId === "pill" ? `radius.pay-button: pill  # ${scope.toLowerCase()}` : `rule: ${f.name}  # ${scope.toLowerCase()}` },
          { kind: "add", text: `why: ${f.why}` },
        ],
      }
      return {
        ...state,
        systemVersion: v,
        rules: [rule, ...state.rules.map((r) => ({ ...r, isNew: false }))],
        versions: [version, ...state.versions],
        issues: state.issues.map((i) => (i.id === f.issueId ? { ...i, status: "promoted" } : i)),
      }
    }
    case "revert": {
      const gone = state.rules.filter((r) => r.version > action.toVersion).map((r) => r.id)
      return {
        ...state,
        systemVersion: action.toVersion,
        versions: state.versions.filter((v) => v.version <= action.toVersion),
        rules: state.rules.filter((r) => !gone.includes(r.id)),
        issues: state.issues.map((i) => (i.status === "promoted" ? { ...i, status: "open" } : i)),
        flow: null,
      }
    }
    case "setTool":
      return { ...state, tools: state.tools.map((t) => (t.id === action.id ? { ...t, connected: action.connected, lastSync: "Just now" } : t)) }
    case "inject": {
      if (state.issues.some((i) => i.id === "settings-spacing")) return state
      return {
        ...state,
        issues: [
          ...state.issues,
          {
            id: "settings-spacing",
            screenId: "settings",
            title: "Spacing off the 4px grid",
            ruleId: "shape-radius",
            ruleText: "Spacing uses the 4px grid",
            found: "Form rows are 18px apart",
            why: "18px isn't on the 4px grid. The nearest steps are 16px and 20px.",
            confidence: "medium",
            pin: { x: 40, y: 60 },
            status: "open",
            expected: "color",
          },
        ],
      }
    }
    case "modal":
      return { ...state, modal: action.modal }
    case "guide":
      return { ...state, guide: { ...state.guide, ...action.patch } }
    case "reset":
      return { ...initialState, guide: { ...initialState.guide, visible: state.guide.visible, intro: false } }
  }
}

const Ctx = React.createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children, initialView }: { children: React.ReactNode; initialView?: View }) {
  const [state, dispatch] = React.useReducer(reducer, initialState, (s) => {
    const hash = (typeof window !== "undefined" ? window.location.hash.replace(/^#\/?/, "") : "") as View
    return { ...s, view: initialView ?? (VIEWS.includes(hash) ? hash : s.view), guide: { ...s.guide, intro: !initialView } }
  })

  React.useEffect(() => {
    const next = `#${state.view}`
    if (window.location.hash !== next) window.history.replaceState(null, "", next)
  }, [state.view])

  React.useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "") as View
      if (VIEWS.includes(hash)) dispatch({ type: "go", view: hash })
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}
