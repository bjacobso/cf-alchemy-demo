import type { OpenAPISpec, EndpointInfo, HttpMethod } from "./swagger/types";
import { ApiInfo } from "./swagger/ApiInfo";
import { TagGroup } from "./swagger/TagGroup";

export interface SwaggerUIProps {
  spec: OpenAPISpec;
}

export function SwaggerUI({ spec }: SwaggerUIProps) {
  const endpointsByTag = groupEndpointsByTag(spec);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 min-h-screen">
      <ApiInfo info={spec.info} />
      <div className="space-y-4">
        {Object.entries(endpointsByTag).map(([tag, endpoints]) => (
          <TagGroup key={tag} tagName={tag} endpoints={endpoints} components={spec.components} />
        ))}
      </div>
    </div>
  );
}

// Group endpoints by their first tag
function groupEndpointsByTag(spec: OpenAPISpec): Record<string, EndpointInfo[]> {
  const groups: Record<string, EndpointInfo[]> = {};
  const methods: HttpMethod[] = ["get", "post", "put", "delete", "patch"];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const tag = operation.tags?.[0] ?? "default";
      if (!groups[tag]) {
        groups[tag] = [];
      }

      groups[tag].push({ path, method, operation });
    }
  }

  return groups;
}
