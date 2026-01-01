import { DurableObject } from "cloudflare:workers";
import type { Env } from "../services/CloudflareEnv";

/**
 * Index entry for a workflow execution
 */
export interface IndexEntry {
  executionId: string;
  workflowName: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * WorkflowIndex Durable Object
 *
 * Maintains an index of all workflow executions for listing purposes.
 * Since Durable Objects are keyed by ID and can't be enumerated,
 * we need this separate index to track all executions.
 *
 * Uses a single global instance: idFromName("global")
 */
export class WorkflowIndex extends DurableObject<Env> {
  /**
   * Register a new workflow execution
   */
  async register(entry: IndexEntry): Promise<void> {
    await this.ctx.storage.put(`execution:${entry.executionId}`, entry);
  }

  /**
   * Update the status of an existing execution
   */
  async updateStatus(executionId: string, status: string): Promise<void> {
    const entry = await this.ctx.storage.get<IndexEntry>(`execution:${executionId}`);
    if (entry) {
      entry.status = status;
      entry.updatedAt = Date.now();
      await this.ctx.storage.put(`execution:${executionId}`, entry);
    }
  }

  /**
   * List all workflow executions, sorted by creation time (newest first)
   */
  async list(limit = 100): Promise<IndexEntry[]> {
    const entries = await this.ctx.storage.list<IndexEntry>({
      prefix: "execution:",
      limit,
    });

    const result: IndexEntry[] = [];
    for (const [, entry] of entries) {
      result.push(entry);
    }

    // Sort by creation time, newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get a single execution entry
   */
  async get(executionId: string): Promise<IndexEntry | undefined> {
    return this.ctx.storage.get<IndexEntry>(`execution:${executionId}`);
  }

  /**
   * Delete an execution from the index
   */
  async delete(executionId: string): Promise<void> {
    await this.ctx.storage.delete(`execution:${executionId}`);
  }
}
