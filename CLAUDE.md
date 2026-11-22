# Plumb prototype: rules for working in this repo

Plumb is a desktop app prototype for IDSN 523 (USC). It catches drift between a team's design system and AI-generated screens. Everything is mock data: no real AI, no real tool connections, no backend. This file is for teammates and for AI coding tools (Claude Code reads it automatically; `AGENTS.md` points other tools here). Read it before changing anything.

## Stack

| Layer | What we use | Notes |
|---|---|---|
| UI framework | React 19 + TypeScript (strict) | Function components and hooks only |
| Build | Vite | `@/` is an alias for `src/` |
| Components | `@ui-sdk/react` + `@ui-sdk/core` (Vercel UI SDK, beta) | Headless: behavior, focus, keyboard and ARIA. No styles of its own |
| Styling | Tailwind CSS v4 | Configured in CSS (`src/index.css`), not in a JS config file |
| Icons | `lucide-react` | |
| Fonts | Fontsource, bundled (no Google Fonts) | Geist, Geist Mono (variable) |
| Tests | Vitest + jsdom + Testing Library | `src/test/` |
| Lint | oxlint | `.oxlintrc.json` |

Do not add another component library (shadcn, Radix, MUI, Headless UI, Chakra) or a CSS-in-JS library. If UI SDK has the component, use it. If it doesn't, build it from UI SDK parts or plain elements, styled with Tailwind.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build
npm test          # agent tests
npm run lint      # oxlint
```

Before you push: `npm run build`, `npm test` and `npm run lint` must all pass. Lint currently reports 12 warnings that were already there; don't add new ones.

The app is built for desktop (1180px and wider), with a phone layout below 768px: a bottom tab bar instead of the sidebar (on every view, Review included), and Review stacks the canvas above the inspector. Use `max-md:` classes for phone-only styles and `useIsMobile()` from `src/lib/use-mobile.ts` when the markup itself has to change. Check changes at 1440×900, at 1280×720 (a small laptop) and at 375×812 (a phone).

## Where things live

```
src/
  data.ts                 all mock data: screens, flags, rules, versions, tools, people
  store.tsx               app state (one reducer), views, URL hash sync
  actions.ts              fix / allow / dismiss, with undo toasts
  agent.ts                lets an AI agent operate the UI (WebMCP)
  index.css               design tokens, type scale, utilities, toast CSS
  lib/utils.ts            cn() for merging class names
  components/
    ui.tsx                our styled wrappers over UI SDK: Button, Badge, Hint, Modal, Segmented, EmptyState, input/menu classes
    brand.tsx             PlumbMark, PlumbTile, ToolTile
    frame.tsx             the desk, app window and prototype strip (walkthrough)
    shell.tsx             sidebar (folds to a rail on Review), toolbar, Page layout
    guide.tsx             walkthrough steps and the welcome dialog
    command-palette.tsx   ⌘K, including facilitator tools
    rule-flow.tsx         the "Make it a rule" dialog
    checkout-mock.tsx     the customer screen being reviewed
  screens/
    inbox.tsx  review.tsx  review-modals.tsx  library.tsx (Rules, History, Tools)
  test/
    agent.test.tsx  setup.ts
