import { jsx, RawHtml } from "../../jsx-runtime"
import type { EndpointInfo, Components } from "./types"
import { Endpoint } from "./Endpoint"

interface Props {
  tagName: string
  endpoints: EndpointInfo[]
  components: Components | undefined
}

export function TagGroup({ tagName, endpoints, components }: Props): RawHtml {
  return (
    <details className="bg-white border border-gray-200 rounded-lg" open>
      <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-100 hover:bg-gray-200 border-b border-gray-200 list-none">
        <h2 className="text-xl font-semibold text-gray-800">{tagName}</h2>
        <span className="text-sm text-gray-500">
          {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
        </span>
      </summary>
      <div className="p-2 space-y-2">
        {endpoints.map((ep) => (
          <Endpoint
            path={ep.path}
            method={ep.method}
            operation={ep.operation}
            components={components}
          />
        ))}
      </div>
    </details>
  )
}
