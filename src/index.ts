import { DurableObject } from "cloudflare:workers"
import { Counter as CounterPage } from "./components/Counter"

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

    // Handle POST requests for increment/decrement (form submissions)
    if (request.method === "POST") {
      if (url.pathname === "/increment") {
        this.count++
        await this.ctx.storage.put("count", this.count)
      } else if (url.pathname === "/decrement") {
        this.count--
        await this.ctx.storage.put("count", this.count)
      }
      // Redirect back to home page (Post/Redirect/Get pattern)
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      })
    }

    // Render the page using TSX
    const html = "<!DOCTYPE html>" + CounterPage({ count: this.count })
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const id = env.COUNTER.idFromName("A")
    const stub = env.COUNTER.get(id)
    return stub.fetch(request)
  },
}
