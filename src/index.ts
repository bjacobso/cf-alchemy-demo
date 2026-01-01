import { DurableObject } from "cloudflare:workers"

interface Env {
  COUNTER: DurableObjectNamespace<Counter>
}

export class Counter extends DurableObject<Env> {
  private count: number = 0

  async fetch(request: Request) {
    const url = new URL(request.url)

    // Load current count from storage
    const stored = await this.ctx.storage.get<number>("count")
    this.count = stored ?? 0

    if (url.pathname === "/increment") {
      this.count++
    } else if (url.pathname === "/decrement") {
      this.count--
    }

    await this.ctx.storage.put("count", this.count)
    return Response.json({ count: this.count })
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const id = env.COUNTER.idFromName("A")
    const stub = env.COUNTER.get(id)
    return stub.fetch(request)
  },
}
