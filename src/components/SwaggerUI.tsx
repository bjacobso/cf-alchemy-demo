import { jsx, RawHtml } from "../jsx-runtime"
import type { OpenAPISpec, EndpointInfo, HttpMethod } from "./swagger/types"
import { ApiInfo } from "./swagger/ApiInfo"
import { TagGroup } from "./swagger/TagGroup"
import { swaggerStyles } from "./swagger/styles"

interface SwaggerUIProps {
  spec: OpenAPISpec
}

export function SwaggerUI({ spec }: SwaggerUIProps): RawHtml {
  const endpointsByTag = groupEndpointsByTag(spec)

  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{spec.info.title} - API Docs</title>
        <style dangerouslySetInnerHTML={{ __html: swaggerStyles }} />
      </head>
      <body>
        <div className="swagger-ui">
          <ApiInfo info={spec.info} />
          <div className="endpoints">
            {Object.entries(endpointsByTag).map(([tag, endpoints]) => (
              <TagGroup
                tagName={tag}
                endpoints={endpoints}
                components={spec.components}
              />
            ))}
          </div>
        </div>
      </body>
    </html>
  )
}

// Group endpoints by their first tag
function groupEndpointsByTag(spec: OpenAPISpec): Record<string, EndpointInfo[]> {
  const groups: Record<string, EndpointInfo[]> = {}
  const methods: HttpMethod[] = ["get", "post", "put", "delete", "patch"]

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method]
      if (!operation) continue

      const tag = operation.tags?.[0] ?? "default"
      if (!groups[tag]) {
        groups[tag] = []
      }

      groups[tag].push({ path, method, operation })
    }
  }

  return groups
}
