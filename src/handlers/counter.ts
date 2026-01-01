import { HttpApiBuilder, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { AppApi } from "../api/api"
import { CounterService } from "../services/CounterService"
import { render } from "../entry-server"
import { createHtmlDocument } from "../lib/html"

/**
 * Handler implementation for the counter group
 *
 * This demonstrates how Effect handlers integrate with React SSR:
 * 1. Effect services (CounterService) handle data fetching
 * 2. React (via render()) handles presentation
 * 3. The handler orchestrates both and returns the response
 *
 * The increment/decrement endpoints now return JSON instead of redirects,
 * enabling client-side state updates without full page reloads.
 */
export const CounterHandlerLive = HttpApiBuilder.group(
  AppApi,
  "counter",
  (handlers) =>
    handlers
      .handleRaw("getPage", () =>
        Effect.gen(function* () {
          // 1. Use Effect service to fetch data from Durable Object
          const counterService = yield* CounterService
          const count = yield* counterService.getCount

          // 2. Create props object - this will be passed to both server and client
          const props = { count }

          // 3. React SSR - render component tree to HTML string
          const appHtml = render(props)

          // 4. Wrap in full HTML document with inline hydration script
          const html = createHtmlDocument({
            title: "Counter",
            appHtml,
            props,
          })

          return HttpServerResponse.html(html)
        }),
      )
      .handleRaw("increment", () =>
        Effect.gen(function* () {
          const counterService = yield* CounterService
          yield* counterService.increment
          // Return JSON instead of redirect for client-side updates
          const count = yield* counterService.getCount
          return HttpServerResponse.unsafeJson({ count })
        }),
      )
      .handleRaw("decrement", () =>
        Effect.gen(function* () {
          const counterService = yield* CounterService
          yield* counterService.decrement
          // Return JSON instead of redirect for client-side updates
          const count = yield* counterService.getCount
          return HttpServerResponse.unsafeJson({ count })
        }),
      ),
)
