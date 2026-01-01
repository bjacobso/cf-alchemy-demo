# Known Issues

## oxfmt corrupts TypeScript `readonly` interface properties

**Discovered:** 2025-12-31

**Tool:** oxfmt v0.1.x

**Problem:** The `oxfmt` formatter incorrectly handles TypeScript interface properties with the `readonly` modifier. It merges `readonly` with the property name, removing the space between them.

**Example:**

Before formatting (correct):

```typescript
interface ICounterService {
  readonly getCount: Effect.Effect<number>
  readonly increment: Effect.Effect<void>
  readonly decrement: Effect.Effect<void>
}
```

After formatting (corrupted):

```typescript
interface ICounterService {
  readonlygetCount: Effect.Effect<number>
  readonlyincrement: Effect.Effect<void>
  readonlydecrement: Effect.Effect<void>
}
```

**Impact:** TypeScript compilation fails with errors like:

```
Property 'getCount' does not exist on type 'ICounterService'.
```

**Workaround:** Manually fix the file after running `oxfmt`, or avoid using `readonly` modifiers on interface properties until the bug is fixed upstream.

**Status:** Unfiled upstream. Consider reporting to https://github.com/nicolo-ribaudo/nickel-lang/oxfmt (or wherever oxfmt is maintained).
