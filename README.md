# Meta Framework from First Principles

Building a complete web application without React, Next.js, or traditional frameworks.

## What This Demonstrates

- **Custom JSX runtime** (~100 lines) that renders directly to HTML strings
- **Server-side TSX without React** - JSX is just TypeScript compilation
- **Cloudflare Durable Objects** for stateful serverless
- **Traditional web patterns** - forms, POST/redirect/GET, no client JavaScript
- **Declarative infrastructure** with [Alchemy](https://alchemy.run)

## The Stack

| What       | How                                                                  |
| ---------- | -------------------------------------------------------------------- |
| JSX → HTML | Custom `jsx()` factory in [`src/jsx-runtime.ts`](src/jsx-runtime.ts) |
| Server     | Cloudflare Durable Object                                            |
| State      | Built-in DO storage (no database)                                    |
| Routing    | Direct request handling                                              |
| Deploy     | Alchemy infrastructure-as-code                                       |

## How the JSX Runtime Works

JSX is just syntax sugar. TypeScript compiles `<div class="foo">hello</div>` into function calls. We provide our own `jsx()` function that renders directly to HTML strings:

```typescript
// Our custom jsx() function (simplified)
function jsx(type, props, ...children) {
  if (typeof type === "function") {
    return type({ ...props, children })  // Component
  }
  return new RawHtml(`<${type}>${renderChildren(children)}</${type}>`)
}
```

No virtual DOM. No diffing algorithm. No client-side hydration. Just string concatenation with HTML escaping for safety.

See the full implementation: [`src/jsx-runtime.ts`](src/jsx-runtime.ts)

## How Durable Objects Work

A Durable Object is a stateful serverless function with built-in persistent storage:

```typescript
export class Counter extends DurableObject<Env> {
  async fetch(request: Request) {
    // Load state
    const count = await this.ctx.storage.get<number>("count") ?? 0

    // Handle POST (form submission)
    if (request.method === "POST") {
      await this.ctx.storage.put("count", count + 1)
      return Response.redirect("/")  // POST/redirect/GET
    }

    // Render page with TSX
    return new Response(CounterPage({ count }), {
      headers: { "Content-Type": "text/html" }
    })
  }
}
```

No database setup. No ORM. State lives in the Durable Object.

## Local Setup

```bash
npm install

# Configure Alchemy (one-time)
npx alchemy configure
npx alchemy login

# Run local dev server
npm run dev

# Deploy
npm run deploy
```

## E2E Tests

```bash
npx playwright install chromium

npm run dev           # Start dev server
npm run test:e2e      # Run tests

# Or test against deployed URL
BASE_URL=https://your-worker.workers.dev npm run test:e2e
```

## Endpoints

- `GET /` - Render counter page
- `POST /increment` - Increment count, redirect to /
- `POST /decrement` - Decrement count, redirect to /

## Why This Approach?

| Heavy Framework  | This Project                |
| ---------------- | --------------------------- |
| React + ReactDOM | Custom 100-line JSX factory |
| Next.js routing  | Direct `fetch()` handler    |
| PostgreSQL + ORM | Durable Object storage      |
| Node.js server   | Cloudflare Worker           |
| Webpack/Vite     | Native ES modules           |

Modern web apps don't need React, Node.js, or databases. This project proves it.

## GitHub Secrets

For CI/CD deployment:

| Secret                 | Description                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `ALCHEMY_PASSWORD`     | Encryption password: `openssl rand -base64 32`                                                |
| `ALCHEMY_STATE_TOKEN`  | State store token: `openssl rand -base64 32`                                                  |
| `CLOUDFLARE_API_TOKEN` | [Create token](https://dash.cloudflare.com/profile/api-tokens) with "Edit Cloudflare Workers" |
| `CLOUDFLARE_EMAIL`     | Your Cloudflare login email                                                                   |
