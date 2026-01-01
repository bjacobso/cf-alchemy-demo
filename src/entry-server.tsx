/**
 * Server Entry Point for React SSR
 *
 * This module runs in the Cloudflare Worker and exports render functions
 * that convert React components to HTML strings using renderToString.
 *
 * The Effect handlers call these functions with props, and the returned HTML
 * is embedded in the full HTML document along with optional client-side hydration.
 */

import { renderToString } from "react-dom/server";
import { App, type AppProps } from "./components/App";
import { SwaggerUI, type SwaggerUIProps } from "./components/SwaggerUI";

/**
 * Render the Counter app to an HTML string for SSR
 *
 * @param props - The props to pass to the App component
 * @returns HTML string representation of the React component tree
 *
 * @example
 * const html = render({ count: 5 })
 * // Returns: '<div class="..."><div class="text-6xl">5</div>...</div>'
 */
export function render(props: AppProps): string {
  return renderToString(<App {...props} />);
}

/**
 * Render the Swagger docs to an HTML string for SSR
 *
 * @param props - The OpenAPI spec to render
 * @returns HTML string representation of the docs
 */
export function renderDocs(props: SwaggerUIProps): string {
  return renderToString(<SwaggerUI {...props} />);
}

// Re-export types for use in handlers
export type { AppProps, SwaggerUIProps };
