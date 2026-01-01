import { jsx, Fragment, RawHtml } from "../../jsx-runtime"
import type { Operation, Components, HttpMethod } from "./types"
import { SchemaView } from "./SchemaView"

interface Props {
  path: string
  method: HttpMethod
  operation: Operation
  components: Components | undefined
}

const methodColors: Record<HttpMethod, {
  bg: string
  border: string
  badge: string
}> = {
  get: {
    bg: "bg-green-50",
    border: "border-l-green-500",
    badge: "bg-green-500",
  },
  post: { bg: "bg-blue-50", border: "border-l-blue-500", badge: "bg-blue-500" },
  put: {
    bg: "bg-amber-50",
    border: "border-l-amber-500",
    badge: "bg-amber-500",
  },
  delete: { bg: "bg-red-50", border: "border-l-red-500", badge: "bg-red-500" },
  patch: {
    bg: "bg-teal-50",
    border: "border-l-teal-500",
    badge: "bg-teal-500",
  },
}

export function Endpoint({
  path,
  method,
  operation,
  components,
}: Props): RawHtml {
  const colors = methodColors[method]

  return (
    <details className="border border-gray-200 rounded overflow-hidden">
      <summary
        className={`flex items-center gap-4 p-3 cursor-pointer border-l-4 ${colors.border} ${colors.bg} hover:brightness-95 list-none`}
      >
        <span
          className={`${colors.badge} text-white text-xs font-bold px-2 py-1 rounded uppercase min-w-[60px] text-center`}
        >
          {method}
        </span>
        <span className="font-mono text-sm font-semibold text-gray-800">
          {path}
        </span>
        {operation.summary && (
          <span className="text-gray-500 text-sm ml-auto">
            {operation.summary}
          </span>
        )}
      </summary>
      <div className="p-4 border-t border-gray-200 bg-white space-y-4">
        {operation.description && (
          <p className="text-gray-700">{operation.description}</p>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Parameters
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 font-semibold">Name</th>
                  <th className="text-left p-2 font-semibold">In</th>
                  <th className="text-left p-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {operation.parameters.map((param) => (
                  <tr className="border-t border-gray-100">
                    <td className="p-2 font-mono font-semibold">
                      {param.name}
                      {param.required && (
                        <span className="text-red-500 text-xs ml-1">*</span>
                      )}
                    </td>
                    <td className="p-2 text-gray-600">{param.in}</td>
                    <td className="p-2 text-gray-600">
                      {param.description ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {operation.requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Request Body
            </h4>
            {operation.requestBody.description && (
              <p className="text-gray-600 text-sm mb-2">
                {operation.requestBody.description}
              </p>
            )}
            <div className="text-xs text-gray-400 font-mono mb-1">
              application/json
            </div>
            <SchemaView
              content={operation.requestBody.content}
              components={components}
            />
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Responses
          </h4>
          <div className="space-y-2">
            {Object.entries(operation.responses).map(([code, response]) => (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <span
                  className={`font-mono font-bold px-2 py-1 rounded text-white text-sm ${
                    code.startsWith("2")
                      ? "bg-green-500"
                      : code.startsWith("3")
                        ? "bg-amber-500"
                        : code.startsWith("4")
                          ? "bg-red-500"
                          : "bg-gray-500"
                  }`}
                >
                  {code}
                </span>
                <span className="text-gray-700 flex-1">
                  {response.description}
                </span>
                {response.content && (
                  <SchemaView
                    content={response.content}
                    components={components}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  )
}
