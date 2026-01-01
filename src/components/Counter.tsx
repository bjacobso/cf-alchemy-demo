// @ts-nocheck - Legacy custom JSX component, not type-checked with React types
/** @jsx jsx */
/** @jsxFrag Fragment */
import { jsx, Fragment, RawHtml } from "../jsx-runtime";
import { Layout } from "./Layout";

interface CounterProps {
  count: number;
}

export function Counter({ count }: CounterProps): RawHtml {
  return (
    <Layout title="Counter">
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center bg-white py-8 px-12 rounded-lg shadow-lg max-w-2xl mx-4">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Meta Framework from First Principles
            </h1>
            <p className="text-gray-600 text-sm">
              Building a complete web application without React, Next.js, or traditional frameworks.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Custom JSX runtime (~100 lines) • Server-side TSX • Cloudflare Durable Objects • No
              client JavaScript
            </p>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Counter</h2>
          <div className="text-6xl font-bold my-4">{count}</div>
          <div className="flex gap-4 justify-center">
            <form method="post" action="/decrement" className="inline">
              <button
                type="submit"
                className="text-2xl py-2 px-6 bg-red-500 text-white rounded cursor-pointer transition-colors hover:bg-red-600"
              >
                -
              </button>
            </form>
            <form method="post" action="/increment" className="inline">
              <button
                type="submit"
                className="text-2xl py-2 px-6 bg-green-500 text-white rounded cursor-pointer transition-colors hover:bg-green-600"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('SSR Counter loaded. Current count:', ${count});`,
        }}
      />
    </Layout>
  );
}
