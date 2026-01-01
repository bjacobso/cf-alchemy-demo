import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

// Counter API group - handles all counter-related endpoints
class CounterGroup extends HttpApiGroup.make("counter")
  .add(HttpApiEndpoint.get("getPage", "/").addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("increment", "/increment").addSuccess(Schema.Void))
  .add(
    HttpApiEndpoint.post("decrement", "/decrement").addSuccess(Schema.Void),
  ) {}

// Top-level API definition combining all groups
export class AppApi extends HttpApi.make("app").add(CounterGroup) {}
