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
    <details className="tag-group" open>
      <summary className="tag-header">
        <h2>{tagName}</h2>
        <span className="count">
          {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
        </span>
      </summary>
      <div className="tag-content">
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
