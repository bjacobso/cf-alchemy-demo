import { jsx, RawHtml } from "../../jsx-runtime";
import type { MediaType, Components, SchemaObject } from "./types";

interface Props {
  content: Record<string, MediaType>;
  components: Components | undefined;
}

export function SchemaView({ content, components }: Props): RawHtml {
  const jsonContent = content["application/json"];
  if (!jsonContent?.schema) {
    return null as unknown as RawHtml;
  }

  const resolvedSchema = resolveSchema(jsonContent.schema, components);
  const formatted = JSON.stringify(resolvedSchema, null, 2);

  return (
    <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm">
      <code className="font-mono whitespace-pre">{formatted}</code>
    </pre>
  );
}

// Resolve $ref references in schema
function resolveSchema(schema: SchemaObject, components?: Components): SchemaObject {
  if (schema.$ref && components?.schemas) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    const resolved = components.schemas[refName];
    if (resolved) {
      return resolveSchema(resolved, components);
    }
  }
  return schema;
}
