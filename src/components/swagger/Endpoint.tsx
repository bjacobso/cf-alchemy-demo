import { jsx, Fragment, RawHtml } from "../../jsx-runtime"
import type { Operation, Components, HttpMethod } from "./types"
import { SchemaView } from "./SchemaView"

interface Props {
  path: string
  method: HttpMethod
  operation: Operation
  components: Components | undefined
}

export function Endpoint({ path, method, operation, components }: Props): RawHtml {
  return (
    <details className="endpoint">
      <summary className={`endpoint-header method-${method}`}>
        <span className={`method-badge ${method}`}>{method}</span>
        <span className="path">{path}</span>
        {operation.summary && (
          <span className="summary">{operation.summary}</span>
        )}
      </summary>
      <div className="endpoint-content">
        {operation.description && (
          <p className="description">{operation.description}</p>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div className="parameters">
            <h4>Parameters</h4>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>In</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {operation.parameters.map((param) => (
                  <tr>
                    <td className="param-name">
                      {param.name}
                      {param.required && (
                        <span className="param-required"> *</span>
                      )}
                    </td>
                    <td>{param.in}</td>
                    <td>{param.description ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {operation.requestBody && (
          <div className="request-body">
            <h4>Request Body</h4>
            {operation.requestBody.description && (
              <p>{operation.requestBody.description}</p>
            )}
            <div className="content-type">application/json</div>
            <SchemaView
              content={operation.requestBody.content}
              components={components}
            />
          </div>
        )}

        <div className="responses">
          <h4>Responses</h4>
          {Object.entries(operation.responses).map(([code, response]) => (
            <div className="response">
              <span className={`status-code status-${code.charAt(0)}xx`}>
                {code}
              </span>
              <span className="response-desc">{response.description}</span>
              {response.content && (
                <SchemaView content={response.content} components={components} />
              )}
            </div>
          ))}
        </div>
      </div>
    </details>
  )
}
