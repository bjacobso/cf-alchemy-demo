import { HttpApiBuilder, HttpServerResponse, OpenApi } from "@effect/platform"
import { Effect } from "effect"
import { AppApi } from "../api/api"

// Handler implementation for the docs group
export const DocsHandlerLive = HttpApiBuilder.group(
  AppApi,
  "docs",
  (handlers) =>
    handlers.handleRaw("getOpenApiSpec", () =>
      Effect.sync(() => {
        const spec = OpenApi.fromApi(AppApi)
        return HttpServerResponse.unsafeJson(spec)
      }),
    ),
)
