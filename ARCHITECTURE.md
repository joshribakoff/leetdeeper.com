# Architecture

## Overview

leetdeeper.com is a static Astro site with interactive React islands. Users solve coding challenges in a Monaco editor; a web worker transpiles and runs their code against a custom test harness.

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Astro + MDX | Static HTML for SEO, MDX for rich challenge descriptions |
| Interactivity | React islands (`client:only`) | Monaco + test runner need full client-side React |
| Editor | Monaco (self-hosted) | Full VS Code editing experience, no CDN dependency |
| TS transpilation | `typescript` compiler in web worker | Full fidelity, runs user code safely off-thread |
| Navigation | sailkit/compass `getNeighbors()` | Build-time prev/next from ordered course lists |
| Theming | sailkit/lantern `initScript` | Flash-free dark/light toggle via `data-theme` |
| E2E testing | Playwright | Automated verification of the full user experience |

## Content Model

```
src/content/
  courses/async-javascript.md    # frontmatter: title, challenges[] (ordered slugs)
  challenges/two-sum.mdx         # frontmatter: title, difficulty, course

src/challenges/
  two-sum/
    starter.ts                   # Starter code shown in editor
    tests.ts                     # Test code run against user's solution
```

- **Courses** define challenge order via a `challenges` array of slugs
- **Challenges** are MDX with frontmatter metadata; the description body is server-rendered for SEO
- **Starter/test code** are real `.ts` files (type-checked) imported as raw strings via Vite `?raw`
- Course ordering feeds into compass `getNeighbors()` for prev/next navigation

## Key Decisions

### Self-hosted Monaco (no CDN, no plugin)

Monaco workers are loaded via Vite's native `?worker` import syntax and configured through `MonacoEnvironment.getWorker()`. This avoids CDN dependencies and the `vite-plugin-monaco-editor` package, which adds complexity without benefit for our use case.

### TypeScript compiler in web worker

User code is transpiled with the full TypeScript compiler (`typescript` package) running inside a web worker. This provides:
- Full type system fidelity (no simplified parser)
- Off-main-thread execution (UI stays responsive)
- 5-second timeout protection against infinite loops

### Custom test harness (not Vitest)

Vitest can't run in a browser worker. Instead, a minimal ~80-line harness provides `describe()`, `test()`, `expect()` with matchers (`toBe`, `toEqual`, `toHaveLength`, `toThrow`, `.not`). Async tests are supported. Results are returned as `{ name, pass, error? }[]`.

### Server-rendered descriptions

Challenge descriptions are MDX rendered at build time into a `<template>` element. The React island reads the HTML from the DOM on mount. This gives:
- Full SEO (content in static HTML)
- No hydration mismatch (React reads pre-rendered HTML, doesn't re-render it)

### localStorage for state

Code edits, split position, and completion state persist in localStorage. No backend needed. Keys are namespaced: `leetdeeper:code:<slug>`, `leetdeeper:split`, `leetdeeper:completed`.

## Directory Structure

```
src/
  challenges/         # Starter + test code per challenge (real TS files)
  components/         # React components (ChallengeWorkspace)
  content/            # Astro content collections (courses, challenges)
  layouts/            # Astro layouts
  lib/                # Test harness, web worker, Monaco setup
  pages/              # Astro pages (index, challenge/[slug])
  styles/             # Global CSS with design tokens
tests/                # Playwright E2E tests (system tests)
```
