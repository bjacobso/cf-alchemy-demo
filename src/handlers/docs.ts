import { HttpApiBuilder, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { AppApi } from "../api/api"
import { SwaggerUI } from "../components/SwaggerUI"
import type { OpenAPISpec } from "../components/swagger/types"

// Sample OpenAPI spec demonstrating the Counter API
const openApiSpec: OpenAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "Counter API",
    version: "1.0.0",
    description:
      "A simple counter application built with Effect TypeScript and Cloudflare Durable Objects",
  },
  tags: [{ name: "counter", description: "Counter operations" }],
  paths: {
    "/": {
      get: {
        tags: ["counter"],
        summary: "Get counter page",
        operationId: "getPage",
        description:
          "Returns the HTML page displaying the current counter value with increment and decrement buttons.",
        responses: {
          "200": {
            description: "HTML page with current counter value",
            content: {
              "text/html": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/increment": {
      post: {
        tags: ["counter"],
        summary: "Increment counter",
        operationId: "increment",
        description:
          "Increments the counter value by 1 and redirects back to the main page.",
        responses: {
          "303": {
            description: "Redirect to counter page",
          },
        },
      },
    },
    "/decrement": {
      post: {
        tags: ["counter"],
        summary: "Decrement counter",
        operationId: "decrement",
        description:
          "Decrements the counter value by 1 and redirects back to the main page.",
        responses: {
          "303": {
            description: "Redirect to counter page",
          },
        },
      },
    },
  },
}

// Handler implementation for the docs group
export const DocsHandlerLive = HttpApiBuilder.group(
  AppApi,
  "docs",
  (handlers) =>
    handlers.handleRaw("getDocs", () =>
      Effect.gen(function* () {
        const html = "<!DOCTYPE html>" + SwaggerUI({ spec: openApiSpec })
        return HttpServerResponse.html(html)
      }),
    ),
)
