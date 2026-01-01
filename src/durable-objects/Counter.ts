import { DurableObject } from "cloudflare:workers"
import type { Env } from "../services/CloudflareEnv"

// Counter Durable Object with RPC-style methods for Effect service access
export class Counter extends DurableObject<Env> {
  private count: number = 0

  async getCount(): Promise<number> {
    const stored = await this.ctx.storage.get<number>("count")
    this.count = stored ?? 0
    return this.count
  }

  async increment(): Promise<void> {
    await this.getCount()
    this.count++
    await this.ctx.storage.put("count", this.count)
  }

  async decrement(): Promise<void> {
    await this.getCount()
    this.count--
    await this.ctx.storage.put("count", this.count)
  }
}
