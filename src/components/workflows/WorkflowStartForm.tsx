import { jsx, RawHtml } from "../../jsx-runtime";
import { Layout } from "../Layout";
import type { AvailableWorkflow } from "../../services/WorkflowService";

interface WorkflowStartFormProps {
  workflows: AvailableWorkflow[];
  error?: string;
}

export function WorkflowStartForm({ workflows, error }: WorkflowStartFormProps): RawHtml {
  const defaultPayload = JSON.stringify(
    {
      orderId: `ORD-${Date.now()}`,
      customerId: "CUST-001",
      items: [{ productId: "PROD-001", quantity: 2 }],
    },
    null,
    2,
  );

  return (
    <Layout title="Start Workflow">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-4">
            <a href="/workflows" className="text-blue-600 hover:underline text-sm">
              &larr; Back to list
            </a>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Start New Workflow</h1>
            </div>

            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form method="post" action="/workflows/start" className="px-6 py-4">
              <div className="mb-4">
                <label
                  htmlFor="workflowName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Workflow
                </label>
                <select
                  id="workflowName"
                  name="workflowName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {workflows.map((wf) => (
                    <option key={wf.name} value={wf.name}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="payload" className="block text-sm font-medium text-gray-700 mb-1">
                  Payload (JSON)
                </label>
                <textarea
                  id="payload"
                  name="payload"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="{}"
                >
                  {defaultPayload}
                </textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
