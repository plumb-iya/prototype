# Plumb prototype · UI SDK version

Second iteration of the Plumb desktop prototype, built on **Vercel's UI SDK** (`@ui-sdk/react` and `@ui-sdk/core`, beta) with **Tailwind CSS v4**. Same scenario and mock data as the shadcn version, with a more app-like interface.

Everything is mock data. No real AI or tool connections.

## Run it

```bash
npm install
npm run dev      # app
npm test         # agent tests (Vitest + jsdom)
```

Desktop only, 1180px wide or more.

## Contributing

This is a group project, so everyone works from the same rules: the stack (UI SDK, Tailwind v4, React 19), the design rules from our FP1 deck, copy style, and what the tests check. They're in **[CLAUDE.md](./CLAUDE.md)**. Claude Code reads that file automatically, and `AGENTS.md` points other AI tools (Cursor, Codex, Copilot) to it.

Before pushing, run `npm run build`, `npm test` and `npm run lint`.

## What's different from the shadcn version

| | shadcn version | UI SDK version |
|---|---|---|
| Navigation | Labeled sidebar | Labeled sidebar that folds to an icon rail on Review (⌘\\ / Ctrl+\\), a toolbar on every screen |
| Finding things | Click through pages | ⌘K / Ctrl+K command palette (also runs flag actions and facilitator tools) |
| Screen review | Fixed two columns | Resizable canvas and inspector, with tabs |
| Flag list | Buttons | Listbox: arrow keys move between flags, pins and list stay in sync |
| Make it a rule | Three separate pages | One stepped dialog: define, impact, publish |
| History | List of cards | Timeline component, with an alert dialog for reverting |
| Reconnect | Fake spinner | Button's built-in pending state |
| Testing panel | Hidden panel (backtick key) | Facilitator commands in ⌘K |
| AI agents | Not supported | An agent can operate the UI; publishing and reverting need a person's approval |

## Walkthrough mode (for the class)

The app runs in a window on a desk. Everything that belongs to the study sits on the desk above the window, not in the app: on first load a welcome screen sets up the scenario, and a walkthrough capsule shows the next of six steps, ticking them off as people go. "Explore on my own" skips it; the capsule's close button or ⌘K › Hide walkthrough turns it off for usability tests. On screens under 1024px wide, a notice suggests a laptop first.

## Using it in testing

- **⌘K / Ctrl+K** opens the command palette. Under "Facilitator" you can **Send a new flag** mid-session (Wizard of Oz) or **Reset demo** between participants.
- Each view has a URL: `#inbox`, `#review`, `#rules`, `#history`, `#tools`.
- Suggested task: "A teammate shipped a new checkout screen. Review it and decide what to do about each issue."

## The core flow (Week 9 interaction loop)

| Step | Where |
|---|---|
| 01 Trigger | Inbox: new Lovable screen with 4 flags |
| 02 Context | Review › "What Plumb compared" tab |
| 03 Interpret | Pins on the canvas and the flag list with confidence |
| 04 Propose | Flag detail: your rule vs. this screen, why, three choices |
| 05 Decide | Make it a rule › Define (reason is required) |
| 06 Act | Make it a rule › Impact (explicit approval) › Publish (progress) |
| 07 Recover | Flag 4 › Report a wrong flag; undo on every toast; revert in History |

## Agent-ready

UI SDK lets an AI agent read and operate the interface through the same components a person uses (`src/agent.ts`). In a browser that supports WebMCP, an agent can review flags and draft rules; anything marked `data-agent-confirm` (publishing a rule, reverting the system) asks the person first. `src/test/agent.test.tsx` proves both.

## Stack

- React 19, Vite, TypeScript
- `@ui-sdk/react` + `@ui-sdk/core` (headless behaviors: focus, keyboard, ARIA, popups)
- Tailwind CSS v4 for all styling. `src/components/ui.tsx` holds the styled wrappers, `src/index.css` the Plumb tokens and the toast stack CSS
- Fonts: Space Grotesk, Inter, IBM Plex Mono (Fontsource)

UI SDK ships its docs inside the package: start at `node_modules/@ui-sdk/react/docs/llms.txt`.

## Where things live

```
src/
  data.ts                    mock screens, flags, rules, versions, tools
  store.tsx                  app state and URL sync
  actions.ts                 fix / allow / dismiss with undo toasts
  agent.ts                   agent bridge and WebMCP registration
  components/
    ui.tsx                   styled wrappers over UI SDK parts
    frame.tsx                desk, app window, prototype strip with the walkthrough
    shell.tsx                sidebar (folds to a rail), toolbar, page layout
    command-palette.tsx      ⌘K
    rule-flow.tsx            stepped "Make it a rule" dialog
    checkout-mock.tsx        the screen being reviewed
  screens/
    inbox.tsx  review.tsx  library.tsx (rules, history, tools)
  test/
    agent.test.tsx  setup.ts
```
