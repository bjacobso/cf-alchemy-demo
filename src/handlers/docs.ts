import { HttpApiBuilder, HttpServerResponse, OpenApi } from "@effect/platform";
import { Effect } from "effect";
import { AppApi } from "../api/api";
import { renderDocs } from "../entry-server";
import { createStaticHtmlDocument } from "../lib/html";
import type { OpenAPISpec } from "../components/swagger/types";

// Handler implementation for the docs group
export const DocsHandlerLive = HttpApiBuilder.group(AppApi, "docs", (handlers) =>
  handlers
    .handleRaw("getOpenApiSpec", () =>
      Effect.sync(() => {
        const spec = OpenApi.fromApi(AppApi);
        return HttpServerResponse.unsafeJson(spec);
      }),
    )
    .handleRaw("getDocs", () =>
      Effect.sync(() => {
        const spec = OpenApi.fromApi(AppApi) as unknown as OpenAPISpec;

        // React SSR - render SwaggerUI to HTML string
        const appHtml = renderDocs({ spec });

        // Wrap in full HTML document (no hydration needed for static docs)
        const html = createStaticHtmlDocument({
          title: `${spec.info.title} - API Docs`,
          appHtml,
        });

        return HttpServerResponse.html(html);
      }),
    ),
);
