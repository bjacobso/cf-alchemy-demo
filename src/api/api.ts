import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

// Path parameter for execution ID
const executionIdParam = HttpApiSchema.param("executionId", Schema.String);

// Counter API group - handles all counter-related endpoints
class CounterGroup extends HttpApiGroup.make("counter")
  .add(HttpApiEndpoint.get("getPage", "/").addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("increment", "/increment").addSuccess(Schema.Void))
  .add(HttpApiEndpoint.post("decrement", "/decrement").addSuccess(Schema.Void)) {}

// Docs API group - serves OpenAPI documentation
class DocsGroup extends HttpApiGroup.make("docs")
  .add(HttpApiEndpoint.get("getOpenApiSpec", "/docs.json").addSuccess(Schema.Unknown))
  .add(HttpApiEndpoint.get("getDocs", "/docs").addSuccess(Schema.String)) {}

// Workflows API group - admin interface for workflow executions
class WorkflowsGroup extends HttpApiGroup.make("workflows")
  .prefix("/workflows")
  .add(HttpApiEndpoint.get("listExecutions", "/").addSuccess(Schema.String))
  .add(HttpApiEndpoint.get("startForm", "/start").addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("startExecution", "/start").addSuccess(Schema.String))
  .add(HttpApiEndpoint.get("getExecution")`/${executionIdParam}`.addSuccess(Schema.String))
  .add(HttpApiEndpoint.post("sendEvent")`/${executionIdParam}/event`.addSuccess(Schema.String))
  .add(
    HttpApiEndpoint.post("cancelExecution")`/${executionIdParam}/cancel`.addSuccess(Schema.String),
  ) {}

// Top-level API definition combining all groups
export class AppApi extends HttpApi.make("app")
  .add(CounterGroup)
  .add(DocsGroup)
  .add(WorkflowsGroup) {}
