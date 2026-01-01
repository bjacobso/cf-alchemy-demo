import { DurableObject } from "cloudflare:workers";
import { Schema } from "effect";
import type { Env } from "../services/CloudflareEnv";
import type { WorkflowIndex, IndexEntry } from "./WorkflowIndex";
import {
  ExecutionState as ExecutionStateSchema,
  ActivityEntry as ActivityEntrySchema,
  DeferredEntry as DeferredEntrySchema,
  ClockEntry as ClockEntrySchema,
  type ExecutionState,
  type ActivityEntry,
  type DeferredEntry,
  type ClockEntry,
} from "../workflow/schemas";

// Decoders for validating storage data
const decodeExecutionState = Schema.decodeUnknownSync(ExecutionStateSchema);
const decodeActivityEntry = Schema.decodeUnknownSync(ActivityEntrySchema);
const decodeDeferredEntry = Schema.decodeUnknownSync(DeferredEntrySchema);
const decodeClockEntry = Schema.decodeUnknownSync(ClockEntrySchema);

/**
 * WorkflowExecution Durable Object
 *
 * Provides durable persistence for @effect/workflow executions.
 * Each workflow execution gets its own DO instance (keyed by executionId).
 *
 * Storage keys:
 * - "state": ExecutionState
 * - "activity:{name}": ActivityEntry
 * - "deferred:{name}": DeferredEntry
 * - "clock:{name}": ClockEntry
 */
export class WorkflowExecution extends DurableObject<Env> {
  // ========== State Management ==========

  private async getState(): Promise<ExecutionState | undefined> {
    const state = await this.ctx.storage.get<unknown>("state");
    if (!state) return undefined;
    return decodeExecutionState(state);
  }

  private async setState(state: ExecutionState): Promise<void> {
    state.updatedAt = Date.now();
    await this.ctx.storage.put("state", state);
  }

  // Get the global WorkflowIndex stub
  private getIndexStub(): DurableObjectStub<WorkflowIndex> {
    return this.env.WORKFLOW_INDEX.get(this.env.WORKFLOW_INDEX.idFromName("global"));
  }

  // Notify the index of a status change
  private async notifyIndex(state: ExecutionState): Promise<void> {
    const indexStub = this.getIndexStub();
    await indexStub.updateStatus(state.executionId, state.status);
  }

  // ========== Initialization ==========

