import { DurableObject } from "cloudflare:workers";
import { Schema } from "effect";
import type { Env } from "../services/CloudflareEnv";
import { IndexEntry as IndexEntrySchema, type IndexEntry } from "../workflow/schemas";

// Re-export the type for external use
export type { IndexEntry };

// Decoder for validating storage data
const decodeIndexEntry = Schema.decodeUnknownSync(IndexEntrySchema);

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
    // Validate entry before storing
    const validated = decodeIndexEntry(entry);
    await this.ctx.storage.put(`execution:${validated.executionId}`, validated);
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
    const entries = await this.ctx.storage.list<unknown>({
      prefix: "execution:",
      limit,
    });

    const result: IndexEntry[] = [];
    for (const [, entry] of entries) {
      // Validate each entry from storage
      result.push(decodeIndexEntry(entry));
    }

    // Sort by creation time, newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get a single execution entry
   */
  async get(executionId: string): Promise<IndexEntry | undefined> {
    const entry = await this.ctx.storage.get<unknown>(`execution:${executionId}`);
    if (!entry) return undefined;
    return decodeIndexEntry(entry);
  }

  /**
   * Delete an execution from the index
   */
  async delete(executionId: string): Promise<void> {
    await this.ctx.storage.delete(`execution:${executionId}`);
  }
}
