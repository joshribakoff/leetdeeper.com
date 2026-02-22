# Mutation Testing

**What:** Verify each test catches its target regression by inserting a bug, confirming the test fails, then reverting.

**CRITICAL: Commit clean before starting.** Never run mutation testing with uncommitted changes — you risk accidentally committing bugs.

## Process

1. `git stash` or commit all work
2. For each test, identify what source code mutation would break it
3. Insert the mutation
4. Run the relevant test (see `system-tests.md` or `user-tests.md` for how)
5. Confirm it fails
6. Revert the mutation
7. Verify `git diff --stat` shows nothing (no leftover mutations)

## MUTANT Marker Pattern

**Always mark mutations with `MUTANT` in ALL CAPS** so they're impossible to miss:

```html
<!-- MUTANT: removed difficulty badge -->
```
```tsx
{/* MUTANT: removed Run Tests button */}
```
```ts
localStorage.getItem('MUTANT:wrong-key')
```

This ensures:
- `git diff` immediately shows the mutation
- `grep -r MUTANT src/ tests/` finds any forgotten mutations
- You never lose track of what was changed

## After mutation testing

Run `grep -r MUTANT src/ tests/` to verify zero leftover mutations.

## Mutation Map

| Test | Mutation | File |
|------|----------|------|
| lists all challenges | Replace challenge title with `MUTANT` | `src/pages/index.astro` |
| shows difficulty badges | Remove difficulty span | `src/pages/index.astro` |
| navigates to challenge | Break href to `/broken/` | `src/pages/index.astro` |
| renders challenge content | Remove "All Challenges" link | `src/pages/challenge/[slug].astro` |
| Monaco editor loads | Remove `data-testid="editor"` | `src/components/ChallengeWorkspace.tsx` |
| Run Tests button visible | Remove button element | `src/components/ChallengeWorkspace.tsx` |
| running tests shows results | Break worker message handler | `src/components/ChallengeWorkspace.tsx` |
| editor theme syncs | Hardcode `theme="vs-dark"` | `src/components/ChallengeWorkspace.tsx` |
| prev/next navigation | Remove next link | `src/pages/challenge/[slug].astro` |
| completion state shows | Wrong localStorage key | `src/pages/index.astro` |
| all pages return 200 | Remove a challenge from content | `src/content/challenges/` |
