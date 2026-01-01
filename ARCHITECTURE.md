# Architecture

How this project builds a web framework from first principles.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  GET / ──────────────────────────────────────────────────►  │
│  ◄────────────────────────────────────────────── HTML page  │
│  POST /increment ────────────────────────────────────────►  │
│  ◄─────────────────────────────────────── 303 Redirect to / │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
│  ┌─────────────┐       ┌─────────────────────────────────┐  │
│  │   Worker    │──────►│       Durable Object            │  │
│  │ (Gateway)   │       │  ┌───────────┐  ┌────────────┐  │  │
│  └─────────────┘       │  │  State    │  │  Render    │  │  │
│                        │  │  Storage  │  │  TSX→HTML  │  │  │
│                        │  └───────────┘  └────────────┘  │  │
│                        └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: JSX Runtime

**File:** `src/jsx-runtime.ts` (~100 lines)

TypeScript compiles JSX syntax into function calls. We provide a custom `jsx()` function that renders directly to HTML strings.

### The Compilation

```tsx
// You write:
<div className="card">{title}</div>

// TypeScript compiles to:
jsx("div", { className: "card" }, title)
```

This is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "jsx"
  }
}
```

### The Runtime

```typescript
export function jsx(type, props, ...children): RawHtml {
  // Function component? Call it with props
  if (typeof type === "function") {
    return type({ ...props, children })
  }

  // HTML element? Build the string
  const attrStr = buildAttributes(props)
  const content = renderChildren(children)
  return raw(`<${type}${attrStr}>${content}</${type}>`)
}
```

### Key Concepts

| Concept                     | Implementation                              |
| --------------------------- | ------------------------------------------- |
| **RawHtml wrapper**         | Marks strings as already-rendered HTML      |
| **HTML escaping**           | Prevents XSS via `escapeHtml()`             |
| **Void elements**           | Self-closing tags like `<img>`, `<input>`   |
| **dangerouslySetInnerHTML** | Escape hatch for inline CSS/JS              |
| **Fragment support**        | `<>...</>` renders children without wrapper |

### What We Don't Have

- No virtual DOM
- No diffing algorithm
- No reconciliation
- No client-side hydration
- No component lifecycle

Just string concatenation with safety guards.

---

## Layer 2: Durable Object

**File:** `src/index.ts`

A Durable Object is a stateful serverless function. Each instance has:

- **Unique ID** - Addressable across the Cloudflare network
- **Persistent storage** - Key-value store that survives restarts
- **Single-threaded execution** - No race conditions

### Request Flow

```typescript
export class Counter extends DurableObject<Env> {
  async fetch(request: Request) {
    // 1. Load state from storage
    const count = await this.ctx.storage.get<number>("count") ?? 0

    // 2. Handle mutations (POST)
    if (request.method === "POST") {
      if (url.pathname === "/increment") {
        await this.ctx.storage.put("count", count + 1)
      }
      // 3. Redirect to prevent double-submit
      return Response.redirect("/", 303)
    }

    // 4. Render page with current state
    return new Response(CounterPage({ count }), {
      headers: { "Content-Type": "text/html" }
    })
  }
}
```

### Why Durable Objects?

| Traditional Stack       | Durable Object                  |
| ----------------------- | ------------------------------- |
| Server + Database + ORM | Single class with `ctx.storage` |
| Connection pooling      | Built-in                        |
| Migrations              | Just `storage.put()`            |
| Caching layer           | State lives in memory           |
| Session affinity        | Automatic                       |

---

## Layer 3: Worker Gateway

**File:** `src/index.ts` (default export)

The Worker routes requests to the appropriate Durable Object:

```typescript
export default {
  async fetch(request: Request, env: Env) {
    // Get or create DO by name
    const id = env.COUNTER.idFromName("A")
    const stub = env.COUNTER.get(id)

    // Forward the request
    return stub.fetch(request)
  }
}
```

### Routing Patterns

```typescript
// Single instance (global state)
const id = env.COUNTER.idFromName("global")

// Per-user instance
const userId = getUserIdFromCookie(request)
const id = env.COUNTER.idFromName(userId)

// Per-resource instance
const roomId = new URL(request.url).pathname.split("/")[2]
const id = env.ROOMS.idFromName(roomId)
```

---

## Layer 4: Components

**File:** `src/components/Counter.tsx`

Components are just functions that return `RawHtml`:

```tsx
interface CounterProps {
  count: number
}

export function Counter({ count }: CounterProps): RawHtml {
  return (
    <html>
      <head>
        <title>Counter</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="count">{count}</div>
        <form method="post" action="/increment">
          <button type="submit">+</button>
        </form>
      </body>
    </html>
  )
}
```

### Form-Based Interactivity

No client-side JavaScript needed:

```tsx
<form method="post" action="/increment">
  <button type="submit">+</button>
</form>
```

1. User clicks button
2. Browser POSTs to `/increment`
3. Server updates state
4. Server redirects to `/`
5. Browser GETs `/` with new state

This is the **Post/Redirect/Get** pattern—battle-tested since the 90s.

---

## Layer 5: Infrastructure as Code

**File:** `alchemy.run.ts`

Deployment is declarative TypeScript:

```typescript
import alchemy from "alchemy"
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare"

const app = await alchemy("my-app", { stage })

const counter = DurableObjectNamespace("counter", {
  className: "Counter",
  sqlite: true
})

const worker = await Worker("worker", {
  name: workerName,
  entrypoint: "./src/index.ts",
  bindings: { COUNTER: counter }
})

await app.finalize()
```

### Stage-Based Deployments

```typescript
// From git branch or env var
const stage = process.env.STAGE || gitBranch || "dev"

// Worker name includes stage
const workerName = stage === "main"
  ? "my-app"
  : `my-app-${stage}`
```

- `main` → `my-app.workers.dev`
- `pr-42` → `my-app-pr-42.workers.dev`
- `feature-x` → `my-app-feature-x.workers.dev`

---

## Data Flow Summary

```
Browser Request
      │
      ▼
┌─────────────┐
│   Worker    │  Routes to Durable Object
└─────────────┘
      │
      ▼
┌─────────────┐
│ Durable     │  Loads state from storage
│ Object      │  Handles request
└─────────────┘  Renders TSX component
      │
      ▼
┌─────────────┐
│ JSX Runtime │  jsx() → string HTML
└─────────────┘
      │
      ▼
┌─────────────┐
│  Response   │  Content-Type: text/html
└─────────────┘
      │
      ▼
Browser renders HTML
```

## File Structure

```
src/
├── index.ts           # Worker + Durable Object
├── jsx-runtime.ts     # Custom JSX → HTML runtime
└── components/
    └── Counter.tsx    # Page component

alchemy.run.ts         # Infrastructure definition
tsconfig.json          # JSX factory configuration
```

## Trade-offs

### What You Get

- **~100 lines** of JSX runtime vs React's 100k+
- **Zero client JS** for basic interactivity
- **No build step** beyond TypeScript compilation
- **Instant cold starts** on Cloudflare's edge
- **Automatic state persistence** in Durable Objects

### What You Give Up

- No client-side reactivity (every change = page reload)
- No component lifecycle hooks
- No suspense/streaming (yet)
- No ecosystem of React components

This is intentional. Start with the minimum, add complexity only when needed.
