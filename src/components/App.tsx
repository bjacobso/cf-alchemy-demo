/**
 * React App Component
 *
 * This is the main React component that renders both on the server (SSR)
 * and hydrates on the client. It demonstrates the key concepts:
 *
 * 1. Props come from the server (count from Durable Object SQLite)
 * 2. useState initializes from server props
 * 3. Client-side interactions use fetch() instead of form submissions
 * 4. Optimistic updates give instant feedback
 *
 * Compare to the original Counter.tsx which used:
 * - Custom JSX runtime (jsx-runtime.ts)
 * - Form-based interactivity (<form method="post" action="/increment">)
 * - Full page reloads on every interaction
 */

import { useState } from "react"

export interface AppProps {
  count: number
}

export function App({ count: initialCount }: AppProps) {
  // Initialize state from server-provided props
  // This is the "hydration" part - React takes over from here
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleIncrement = async () => {
    // Optimistic update - change UI immediately
    setCount((c) => c + 1)
    setLoading(true)

    try {
      // POST to the same endpoint, but now it returns JSON instead of redirect
      const response = await fetch("/increment", { method: "POST" })
      const data = (await response.json()) as { count: number }

      // Sync with server state (in case of concurrent updates)
      setCount(data.count)
    } catch (error) {
      // Rollback on error
      setCount((c) => c - 1)
      console.error("Failed to increment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecrement = async () => {
    setCount((c) => c - 1)
    setLoading(true)

    try {
      const response = await fetch("/decrement", { method: "POST" })
      const data = (await response.json()) as { count: number }
      setCount(data.count)
    } catch (error) {
      setCount((c) => c + 1)
      console.error("Failed to decrement:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center bg-white py-8 px-12 rounded-lg shadow-lg max-w-2xl mx-4">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            React SSR with Hydration
          </h1>
          <p className="text-gray-600 text-sm">
            Server-side rendered React with client-side hydration on Cloudflare
            Workers.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Vite SSR • React 18 • Effect services • Durable Objects
          </p>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Counter</h2>
        <div className="text-6xl font-bold my-4">{count}</div>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={loading}
            className="text-2xl py-2 px-6 bg-red-500 text-white rounded cursor-pointer transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={loading}
            className="text-2xl py-2 px-6 bg-green-500 text-white rounded cursor-pointer transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        {loading && (
          <p className="text-gray-500 text-sm mt-4">Syncing with server...</p>
        )}
      </div>
    </div>
  )
}
