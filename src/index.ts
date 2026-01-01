import type { worker } from "../alchemy.run";
import { DurableObject, env } from "cloudflare:workers";

export class Counter extends DurableObject {
  declare env: typeof worker.Env;
  private count: number = 0;

  constructor(ctx: DurableObjectState, env: typeof worker.Env) {
    super(ctx, env);
    this.count = 0;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Load current count from storage
    const stored = await this.ctx.storage.get<number>("count");
    this.count = stored ?? 0;

    if (url.pathname === "/increment") {
      this.count++;
    } else if (url.pathname === "/decrement") {
      this.count--;
    }

    await this.ctx.storage.put("count", this.count);
    return Response.json({ count: this.count });
  }
}

export default {
  async fetch(request: Request) {
    const id = env.COUNTER.idFromName("A");
    const stub = env.COUNTER.get(id);
    return stub.fetch(request);
  },
};
