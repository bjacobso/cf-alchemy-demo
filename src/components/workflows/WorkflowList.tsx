import { jsx, RawHtml } from "../../jsx-runtime"
import { Layout } from "../Layout"
import { StatusBadge } from "./StatusBadge"
import type { IndexEntry } from "../../durable-objects/WorkflowIndex"

interface WorkflowListProps {
  executions: IndexEntry[]
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    return "just now"
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} min${mins > 1 ? "s" : ""} ago`
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hr${hours > 1 ? "s" : ""} ago`
  }
  return date.toLocaleDateString()
}

export function WorkflowList({ executions }: WorkflowListProps): RawHtml {
  return (
    <Layout title="Workflow Executions">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Workflow Executions
            </h1>
            <a
              href="/workflows/start"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Start New Workflow
            </a>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            {executions.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No workflow executions yet.{" "}
                <a href="/workflows/start" className="text-blue-600 hover:underline">
                  Start one
                </a>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {executions.map((exec) => (
                    <tr key={exec.executionId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {exec.executionId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exec.workflowName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={exec.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(exec.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/workflows/${exec.executionId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
