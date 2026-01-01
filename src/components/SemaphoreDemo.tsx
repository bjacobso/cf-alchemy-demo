import { jsx, Fragment, RawHtml } from "../jsx-runtime";
import { Layout } from "./Layout";

interface SemaphoreStatus {
  available: number;
  active: number;
  queued: number;
  maxPermits: number;
}

interface SemaphoreDemoProps {
  status: SemaphoreStatus;
}

export function SemaphoreDemo({ status }: SemaphoreDemoProps): RawHtml {
  return (
    <Layout title="Semaphore Demo">
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center bg-white py-8 px-12 rounded-lg shadow-lg max-w-2xl mx-4">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Semaphore Demo</h1>
            <p className="text-gray-600 text-sm">
              Distributed semaphore using Cloudflare Durable Objects.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Limit concurrent operations across workers with automatic TTL expiration
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Current Status</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{status.available}</div>
                <div className="text-sm text-green-700">Available</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{status.active}</div>
                <div className="text-sm text-blue-700">Active</div>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{status.queued}</div>
                <div className="text-sm text-yellow-700">Queued</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{status.maxPermits}</div>
                <div className="text-sm text-gray-700">Max Permits</div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Configure</h3>
            <form method="post" action="/semaphore/configure" className="flex gap-2 justify-center">
              <input
                type="number"
                name="maxPermits"
                defaultValue={String(status.maxPermits)}
                min="1"
                max="100"
                className="w-24 px-3 py-2 border border-gray-300 rounded text-center"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded cursor-pointer transition-colors hover:bg-purple-600"
              >
                Set Max Permits
              </button>
            </form>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Simulate Work</h3>
            <p className="text-gray-500 text-xs mb-3">
              Acquire a permit, hold it for the specified duration, then auto-release
            </p>
            <form method="post" action="/semaphore/simulate" className="flex gap-2 justify-center">
              <input
                type="number"
                name="durationMs"
                defaultValue="3000"
                min="100"
                max="30000"
                step="100"
                className="w-28 px-3 py-2 border border-gray-300 rounded text-center"
              />
              <span className="py-2 text-gray-500">ms</span>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer transition-colors hover:bg-blue-600"
              >
                Simulate Work
              </button>
            </form>
          </div>

          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Manual Controls</h3>
            <div className="flex gap-4 justify-center mb-4">
              <form method="post" action="/semaphore/acquire" className="inline">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer transition-colors hover:bg-green-600"
                >
                  Acquire Permit
                </button>
              </form>
            </div>
            <form method="post" action="/semaphore/release" className="flex gap-2 justify-center">
              <input
                type="text"
                name="permitId"
                placeholder="Permit ID"
                className="w-64 px-3 py-2 border border-gray-300 rounded text-center"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer transition-colors hover:bg-red-600"
              >
                Release
              </button>
            </form>
          </div>

          <div className="text-center">
            <a href="/" className="text-blue-500 hover:text-blue-700 text-sm">
              Back to Counter
            </a>
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('Semaphore Demo loaded. Status:', ${JSON.stringify(status)});`,
        }}
      />
    </Layout>
  );
}
