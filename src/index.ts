import { makeHandler } from "./runtime";
import type { Env } from "./services/CloudflareEnv";

// Re-export Durable Object for Cloudflare
export { Counter } from "./durable-objects/Counter";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { handler } = makeHandler(env);
    return handler(request);
  },
};
