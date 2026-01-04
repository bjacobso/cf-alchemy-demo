# Meta Framework from First Principles

A template for building edge-first web applications without React, Next.js, or traditional frameworks.

This project demonstrates that modern web apps don't need heavyweight dependencies. Using **Effect** for type-safe composition, **Cloudflare Workers + Durable Objects** for stateful serverless, and **Alchemy** for declarative infrastructure - all with a custom 100-line JSX runtime instead of React.

---

## Technology Stack

| Layer           | Technology                           | Version         |
| --------------- | ------------------------------------ | --------------- |
| Runtime         | Effect                               | 3.19.14         |
| HTTP Server     | @effect/platform                     | 0.94.1          |
| Database        | @effect/sql + @effect/sql-sqlite-do  | 0.49.0 / 0.27.0 |
| Infrastructure  | Alchemy                              | latest          |
| Edge Platform   | Cloudflare Workers + Durable Objects | -               |
| UI Rendering    | Custom JSX Runtime (no React)        | -               |
| Styling         | Tailwind CSS (pre-compiled)          | 4.1.18          |
| Package Manager | pnpm                                 | 10.2.0          |
| Linting         | oxlint                               | 1.36.0          |
| Formatting      | oxfmt                                | 0.21.0          |
| TypeScript      | typescript                           | 5.9.3           |
| E2E Testing     | Playwright                           | 1.57.0          |

---

## Project Structure

```
├── alchemy.run.ts              # Infrastructure-as-code (Workers, DOs, deployments)
├── src/
│   ├── index.ts                # Worker entry point + DO exports
│   ├── runtime.ts              # Effect layer composition
│   ├── jsx-runtime.ts          # Custom JSX → HTML renderer (~100 lines)
│   ├── api/
│   │   └── api.ts              # API endpoint definitions (HttpApi, Schema)
│   ├── handlers/
│   │   ├── counter.ts          # Counter endpoint handlers
│   │   └── docs.ts             # OpenAPI documentation handlers
│   ├── services/
│   │   ├── CloudflareEnv.ts    # Environment bindings (Context.Tag)
│   │   └── CounterService.ts   # Business logic service
│   ├── durable-objects/
│   │   └── Counter.ts          # Durable Object with SQLite storage
│   ├── components/
│   │   ├── Counter.tsx         # Counter page component
│   │   ├── Layout.tsx          # HTML layout wrapper
│   │   └── SwaggerUI.tsx       # OpenAPI documentation UI
│   └── styles/
│       └── tailwind.css        # Tailwind input file
├── e2e/
│   └── counter.spec.ts         # Playwright E2E tests
├── scripts/
│   └── build-css.ts            # Tailwind compilation script
├── .github/workflows/
│   ├── ci.yml                  # Lint, format, typecheck
│   └── deploy.yml              # Stage-based deployments
└── package.json
```

---

## Core Patterns

### 1. Custom JSX Runtime

**File:** `src/jsx-runtime.ts`

Server-side JSX that compiles directly to HTML strings. No virtual DOM, no hydration, no client JavaScript required.

```typescript
// tsconfig.json configuration
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "jsx",
    "jsxFragmentFactory": "Fragment"
  }
}
```

```typescript
// Components return RawHtml (string wrapper)
export function Counter({ count }: { count: number }): RawHtml {
  return (
    <Layout title="Counter">
      <div className="text-6xl">{count}</div>
      <form method="post" action="/increment">
        <button type="submit">+</button>
      </form>
    </Layout>
  );
}
```

**Key features:**

- `RawHtml` class marks strings as safe (already escaped)
- `escapeHtml()` prevents XSS
- `dangerouslySetInnerHTML` escape hatch for inline styles/scripts
- Void element handling (`<img>`, `<input>`, etc.)

---

### 2. Effect-Based API Layer

**File:** `src/api/api.ts`

Declarative API definitions with automatic OpenAPI spec generation.

```typescript
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

class CounterGroup extends HttpApiGroup.make("counter")
  .add(HttpApiEndpoint.get("getPage", "/").addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("increment", "/increment").addSuccess(Schema.Void))
  .add(HttpApiEndpoint.post("decrement", "/decrement").addSuccess(Schema.Void)) {}

export class AppApi extends HttpApi.make("app").add(CounterGroup) {}
```

---

### 3. Effect Services & Dependency Injection

**Files:** `src/services/CounterService.ts`, `src/services/CloudflareEnv.ts`

Type-safe dependency injection using Effect's Context.Tag and Layer patterns.

