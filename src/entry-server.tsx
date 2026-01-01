/**
 * Server Entry Point for React SSR
 *
 * This module runs in the Cloudflare Worker and exports a render function
 * that converts React components to HTML strings using renderToString.
 *
 * The Effect handler calls this function with props, and the returned HTML
 * is embedded in the full HTML document along with a <script> tag that
 * loads the client bundle for hydration.
 */

import { renderToString } from "react-dom/server"
import { App, type AppProps } from "./components/App"

/**
 * Render the React app to an HTML string for SSR
 *
 * @param props - The props to pass to the App component
 * @returns HTML string representation of the React component tree
 *
 * @example
 * const html = render({ count: 5 })
 * // Returns: '<div class="..."><div class="text-6xl">5</div>...</div>'
 */
export function render(props: AppProps): string {
  return renderToString(<App {...props} />)
}

// Re-export types for use in handlers
export type { AppProps }