```

## UI SDK

- Import each component from its own path: `import { Dialog, DialogContent } from "@ui-sdk/react/dialog"`.
- The docs ship inside the package. Read them before using a component you haven't used here: start at `node_modules/@ui-sdk/react/docs/llms.txt`, then `docs/components/<name>.md` (for example `docs/components/listbox.md`). Styling guidance is in `docs/styling-and-animation.md`.
- Style states with the data attributes UI SDK sets, through Tailwind variants: `data-selected:`, `data-highlighted:`, `data-open:`, `data-disabled:`, `data-pending:`, and `data-starting-style:` / `data-ending-style:` for enter and exit animations.
- Use the wrappers in `src/components/ui.tsx` first (`Button`, `buttonClass`, `Badge`, `Hint`, `Modal`, `Segmented`, `EmptyState`, `inputClass`, `menuContent`, `menuItem`). Add to that file rather than restyling the same UI SDK part in several screens.
- Toasts: call `toast()` from `@ui-sdk/react/toast`. Don't position toasts yourself: the shell sets where they go, and they hide while a dialog is open.

## Tailwind v4

- There is no `tailwind.config.js`. Tokens live in `src/index.css` under `:root` and `@theme`.
- Use tokens, never raw hex values or arbitrary colors, in app code.
  - Colors: `paper`, `paper-2`, `surface`, `ink`, `ink-2`, `muted`, `faint`, `line`, `line-strong`, `edge`, `drift`, `drift-soft`, `drift-ink`, `ok`, `ok-soft`, `desk`.
  - Type scale: `text-micro` (11), `text-small` (12), `text-caption` (12.5), `text-ui` (13.5, the default), `text-body` (14.5), `text-heading` (16), `text-title` (20), `text-display` (28). Don't use arbitrary sizes like `text-[13px]`.
  - Surfaces: draw panels with `shadow-hairline`, `shadow-panel` or `shadow-panel-lift`, not borders. Popovers use `shadow-pop`.
  - Utilities: `section-label` (mono, uppercase label), `kicker` (the same in dark coral, for "Drift detected" lines), `canvas-grid` (dotted canvas).
- Merge class names with `cn()` from `@/lib/utils`. **If you add a new `--text-*` size to `index.css`, also add its name to the list in `src/lib/utils.ts`.** Otherwise `cn()` mistakes it for a color and silently drops the real color class (this once made a primary button's label invisible).

## Design rules

These come from our FP1 deck (Nov 18). Keep the prototype matching it.

- **Paper, black and white, plus one accent.** Coral (`drift`) means drift and nothing else: the pins on the canvas, the "Drift detected" kicker, open-flag dots. Don't use it for buttons, links or decoration. Green (`ok`) is only for resolved or healthy states.
- **Type:** Geist for headings (`font-display`) and the interface, Geist Mono (`font-mono`, `section-label`) for system data: file paths, versions, counts, labels.
- **One primary (black) button per view.** Plumb's own design-system rule; the prototype follows it too.
- **Status is a dot plus words**, not a filled pill (`<Badge tone="…" dot>`).
- **Decisions stay neutral.** On Review, "Fix to match", "Allow here" and "Make it a rule" look the same on purpose, so we don't nudge test participants toward one.
- **The checkout screen is the customer's design, not ours.** `checkout-mock.tsx` keeps its own colors (`brand`, `off-brand`) and font sizes. Don't apply Plumb tokens or the type scale there.
- **The logo** is the coral plumb line and round bob from the title slide. Use `PlumbMark` or `PlumbTile` from `brand.tsx`; don't redraw it.
- **Motion** is short and purposeful. Anything that moves must respect `prefers-reduced-motion` (see the sweep and toast CSS in `index.css`).
- **Study scaffolding stays outside the app.** The welcome dialog and the walkthrough live on the desk (`frame.tsx`) above the app window. Facilitator tools live in ⌘K so participants don't see them. Don't add study-only controls inside the app's screens.

## Copy

- Plain, short sentences in sentence case. Say what happens ("Send Lovable a fix that follows your rule"), not system jargon.
- No em dashes in UI text or docs. Use a comma, a colon, parentheses or two sentences.
- The scenario's names are fixed: Amber (our designer, the user), Jordan (the teammate who built Checkout in Lovable), Acme Commerce (the design system). Keep them consistent with the deck.
- All mock content lives in `src/data.ts`. Don't hard-code data in screens.

## State and navigation

- One reducer in `store.tsx`. Read state with `useStore()` and change it with `dispatch({ type: … })`; add a new action to the reducer rather than keeping app state in a component.
- Each view has a URL hash: `#inbox`, `#review`, `#rules`, `#history`, `#tools`. To add a view, add it to `View` and `VIEWS` in `store.tsx`, and to `NAV` and `TITLES` in `shell.tsx`.
- Fix, allow and dismiss go through `useIssueActions()` in `actions.ts`, so every change gets an undo toast.

## Accessibility and the agent tests

The prototype is "agent-ready": an AI agent can operate it through the same controls a person uses. `src/test/agent.test.tsx` checks this, and it fails if you break these rules:

- **Every interactive control needs an accessible name**: visible text, `aria-label`, or a `<label>`. Icon-only buttons always get `aria-label`.
- **Don't rename these controls** without updating the test: "Flags on this screen", "Fix to match", "Allow here", "Make it a rule", "Report a wrong flag", "Inspector", "Resize inspector", "Why this is the right call", "Review impact", "Approve and publish v15".
- Anything that can't easily be undone and affects other people (publishing a rule, reverting the system) gets `data-agent-confirm="what it does"`, so an agent must ask a person first.
- Decorative or study-only regions get `data-agent-hidden`.
- Keep keyboard support: UI SDK handles it if you use its components, so don't replace them with plain `div`s with click handlers.

## Housekeeping

- `_before-restyle/` and `_before-design-review/` are backups from the design passes. They're ignored by git and can be deleted.
- Don't commit `node_modules/` or `dist/`.