```typescript
// Define service interface
interface ICounterService {
  getCount: Effect.Effect<number>;
  increment: Effect.Effect<void>;
}

// Create Context.Tag for DI
export class CounterService extends Context.Tag("CounterService")<
  CounterService,
  ICounterService
>() {}

// Implement as Layer (provides dependencies)
export const CounterServiceLive = Layer.effect(
  CounterService,
  Effect.gen(function* () {
    const env = yield* CloudflareEnv;  // Inject environment
    const stub = env.COUNTER.get(env.COUNTER.idFromName("A"));

    return {
      getCount: Effect.tryPromise(() => stub.getCount()).pipe(Effect.orDie),
      increment: Effect.tryPromise(() => stub.increment()).pipe(Effect.orDie),
    };
  }),
);
```

---

### 4. Request Handlers

**File:** `src/handlers/counter.ts`

Handlers consume services and return typed responses.

```typescript
export const CounterHandlerLive = HttpApiBuilder.group(AppApi, "counter", (handlers) =>
  handlers
    .handleRaw("getPage", () =>
      Effect.gen(function* () {
        const service = yield* CounterService;
        const count = yield* service.getCount;
        return HttpServerResponse.html("<!DOCTYPE html>" + Counter({ count }));
      }),
    )
    .handleRaw("increment", () =>
      Effect.gen(function* () {
        const service = yield* CounterService;
        yield* service.increment;
        return HttpServerResponse.redirect("/", { status: 303 });
      }),
    ),
);
```

**Pattern:** POST → mutate → redirect (no client JS needed)

---

### 5. Durable Objects with SQLite

**File:** `src/durable-objects/Counter.ts`

Stateful serverless functions with embedded SQLite persistence.

```typescript
export class Counter extends DurableObject<Env> {
  private readonly runtime: ManagedRuntime.ManagedRuntime<SqlClient.SqlClient, never>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Effect SQL layer from DO's SqlStorage
    const sqlLayer = Layer.scoped(
      SqlClient.SqlClient,
      SqliteClient.make({ db: ctx.storage.sql }),
    );
    this.runtime = ManagedRuntime.make(sqlLayer);

    // Schema initialization (runs once per DO instance)
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS counter (
        id TEXT PRIMARY KEY DEFAULT 'default',
        value INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  async getCount(): Promise<number> {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        const rows = yield* sql`SELECT value FROM counter WHERE id = 'default'`;
        return (rows[0]?.value as number) ?? 0;
      }),
    );
  }
}
```

---

### 6. Runtime Composition

**File:** `src/runtime.ts`

Layer composition wires everything together.

```typescript
export const makeHandler = (env: Env) => {
  const EnvLayer = makeEnvLayer(env);

  const ApiLive = HttpApiBuilder.api(AppApi).pipe(
    Layer.provide(CounterHandlerLive),
    Layer.provide(DocsHandlerLive),
    Layer.provide(CounterServiceLive),
    Layer.provide(EnvLayer),
  );

  return HttpApiBuilder.toWebHandler(Layer.mergeAll(ApiLive, HttpServer.layerContext));
};
```

---

## Infrastructure & Deployment

### Alchemy Infrastructure-as-Code

**File:** `alchemy.run.ts`

Declarative infrastructure definition in TypeScript.

```typescript
import alchemy from "alchemy";
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const stage = process.env.STAGE || "dev";

const app = await alchemy("my-app", {
  stage,
  stateStore: (scope) => new CloudflareStateStore(scope, { forceUpdate: true }),
});

const counter = DurableObjectNamespace("counter", {
  className: "Counter",
  sqlite: true,
});

const worker = await Worker("worker", {
  name: stage === "prod" ? "my-app" : `my-app-${stage}`,
  entrypoint: "./src/index.ts",
  bindings: { COUNTER: counter },
});

await app.finalize();
```

---

### Branch & Stage Strategy

| Trigger               | Stage Name      | Worker Name                    |
| --------------------- | --------------- | ------------------------------ |
| Push to `main`        | `main` + `prod` | `my-app` (prod), `my-app-main` |
| Pull Request #42      | `pr-42`         | `my-app-pr-42`                 |
| Push to `feature/foo` | `feature-foo`   | `my-app-feature-foo`           |

Stage is calculated in `.github/workflows/deploy.yml`:

```yaml
env:
  STAGE: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.number) || github.ref_name }}
```

---

### GitHub Actions Workflows

**CI Pipeline** (`.github/workflows/ci.yml`):

- Runs on all pushes and PRs
- Jobs: `lint`, `format`, `typecheck`

**Deploy Pipeline** (`.github/workflows/deploy.yml`):

