import { Effect, Context, Layer } from "effect";
import { CloudflareEnv } from "./CloudflareEnv";

// Counter service interface - what the service provides
// Using never for error channel since we handle errors via orDie
// Note: Avoiding 'readonly' modifier due to oxfmt bug (see ISSUES.md)
interface ICounterService {
  getCount: Effect.Effect<number>;
  increment: Effect.Effect<void>;
  decrement: Effect.Effect<void>;
}

// Effect Context.Tag for the CounterService
export class CounterService extends Context.Tag("CounterService")<
  CounterService,
  ICounterService
>() {}

// Live implementation that accesses the Durable Object via CloudflareEnv
export const CounterServiceLive = Layer.effect(
  CounterService,
  Effect.gen(function* () {
    const env = yield* CloudflareEnv;
    const id = env.COUNTER.idFromName("A");
    const stub = env.COUNTER.get(id);

    return {
      getCount: Effect.tryPromise(() => stub.getCount()).pipe(Effect.orDie),
      increment: Effect.tryPromise(() => stub.increment()).pipe(Effect.orDie),
      decrement: Effect.tryPromise(() => stub.decrement()).pipe(Effect.orDie),
    };
  }),
);
