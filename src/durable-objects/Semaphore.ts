import { DurableObject } from "cloudflare:workers";
import type { Env } from "../services/CloudflareEnv";

interface SemaphoreConfig {
  maxPermits: number;
  defaultTimeoutMs: number;
}

interface ActivePermit {
  id: string;
  acquiredAt: number;
  expiresAt: number;
}

interface QueuedWaiter {
  id: string;
  requestedAt: number;
  timeoutAt: number;
  permitTTLMs: number;
}

export type AcquireResult =
  | { success: true; permitId: string; expiresAt: number }
  | { success: false; reason: "timeout" | "rejected"; waiterId?: string };

export type ReleaseResult = { success: boolean; error?: string };

export interface SemaphoreStatus {
  available: number;
  active: number;
  queued: number;
  maxPermits: number;
}

export class Semaphore extends DurableObject<Env> {
  private config: SemaphoreConfig | null = null;
  private activePermits: Map<string, ActivePermit> = new Map();
  private waitQueue: QueuedWaiter[] = [];
  private initialized = false;

  private async hydrateState(): Promise<void> {
    if (this.initialized) return;

    const stored = await this.ctx.storage.get<{
      config: SemaphoreConfig | null;
      permits: [string, ActivePermit][];
      queue: QueuedWaiter[];
    }>("state");

    if (stored) {
      this.config = stored.config;
      this.activePermits = new Map(stored.permits);
      this.waitQueue = stored.queue;
    }

    this.initialized = true;
  }

  private async persistState(): Promise<void> {
    await this.ctx.storage.put("state", {
      config: this.config,
      permits: Array.from(this.activePermits.entries()),
      queue: this.waitQueue,
    });
  }

  async configure(maxPermits: number, defaultTimeoutMs: number = 30000): Promise<void> {
    await this.hydrateState();
    this.config = { maxPermits, defaultTimeoutMs };
    await this.persistState();
  }

  async getConfig(): Promise<SemaphoreConfig | null> {
    await this.hydrateState();
    return this.config;
  }

  async tryAcquire(permitTTLMs: number = 60000): Promise<AcquireResult> {
    await this.hydrateState();
    await this.cleanupExpiredPermits();

    // Auto-configure with mutex defaults if not configured
    if (!this.config) {
      this.config = { maxPermits: 1, defaultTimeoutMs: 30000 };
    }

    if (this.activePermits.size < this.config.maxPermits) {
      const permit = this.createPermit(permitTTLMs);
      this.activePermits.set(permit.id, permit);
      await this.persistState();
      await this.scheduleCleanupAlarm();

      return { success: true, permitId: permit.id, expiresAt: permit.expiresAt };
    }

    return { success: false, reason: "rejected" };
  }

  async acquire(timeoutMs?: number, permitTTLMs: number = 60000): Promise<AcquireResult> {
    await this.hydrateState();
    await this.cleanupExpiredPermits();

    // Auto-configure with mutex defaults if not configured
    if (!this.config) {
      this.config = { maxPermits: 1, defaultTimeoutMs: 30000 };
    }

    const timeout = timeoutMs ?? this.config.defaultTimeoutMs;

    // Try immediate acquisition
    if (this.activePermits.size < this.config.maxPermits) {
      const permit = this.createPermit(permitTTLMs);
      this.activePermits.set(permit.id, permit);
      await this.persistState();
      await this.scheduleCleanupAlarm();

      return { success: true, permitId: permit.id, expiresAt: permit.expiresAt };
    }

    // Add to queue
    const waiter: QueuedWaiter = {
      id: crypto.randomUUID(),
      requestedAt: Date.now(),
      timeoutAt: Date.now() + timeout,
      permitTTLMs,
    };

    this.waitQueue.push(waiter);
    await this.persistState();
    await this.scheduleCleanupAlarm();

    // Return waiter ID for polling
    return { success: false, reason: "rejected", waiterId: waiter.id };
  }

  async checkWaiter(waiterId: string): Promise<AcquireResult> {
    await this.hydrateState();
    await this.cleanupExpiredPermits();
    await this.processQueue();

    // Check if waiter got a permit (permit ID matches waiter ID)
    const permit = this.activePermits.get(waiterId);
    if (permit) {
      return { success: true, permitId: permit.id, expiresAt: permit.expiresAt };
    }

    // Check if still waiting
    const waiter = this.waitQueue.find((w) => w.id === waiterId);
    if (waiter) {
      if (Date.now() > waiter.timeoutAt) {
        // Remove timed-out waiter
        this.waitQueue = this.waitQueue.filter((w) => w.id !== waiterId);
        await this.persistState();
        return { success: false, reason: "timeout" };
      }
      // Still waiting
      return { success: false, reason: "rejected", waiterId };
    }

    // Waiter not found (already processed or expired)
    return { success: false, reason: "timeout" };
  }

  async release(permitId: string): Promise<ReleaseResult> {
    await this.hydrateState();

    if (!this.activePermits.has(permitId)) {
      return { success: false, error: "Permit not found" };
    }

    this.activePermits.delete(permitId);
    await this.processQueue();
    await this.persistState();

    return { success: true };
  }

  async status(): Promise<SemaphoreStatus> {
    await this.hydrateState();
    await this.cleanupExpiredPermits();

    const maxPermits = this.config?.maxPermits ?? 1;
    return {
      available: Math.max(0, maxPermits - this.activePermits.size),
      active: this.activePermits.size,
      queued: this.waitQueue.length,
      maxPermits,
    };
  }

  private createPermit(ttlMs: number): ActivePermit {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      acquiredAt: now,
      expiresAt: now + ttlMs,
    };
  }

  private async cleanupExpiredPermits(): Promise<void> {
    const now = Date.now();
    let changed = false;

    for (const [id, permit] of this.activePermits) {
      if (now > permit.expiresAt) {
        this.activePermits.delete(id);
        changed = true;
      }
    }

    // Remove timed-out waiters
    const originalLength = this.waitQueue.length;
    this.waitQueue = this.waitQueue.filter((w) => now <= w.timeoutAt);
    if (this.waitQueue.length !== originalLength) {
      changed = true;
    }

    if (changed) {
      await this.persistState();
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.config) return;

    while (this.waitQueue.length > 0 && this.activePermits.size < this.config.maxPermits) {
      const waiter = this.waitQueue.shift()!;

      // Skip expired waiters
      if (Date.now() > waiter.timeoutAt) continue;

      // Grant permit to waiter (use waiter ID as permit ID for easy lookup)
      const permit: ActivePermit = {
        id: waiter.id,
        acquiredAt: Date.now(),
        expiresAt: Date.now() + waiter.permitTTLMs,
      };
      this.activePermits.set(permit.id, permit);
    }

    await this.persistState();
  }

  private async scheduleCleanupAlarm(): Promise<void> {
    // Find the earliest expiration
    let earliestExpiry = Infinity;

    for (const permit of this.activePermits.values()) {
      earliestExpiry = Math.min(earliestExpiry, permit.expiresAt);
    }

    for (const waiter of this.waitQueue) {
      earliestExpiry = Math.min(earliestExpiry, waiter.timeoutAt);
    }

    if (earliestExpiry < Infinity) {
      // Add small buffer to ensure we're past expiry
      await this.ctx.storage.setAlarm(earliestExpiry + 100);
    }
  }

  async alarm(): Promise<void> {
    await this.hydrateState();
    await this.cleanupExpiredPermits();
    await this.processQueue();
    await this.scheduleCleanupAlarm();
  }
}
