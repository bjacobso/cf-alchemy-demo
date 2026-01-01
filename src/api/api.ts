import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// Counter API group - handles all counter-related endpoints
class CounterGroup extends HttpApiGroup.make("counter")
  .add(HttpApiEndpoint.get("getPage", "/").addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("increment", "/increment").addSuccess(Schema.Void))
  .add(HttpApiEndpoint.post("decrement", "/decrement").addSuccess(Schema.Void)) {}

// Docs API group - serves OpenAPI documentation
class DocsGroup extends HttpApiGroup.make("docs")
  .add(HttpApiEndpoint.get("getOpenApiSpec", "/docs.json").addSuccess(Schema.Unknown))
  .add(HttpApiEndpoint.get("getDocs", "/docs").addSuccess(Schema.String)) {}

// Top-level API definition combining all groups
export class AppApi extends HttpApi.make("app").add(CounterGroup).add(DocsGroup) {}
