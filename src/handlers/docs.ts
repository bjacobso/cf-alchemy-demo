import { HttpApiBuilder, HttpServerResponse, OpenApi } from "@effect/platform"
import { Effect } from "effect"
import { AppApi } from "../api/api"
import { SwaggerUI } from "../components/SwaggerUI"
import type { OpenAPISpec } from "../components/swagger/types"

// Handler implementation for the docs group
export const DocsHandlerLive = HttpApiBuilder.group(
  AppApi,
  "docs",
  (handlers) =>
    handlers
      .handleRaw("getOpenApiSpec", () =>
        Effect.sync(() => {
          const spec = OpenApi.fromApi(AppApi)
          return HttpServerResponse.unsafeJson(spec)
        }),
      )
      .handleRaw("getDocs", () =>
        Effect.sync(() => {
          const spec = OpenApi.fromApi(AppApi) as unknown as OpenAPISpec
          const html = "<!DOCTYPE html>" + SwaggerUI({ spec })
          return HttpServerResponse.html(html)
        }),
      ),
)
