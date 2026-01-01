/**
 * HTML Document Builder for React SSR
 *
 * This module creates the full HTML document that wraps the React-rendered
 * app HTML. It handles:
 *
 * 1. The "props bridge" - serializing props as JSON for the client
 * 2. XSS prevention when embedding JSON in HTML
 * 3. Including the Tailwind CSS (compiled at build time)
 * 4. Embedding the client bundle inline for hydration
 *
 * The key insight is that SSR produces just the app HTML, but we need
 * a complete HTML document with <html>, <head>, <body>, etc.
 *
 * Note: We embed the client bundle inline rather than serving it as a
 * separate file. This avoids needing static file hosting (Cloudflare Assets,
 * R2, etc.) for this demo. In production, you'd typically serve the bundle
 * from a CDN with proper caching headers.
 */

import { tailwindCSS } from "../styles/tailwind.generated"
import { clientBundle } from "./client-bundle.generated"

interface CreateHtmlDocumentOptions {
  /** Page title for <title> tag */
  title: string
  /** React-rendered HTML string from renderToString() */
  appHtml: string
  /** Props to serialize for client hydration */
  props: Record<string, unknown>
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  )
}

/**
 * Create a complete HTML document with embedded React app
 *
 * @example
 * const html = createHtmlDocument({
 *   title: "Counter",
 *   appHtml: renderToString(<App count={5} />),
 *   props: { count: 5 }
 * })
 */
export function createHtmlDocument({
  title,
  appHtml,
  props,
}: CreateHtmlDocumentOptions): string {
  // Serialize props for the client
  // IMPORTANT: We must escape < and > to prevent XSS attacks
  // A malicious count like "</script><script>alert('xss')" would break out
  const safeProps = JSON.stringify(props)
    .replace(/</g, "\\u003c") // Escape < to prevent </script> injection
    .replace(/>/g, "\\u003e") // Escape > for completeness

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>${tailwindCSS}</style>
    <script>
      // Props bridge: server passes data to client for hydration
      // The client reads this before calling hydrateRoot()
      window.__INITIAL_PROPS__ = ${safeProps};
    </script>
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module">${clientBundle}</script>
  </body>
</html>`
}