  async execute(executionId: string, workflowName: string, payload: unknown): Promise<void> {
    const existing = await this.getState();
    if (existing) {
      // Already initialized - idempotent
      return;
    }

    const now = Date.now();
    const state: ExecutionState = {
      executionId,
      workflowName,
      status: "running",
      payload,
      createdAt: now,
      updatedAt: now,
    };
    await this.setState(state);

    // Register with the global index
    const indexStub = this.getIndexStub();
    await indexStub.register({
      executionId,
      workflowName,
      status: "running",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ========== Status Methods ==========

  async poll(): Promise<{ status: string; result?: unknown; error?: unknown } | undefined> {
    const state = await this.getState();
    if (!state) return undefined;

    return {
      status: state.status,
      result: state.result,
      error: state.error,
    };
  }

  async interrupt(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    state.status = "interrupted";
    await this.setState(state);
    await this.notifyIndex(state);
  }

  async resume(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    if (state.status === "suspended") {
      state.status = "running";
      await this.setState(state);
      await this.notifyIndex(state);
    }
  }

  async complete(result: unknown): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    state.status = "done";
    state.result = result;
    await this.setState(state);
    await this.notifyIndex(state);
  }

  async fail(error: unknown): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    state.status = "failed";
    state.error = error;
    await this.setState(state);
    await this.notifyIndex(state);
  }

  async suspend(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    state.status = "suspended";
    await this.setState(state);
    await this.notifyIndex(state);
  }

  // ========== Activity Methods ==========

  async getActivity(name: string): Promise<ActivityEntry | undefined> {
    const entry = await this.ctx.storage.get<unknown>(`activity:${name}`);
    if (!entry) return undefined;
    return decodeActivityEntry(entry);
  }

  async activityStart(name: string, attempt: number): Promise<void> {
    const existing = await this.getActivity(name);
    const entry: ActivityEntry = {
      name,
      attempts: attempt,
      status: "running",
      result: existing?.result,
      error: existing?.error,
    };
    await this.ctx.storage.put(`activity:${name}`, entry);
  }

  async activityComplete(name: string, result: unknown): Promise<void> {
    const existing = await this.getActivity(name);
    const entry: ActivityEntry = {
      name,
      attempts: existing?.attempts ?? 1,
      status: "completed",
      result,
    };
    await this.ctx.storage.put(`activity:${name}`, entry);
  }

  async activityFail(name: string, error: unknown): Promise<void> {
    const existing = await this.getActivity(name);
    const entry: ActivityEntry = {
      name,
      attempts: existing?.attempts ?? 1,
      status: "failed",
      error,
    };
    await this.ctx.storage.put(`activity:${name}`, entry);
  }

  // ========== Deferred Methods (DurableDeferred) ==========

  async getDeferred(name: string): Promise<DeferredEntry | undefined> {
    const entry = await this.ctx.storage.get<unknown>(`deferred:${name}`);
    if (!entry) return undefined;
    return decodeDeferredEntry(entry);
  }

  async deferredResult(name: string): Promise<unknown | undefined> {
    const entry = await this.getDeferred(name);
    if (entry?.resolved) {
      return entry.value;
    }
    return undefined;
  }

  async deferredDone(name: string, value: unknown): Promise<void> {
    const entry: DeferredEntry = {
      name,
      resolved: true,
      value,
    };
    await this.ctx.storage.put(`deferred:${name}`, entry);

    // Resume the workflow if suspended
    await this.resume();
  }

  async registerDeferred(name: string): Promise<void> {
    const existing = await this.getDeferred(name);
    if (existing) return; // Already registered

    const entry: DeferredEntry = {
      name,
      resolved: false,
    };
    await this.ctx.storage.put(`deferred:${name}`, entry);
  }

  // ========== Clock Methods (DurableClock.sleep) ==========

  async getClock(name: string): Promise<ClockEntry | undefined> {
    const entry = await this.ctx.storage.get<unknown>(`clock:${name}`);
    if (!entry) return undefined;
    return decodeClockEntry(entry);
  }

  async scheduleClock(name: string, wakeAt: number): Promise<void> {
    const existing = await this.getClock(name);
    if (existing?.completed) {
      // Already completed - no need to reschedule
      return;
    }

    const entry: ClockEntry = {
      name,
      wakeAt,
      completed: false,
    };
    await this.ctx.storage.put(`clock:${name}`, entry);

    // Suspend the workflow
    await this.suspend();

    // Schedule the alarm
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (!currentAlarm || wakeAt < currentAlarm) {
      await this.ctx.storage.setAlarm(wakeAt);
    }
  }

  async isClockComplete(name: string): Promise<boolean> {
    const entry = await this.getClock(name);
    return entry?.completed ?? false;
  }

  // ========== Alarm Handler ==========

  async alarm(): Promise<void> {
    const now = Date.now();

    // Find all clocks that should fire
    const allKeys = await this.ctx.storage.list<ClockEntry>({
      prefix: "clock:",
    });

    let nextWakeAt: number | undefined;

    for (const [key, entry] of allKeys) {
      if (!entry.completed && entry.wakeAt <= now) {
        // Mark clock as completed
        entry.completed = true;
        await this.ctx.storage.put(key, entry);
      } else if (!entry.completed && entry.wakeAt > now) {
        // Track next alarm time
        if (!nextWakeAt || entry.wakeAt < nextWakeAt) {
          nextWakeAt = entry.wakeAt;
        }
      }
    }

    // Resume the workflow
    await this.resume();

    // Schedule next alarm if needed
    if (nextWakeAt) {
      await this.ctx.storage.setAlarm(nextWakeAt);
    }
  }

  // ========== Utility Methods ==========

  async getFullState(): Promise<{
    state: ExecutionState | undefined;
    activities: Record<string, ActivityEntry>;
    deferreds: Record<string, DeferredEntry>;
    clocks: Record<string, ClockEntry>;
  }> {
    const state = await this.getState();
    const activities: Record<string, ActivityEntry> = {};
    const deferreds: Record<string, DeferredEntry> = {};
    const clocks: Record<string, ClockEntry> = {};

    const activityEntries = await this.ctx.storage.list<unknown>({
      prefix: "activity:",
    });
    for (const [key, entry] of activityEntries) {
      activities[key.replace("activity:", "")] = decodeActivityEntry(entry);
    }

    const deferredEntries = await this.ctx.storage.list<unknown>({
      prefix: "deferred:",
    });
    for (const [key, entry] of deferredEntries) {
      deferreds[key.replace("deferred:", "")] = decodeDeferredEntry(entry);
    }

    const clockEntries = await this.ctx.storage.list<unknown>({
      prefix: "clock:",
    });
    for (const [key, entry] of clockEntries) {
      clocks[key.replace("clock:", "")] = decodeClockEntry(entry);
    }

    return { state, activities, deferreds, clocks };
  }
}
