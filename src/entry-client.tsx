/**
 * Client Entry Point for React Hydration
 *
 * This module runs in the browser after the page loads. It:
 * 1. Reads the initial props that were serialized into the HTML by the server
 * 2. Calls hydrateRoot to attach React to the existing server-rendered DOM
 *
 * Hydration is the process where React "wakes up" the server-rendered HTML:
 * - It reconstructs its virtual DOM from the component tree
 * - Compares the virtual DOM to the actual DOM (they should match!)
 * - Attaches event listeners to the existing elements
 * - Makes the page interactive without re-rendering
 *
 * IMPORTANT: The component tree rendered here MUST match what the server rendered,
 * otherwise React will warn about hydration mismatches and may re-render.
 */

import { hydrateRoot } from "react-dom/client"
import { App, type AppProps } from "./components/App"

// Type declaration for the props bridge
// The server embeds props as: <script>window.__INITIAL_PROPS__ = {...}</script>
declare global {
  interface Window {
    __INITIAL_PROPS__: AppProps
  }
}

// Get the props that were serialized into the HTML
const props = window.__INITIAL_PROPS__

// Find the root element where the server rendered the app
const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error(
    "Root element not found. Make sure the server renders a <div id=\"root\">",
  )
}

// Hydrate - attach React to the existing DOM
// This is different from createRoot().render() which would blow away the DOM
hydrateRoot(rootElement, <App {...props} />)
