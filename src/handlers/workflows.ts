import { HttpApiBuilder, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { AppApi } from "../api/api";
import { WorkflowService } from "../services/WorkflowService";
import { WorkflowList } from "../components/workflows/WorkflowList";
import { WorkflowDetail } from "../components/workflows/WorkflowDetail";
import { WorkflowStartForm } from "../components/workflows/WorkflowStartForm";

// Handler implementation for the workflows group
export const WorkflowsHandlerLive = HttpApiBuilder.group(AppApi, "workflows", (handlers) =>
  handlers
    .handleRaw("listExecutions", () =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const executions = yield* workflowService.listExecutions;
        const html = "<!DOCTYPE html>" + WorkflowList({ executions });
        return HttpServerResponse.html(html);
      }),
    )
    .handleRaw("startForm", () =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const workflows = yield* workflowService.getAvailableWorkflows;
        const html = "<!DOCTYPE html>" + WorkflowStartForm({ workflows });
        return HttpServerResponse.html(html);
      }),
    )
    .handleRaw("startExecution", () =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const request = yield* HttpServerRequest.HttpServerRequest;
        const source = request.source as Request;

        // Parse form data
        const formData = yield* Effect.tryPromise(() => source.formData()).pipe(Effect.orDie);

        const workflowName = formData.get("workflowName") as string;
        const payloadStr = formData.get("payload") as string;

        let payload: unknown;
        try {
          payload = JSON.parse(payloadStr || "{}");
        } catch {
          const workflows = yield* workflowService.getAvailableWorkflows;
          const html =
            "<!DOCTYPE html>" +
            WorkflowStartForm({
              workflows,
              error: "Invalid JSON payload",
            });
          return HttpServerResponse.html(html);
        }

        const executionId = yield* workflowService.startExecution(workflowName, payload);

        return HttpServerResponse.redirect(`/workflows/${executionId}`, {
          status: 303,
        });
      }),
    )
    .handleRaw("getExecution", ({ request }) =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        // Extract executionId from URL path
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/");
        const executionId = pathParts[pathParts.length - 1] ?? "";

        const execution = yield* workflowService.getExecution(executionId);
        const html = "<!DOCTYPE html>" + WorkflowDetail({ execution });
        return HttpServerResponse.html(html);
      }),
    )
    .handleRaw("sendEvent", ({ request }) =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        // Extract executionId from URL path
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/");
        // Path is /workflows/:executionId/event
        const executionId = pathParts[pathParts.length - 2] ?? "";
        const source = request.source as Request;

        // Parse form data
        const formData = yield* Effect.tryPromise(() => source.formData()).pipe(Effect.orDie);

        const deferredName = formData.get("deferredName") as string;
        const valueStr = formData.get("value") as string;

        let value: unknown;
        try {
          value = JSON.parse(valueStr || "{}");
        } catch {
          value = valueStr;
        }

        yield* workflowService.sendEvent(executionId, deferredName, value);

        return HttpServerResponse.redirect(`/workflows/${executionId}`, {
          status: 303,
        });
      }),
    )
    .handleRaw("cancelExecution", ({ request }) =>
      Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        // Extract executionId from URL path
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/");
        // Path is /workflows/:executionId/cancel
        const executionId = pathParts[pathParts.length - 2] ?? "";

        yield* workflowService.cancelExecution(executionId);

        return HttpServerResponse.redirect(`/workflows/${executionId}`, {
          status: 303,
        });
      }),
    ),
);
