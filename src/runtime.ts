import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { AppApi } from "./api/api";
import { CounterHandlerLive } from "./handlers/counter";
import { DocsHandlerLive } from "./handlers/docs";
import { CounterServiceLive } from "./services/CounterService";
import { SemaphoreServiceLive } from "./services/SemaphoreService";
import { makeEnvLayer, type Env } from "./services/CloudflareEnv";

// Factory function that creates the Effect handler with env bindings
export const makeHandler = (env: Env) => {
  const EnvLayer = makeEnvLayer(env);

  // Compose all layers: API handlers -> Services -> Env bindings
  const ApiLive = HttpApiBuilder.api(AppApi).pipe(
    Layer.provide(CounterHandlerLive),
    Layer.provide(DocsHandlerLive),
    Layer.provide(CounterServiceLive),
    Layer.provide(SemaphoreServiceLive),
    Layer.provide(EnvLayer),
  );

  // Create a web handler compatible with Cloudflare Workers fetch()
  return HttpApiBuilder.toWebHandler(Layer.mergeAll(ApiLive, HttpServer.layerContext));
};
