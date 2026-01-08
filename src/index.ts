import { makeHandler } from "./runtime";
import type { Env } from "./services/CloudflareEnv";

// Re-export Durable Objects for Cloudflare
export { Counter } from "./durable-objects/Counter";
export { Semaphore } from "./durable-objects/Semaphore";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { handler } = makeHandler(env);
    return handler(request);
  },
};
