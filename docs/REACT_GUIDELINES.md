# React Development Guidelines

Standards for React 19 / Next.js (App Router) work in this project.

## Core philosophy

**DRY, KISS and SOLID — held with judgment, not dogma.** I avoid premature
abstraction: a wrong abstraction costs more than a little duplication, so I let a
pattern prove itself before extracting it. I apply SOLID's *spirit* — single
responsibility, composition over inheritance — rather than its OOP-era ceremony.
The goal is clarity and changeability, not acronym compliance.

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

## Component template

```tsx
// 1. Library imports
import { useState } from "react";

// 2. Local imports
import { formatPrice } from "@/lib/format";
import type { Product } from "./types";

// 3. Component — function declaration, typed props, no `any`
export default function ProductCard({ product }: { product: Product }) {
  // derive during render; don't store computed values in state
  const price = formatPrice(product.cents);
  return <article>{price}</article>;
}
```

## Performance rules

- `Promise.all()` for independent async work — never sequential `await`s.
- No barrel imports — import direct paths to keep bundles lean.
- `next/dynamic` for heavy components not needed on first paint.
- With the React Compiler enabled, skip manual `useMemo`/`useCallback` unless
  profiling proves a need.
- Derive state during render instead of syncing it in `useEffect`.

## Server vs client (App Router)

- Components render on the server by default; add `"use client"` only when you
  need client hooks or browser APIs.
- Never touch `window`/`document`/`localStorage` during init — use `useEffect`.
- Treat server actions as public endpoints: authenticate them.
