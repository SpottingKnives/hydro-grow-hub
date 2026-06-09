# Performance & Responsiveness Pass

The app loads every page, every Radix primitive, and every dialog up-front, and most pages call `useStore()` (subscribing to the entire state) — both hurt initial load and cause excess re-renders. Plan below.

## 1. Code-split routes (biggest win)
Convert `src/App.tsx` to use `React.lazy` + `Suspense` for all 7 pages. Dashboard ships as the initial chunk; Grows, Feeds, Environments, Tasks, Logs, NotFound load on navigation.

```text
Initial JS: ~1 chunk (Dashboard + shared)
Per-route:  separate chunks fetched on click
```

Add a lightweight `<Suspense fallback={<RouteSkeleton />} />`. Heavy detail dialogs (`FeedCalculatorDialog`, `LogParametersDialog`, `TaskFormDialog`, `EnvironmentFormDialog`, etc.) get lazy-loaded inside their parent pages so they don't ship until first open.

## 2. Manual chunk splitting in `vite.config.ts`
Add `build.rollupOptions.output.manualChunks` to split:
- `react-vendor` → react, react-dom, react-router-dom
- `radix` → all `@radix-ui/*`
- `charts` → recharts (only used in Dashboard)
- `forms` → react-hook-form, zod, @hookform/resolvers
- `date` → date-fns

Long-cache wins on repeat visits; smaller per-page payloads.

## 3. Zustand selector hygiene
Every page currently does `const { ...everything } = useStore()`, so any unrelated state change re-renders the whole page. Refactor to selector hooks:

```ts
const growCycles = useStore(s => s.growCycles);
const addGrowCycle = useStore(s => s.addGrowCycle);
```

Apply on the 6 page files + the 4 section components.

## 4. Memoize expensive derived data
Pages like `DashboardPage`, `GrowCycleDetailPage`, `LogsPage`, `FeedSchedulesPage` compute sorts/filters/joins inline on every render. Wrap them in `useMemo` keyed on the specific store slices they consume.

## 5. Strip unused dependencies
Audit and remove from `package.json` if truly unreferenced (verify via grep first):
- `embla-carousel-react`, `react-resizable-panels`, `vaul`, `input-otp`, `next-themes`, `cmdk`, `react-day-picker` (only if Calendar isn't used), `@radix-ui/react-menubar`, `react-navigation-menu`, `react-context-menu`, `react-hover-card`, `react-aspect-ratio`, `@tailwindcss/typography`

Whatever the audit confirms unused gets removed, plus delete the matching `src/components/ui/*.tsx` shadcn wrappers. Likely cuts 150-300KB minified.

## 6. Defer & shrink third-party UI
- Drop one of `Toaster` (shadcn) or `Sonner` — both are mounted in `App.tsx`. Sonner is already used for undo toasts; remove the shadcn toaster and its `use-toast` hook.
- Remove `@tanstack/react-query` provider if no queries exist (grep first; app is local-only Zustand).

## 7. Vite build tuning
- `build.target: 'es2020'` (smaller output than default `'modules'` for modern browsers)
- `build.cssCodeSplit: true` (default, just confirm)
- Enable `esbuild` minify (default), ensure `drop: ['console', 'debugger']` in production

## 8. Image / icon optimization
- `lucide-react` is tree-shakable but only when imported as `import { Icon } from "lucide-react"` (current pattern is correct — verify).
- No bundled images in `src/assets/` to compress (the dir is empty), so skip image work this pass.

## Out of scope
- Backend/RLS changes — none needed.
- New features.
- Visual redesign.

## Technical Section

Files touched:
- `src/App.tsx` — lazy routes + Suspense
- `vite.config.ts` — manualChunks, build.target
- `src/store/useStore.ts` — no logic change, but document selector pattern in JSDoc
- All 7 `src/pages/*.tsx` — switch to `useStore(selector)` + `useMemo`
- `src/components/{Nutrients,Strains,Parameters}Section.tsx` — same selector refactor
- `src/components/*FormDialog.tsx` (5 files) — wrap in `lazy()` at import sites
- `package.json` — prune confirmed-unused deps + matching `src/components/ui/*` wrappers
- `src/main.tsx` / `App.tsx` — remove unused providers

Verification:
- `bun run build` → check chunk sizes before/after
- `browser--performance_profile` to confirm LCP/INP improvement
- `bun run test` to confirm no regressions

## Estimated impact
- Initial JS: ~40-55% smaller
- Re-render count on logging/feed actions: ~3-5× lower
- Time-to-interactive on cold load: noticeably faster, especially on mobile

Confirm and I'll implement in this order: (1) routes + chunks → quick win, (2) selectors + memo → responsiveness, (3) dep prune → size, (4) verify.
