# React Development Guidelines

Standards for React 19 / Next.js (App Router) work in this project. This doc holds only
what a model can't infer: our conventions and the choices we've made. General React/Next.js
knowledge is deliberately absent — the model already has it. Principles (DRY/KISS/SOLID
with judgment) live in [AGENTS.md](../AGENTS.md), not here.

## Folder structure

Prefer folders over loose modules; keep children and tests local to the component.

```
ComponentName/
├── index.tsx          # main component
├── index.test.tsx     # Vitest tests
├── types.ts           # component-specific types
└── components/        # nested children
    └── ChildComponent/
        └── index.tsx
```

This keeps boundaries clear and makes search predictable.

## Import order (enforced by ESLint)

1. Libraries (`react`, `next/*`)
2. Aliased helpers/types (`@/lib/*`, `@/types/*`)
3. Local modules (`./components/Child`)
4. Assets (images, SVGs, fonts)
5. Styles (Tailwind classes inline — no style imports)

## Project conventions

- Function declarations for components; typed props; no `any`.
- Derive state during render instead of syncing it in `useEffect`; don't store what you
  can compute.
- No barrel imports — direct paths keep bundles lean.
- `Promise.all()` for independent async work — never sequential `await`s.
- `next/dynamic` for heavy components not needed on first paint.
- **React Compiler is enabled:** skip manual `useMemo`/`useCallback` unless profiling
  proves a need.
- Treat server actions as public endpoints: authenticate them.
