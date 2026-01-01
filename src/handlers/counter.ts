import { HttpApiBuilder, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { AppApi } from "../api/api"
import { CounterService } from "../services/CounterService"
import { Counter as CounterPage } from "../components/Counter"

// Handler implementation for the counter group
export const CounterHandlerLive = HttpApiBuilder.group(
  AppApi,
  "counter",
  (handlers) =>
    handlers
      .handleRaw("getPage", () =>
        Effect.gen(function* () {
          const counterService = yield* CounterService
          const count = yield* counterService.getCount
          const html = "<!DOCTYPE html>" + CounterPage({ count })
          return HttpServerResponse.html(html)
        }),
      )
      .handleRaw("increment", () =>
        Effect.gen(function* () {
          const counterService = yield* CounterService
          yield* counterService.increment
          return HttpServerResponse.redirect("/", { status: 303 })
        }),
      )
      .handleRaw("decrement", () =>
        Effect.gen(function* () {
          const counterService = yield* CounterService
          yield* counterService.decrement
          return HttpServerResponse.redirect("/", { status: 303 })
        }),
      ),
)
