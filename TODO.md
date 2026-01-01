# TODO: Meta Framework from First Principles

Next steps to expand this educational project.

## Core Framework

- [ ] **Client-side hydration** - Add optional JS for interactive components without a full framework
- [ ] **File-based routing** - Auto-generate routes from `src/pages/*.tsx` files
- [ ] **Nested layouts** - Layout components that wrap child routes
- [ ] **Form handling utilities** - Parse FormData, validation helpers, typed actions

## JSX Runtime Enhancements

- [ ] **Fragments** - Support `<>...</>` syntax for multiple root elements
- [ ] **Async components** - Server components that `await` data before rendering
- [ ] **Streaming HTML** - Render with `ReadableStream` for faster TTFB
- [ ] **CSS-in-JSX** - Scoped styles that render to `<style>` tags

## State & Data

- [ ] **Multiple Durable Objects** - Route to different DOs by path/ID
- [ ] **Sessions** - Cookie-based session management on the edge
- [ ] **Typed storage helpers** - Generic `get<T>`/`put<T>` with schema validation
- [ ] **SQLite integration** - Use DO's built-in SQLite for complex queries

## Developer Experience

- [ ] **Hot reload** - Watch mode with automatic browser refresh
- [ ] **Error boundaries** - Catch render errors and display fallback UI
- [ ] **Dev tools overlay** - Show request timing, DO state in development
- [ ] **Type-safe routes** - Generate route types from file structure

## Production Ready

- [ ] **Asset handling** - Static files with cache headers
- [ ] **Image optimization** - Resize/compress images at the edge
- [ ] **Rate limiting** - Per-IP rate limits using DO state
- [ ] **Observability** - Structured logging, request tracing

## Documentation

- [ ] **Architecture deep-dive** - Explain each abstraction layer
- [ ] **Comparison guide** - Side-by-side with Next.js/Remix patterns
- [ ] **Tutorial series** - Build a real app step by step
