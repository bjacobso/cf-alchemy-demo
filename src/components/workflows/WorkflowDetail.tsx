import { jsx, RawHtml } from "../../jsx-runtime"
import { Layout } from "../Layout"
import { StatusBadge } from "./StatusBadge"
import type { ExecutionDetail } from "../../services/WorkflowService"

interface WorkflowDetailProps {
  execution: ExecutionDetail
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function WorkflowDetail({ execution }: WorkflowDetailProps): RawHtml {
  const { state, activities, deferreds, clocks } = execution

  if (!state) {
    return (
      <Layout title="Workflow Not Found">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Workflow execution not found.</p>
              <a
                href="/workflows"
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                Back to list
              </a>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const pendingDeferreds = deferreds.filter((d) => !d.resolved)
  const canSendEvent = state.status === "suspended" && pendingDeferreds.length > 0

  return (
    <Layout title={`Workflow: ${state.workflowName}`}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-4">
            <a
              href="/workflows"
              className="text-blue-600 hover:underline text-sm"
            >
              &larr; Back to list
            </a>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {state.workflowName}
                </h1>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  {state.executionId}
                </p>
              </div>
              <StatusBadge status={state.status} />
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{" "}
                  <span className="text-gray-900">
                    {formatDate(state.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>{" "}
                  <span className="text-gray-900">
                    {formatDate(state.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Payload</h2>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {formatJson(state.payload)}
              </pre>
            </div>

            {activities.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900 mb-2">
                  Activities
                </h2>
                <ul className="space-y-2">
                  {activities.map((activity) => (
                    <li
                      key={activity.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {activity.status === "completed" ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : activity.status === "failed" ? (
                          <span className="text-red-600">&#10007;</span>
                        ) : (
                          <span className="text-yellow-600">&#9679;</span>
                        )}
                        <span className="font-mono">{activity.name}</span>
                      </span>
                      <span className="text-gray-500">
                        {activity.status} (attempt {activity.attempts})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {deferreds.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900 mb-2">
                  Waiting For
                </h2>
                <ul className="space-y-3">
                  {deferreds.map((deferred) => (
                    <li key={deferred.name} className="text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        {deferred.resolved ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : (
                          <span className="text-yellow-600">&#9679;</span>
                        )}
                        <span className="font-mono">{deferred.name}</span>
                        <span className="text-gray-500">
                          {deferred.resolved ? "(resolved)" : "(pending)"}
                        </span>
                      </div>
                      {!deferred.resolved && state.status === "suspended" && (
                        <form
                          method="post"
                          action={`/workflows/${state.executionId}/event`}
                          className="ml-6 flex gap-2"
                        >
                          <input
                            type="hidden"
                            name="deferredName"
                            value={deferred.name}
                          />
                          <textarea
                            name="value"
                            placeholder='{"ready": true, "estimatedShipDate": "2026-01-15"}'
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                            rows={2}
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Send
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {clocks.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900 mb-2">Clocks</h2>
                <ul className="space-y-2">
                  {clocks.map((clock) => (
                    <li
                      key={clock.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {clock.completed ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : (
                          <span className="text-yellow-600">&#9679;</span>
                        )}
                        <span className="font-mono">{clock.name}</span>
                      </span>
                      <span className="text-gray-500">
                        {clock.completed
                          ? "completed"
                          : `wakes at ${formatDate(clock.wakeAt)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.result !== undefined && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-green-800 mb-2">
                  Result
                </h2>
                <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                  {formatJson(state.result)}
                </pre>
              </div>
            )}

            {state.error !== undefined && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-red-800 mb-2">Error</h2>
                <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
                  {formatJson(state.error)}
                </pre>
              </div>
            )}

            {state.status !== "done" &&
              state.status !== "failed" &&
              state.status !== "interrupted" && (
                <div className="px-6 py-4">
                  <form
                    method="post"
                    action={`/workflows/${state.executionId}/cancel`}
                  >
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Cancel Workflow
                    </button>
                  </form>
                </div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
