import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// Schema for semaphore status response
export const SemaphoreStatusSchema = Schema.Struct({
  available: Schema.Number,
  active: Schema.Number,
  queued: Schema.Number,
  maxPermits: Schema.Number,
});

// Schema for configure request
export const ConfigureRequestSchema = Schema.Struct({
  maxPermits: Schema.Number,
});

// Schema for simulate work request
export const SimulateRequestSchema = Schema.Struct({
  durationMs: Schema.Number,
});

// Schema for simulate work response
export const SimulateResultSchema = Schema.Struct({
  permitId: Schema.String,
  durationMs: Schema.Number,
  success: Schema.Boolean,
});

// Schema for acquire response
export const AcquireResultSchema = Schema.Struct({
  permitId: Schema.String,
  expiresAt: Schema.Number,
});

// Schema for release request
export const ReleaseRequestSchema = Schema.Struct({
  permitId: Schema.String,
});

// Semaphore API group - demo endpoints for the semaphore Durable Object
export class SemaphoreGroup extends HttpApiGroup.make("semaphore")
  .add(HttpApiEndpoint.get("getDemoPage", "/demo").addSuccess(Schema.String))
  .add(HttpApiEndpoint.get("getStatus", "/status").addSuccess(SemaphoreStatusSchema))
  .add(
    HttpApiEndpoint.post("configure", "/configure")
      .setPayload(ConfigureRequestSchema)
      .addSuccess(Schema.Void),
  )
  .add(
    HttpApiEndpoint.post("simulateWork", "/simulate")
      .setPayload(SimulateRequestSchema)
      .addSuccess(SimulateResultSchema),
  )
  .add(HttpApiEndpoint.post("acquire", "/acquire").addSuccess(AcquireResultSchema))
  .add(
    HttpApiEndpoint.post("release", "/release")
      .setPayload(ReleaseRequestSchema)
      .addSuccess(Schema.Void),
  )
  .prefix("/semaphore") {}