- Deploys to stage-based environments
- Posts preview URL to PR comments
- Cleanup job destroys preview on PR close

---

## Development Commands

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Build CSS + deploy to dev stage     |
| `pnpm deploy`       | Build CSS + deploy to current stage |
| `pnpm typecheck`    | Run TypeScript type checking        |
| `pnpm lint`         | Run oxlint                          |
| `pnpm lint:fix`     | Auto-fix lint issues                |
| `pnpm format`       | Format code with oxfmt              |
| `pnpm format:check` | Check formatting                    |
| `pnpm test:e2e`     | Run Playwright E2E tests            |
| `pnpm build:css`    | Compile Tailwind CSS                |

---

## Getting Started (New Project)

### 1. Clone and Rename

```bash
git clone https://github.com/bjacobso/cf-alchemy-demo.git my-app
cd my-app
rm -rf .git && git init
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Secrets

Create `.env` file:

```
ALCHEMY_STATE_TOKEN=<generate with: openssl rand -base64 32>
```

For GitHub Actions, add these repository secrets:

- `ALCHEMY_PASSWORD` - Encryption password (`openssl rand -base64 32`)
- `ALCHEMY_STATE_TOKEN` - State store token (`openssl rand -base64 32`)
- `CLOUDFLARE_API_TOKEN` - From Cloudflare dashboard (Edit Workers permission)
- `CLOUDFLARE_EMAIL` - Your Cloudflare login email

### 4. Update Configuration

In `alchemy.run.ts`:

```typescript
const app = await alchemy("your-app-name", { ... });
```

In `package.json`:

```json
{ "name": "your-app-name" }
```

### 5. Deploy

```bash
pnpm dev
```

---

## Common Extension Points

### Adding a New API Endpoint

1. **Define endpoint** in `src/api/api.ts`:

```typescript
class UsersGroup extends HttpApiGroup.make("users")
  .add(HttpApiEndpoint.get("list", "/users").addSuccess(Schema.Array(UserSchema)))
  .add(HttpApiEndpoint.post("create", "/users").addSuccess(UserSchema)) {}

export class AppApi extends HttpApi.make("app")
  .add(CounterGroup)
  .add(UsersGroup) {}
```

2. **Create handler** in `src/handlers/users.ts`:

```typescript
export const UsersHandlerLive = HttpApiBuilder.group(AppApi, "users", (handlers) =>
  handlers.handle("list", () => Effect.succeed([])),
);
```

3. **Wire into runtime** in `src/runtime.ts`:

```typescript
const ApiLive = HttpApiBuilder.api(AppApi).pipe(
  Layer.provide(CounterHandlerLive),
  Layer.provide(UsersHandlerLive),  // Add here
  // ...
);
```

---

### Adding a New Service

1. **Define service** in `src/services/MyService.ts`:

```typescript
interface IMyService {
  doSomething: Effect.Effect<string>;
}

export class MyService extends Context.Tag("MyService")<MyService, IMyService>() {}

export const MyServiceLive = Layer.succeed(MyService, {
  doSomething: Effect.succeed("done"),
});
```

2. **Use in handler**:

```typescript
const myService = yield* MyService;
const result = yield* myService.doSomething;
```

3. **Provide layer** in `src/runtime.ts`:

```typescript
Layer.provide(MyServiceLive),
```

---

### Adding a New Durable Object

1. **Create DO class** in `src/durable-objects/MyDO.ts`:

```typescript
export class MyDO extends DurableObject<Env> {
  // ... implementation
}
```

2. **Export from index** in `src/index.ts`:

```typescript
export { MyDO } from "./durable-objects/MyDO";
```

3. **Define namespace** in `alchemy.run.ts`:

```typescript
const myDO = DurableObjectNamespace("my-do", {
  className: "MyDO",
  sqlite: true,
});

const worker = await Worker("worker", {
  bindings: {
    COUNTER: counter,
    MY_DO: myDO,  // Add binding
  },
});
```

4. **Update Env type** in `src/services/CloudflareEnv.ts`:

```typescript
export interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
  MY_DO: DurableObjectNamespace<MyDO>;
}
```

---

### Adding a New Component

Create in `src/components/MyComponent.tsx`:

```typescript
import { jsx, RawHtml } from "../jsx-runtime";

interface Props {
  title: string;
  children?: RawHtml | RawHtml[];
}

export function MyComponent({ title, children }: Props): RawHtml {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
```

Use in other components:

```typescript
import { MyComponent } from "./MyComponent";

<MyComponent title="Hello">
  <p>Content here</p>
</MyComponent>
```
