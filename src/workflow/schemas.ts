import { Schema } from "effect";

// ========== Status Literal Unions ==========

export const ExecutionStatus = Schema.Literal(
  "running",
  "suspended",
  "done",
  "failed",
  "interrupted",
);

export const ActivityStatus = Schema.Literal("pending", "running", "completed", "failed");

// ========== Core Data Schemas ==========
// Using mutable() to allow property assignment after decoding

export const ExecutionState = Schema.mutable(
  Schema.Struct({
    executionId: Schema.String,
    workflowName: Schema.String,
    status: ExecutionStatus,
    payload: Schema.Unknown,
    result: Schema.optional(Schema.Unknown),
    error: Schema.optional(Schema.Unknown),
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
  }),
);

export const ActivityEntry = Schema.mutable(
  Schema.Struct({
    name: Schema.String,
    attempts: Schema.Number,
    status: ActivityStatus,
    result: Schema.optional(Schema.Unknown),
    error: Schema.optional(Schema.Unknown),
  }),
);

export const DeferredEntry = Schema.mutable(
  Schema.Struct({
    name: Schema.String,
    resolved: Schema.Boolean,
    value: Schema.optional(Schema.Unknown),
  }),
);

export const ClockEntry = Schema.mutable(
  Schema.Struct({
    name: Schema.String,
    wakeAt: Schema.Number,
    completed: Schema.Boolean,
  }),
);

export const IndexEntry = Schema.mutable(
  Schema.Struct({
    executionId: Schema.String,
    workflowName: Schema.String,
    status: Schema.String,
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
  }),
);

// ========== Full State Schema (for RPC responses) ==========

export const FullState = Schema.Struct({
  state: Schema.optional(ExecutionState),
  activities: Schema.Record({ key: Schema.String, value: ActivityEntry }),
  deferreds: Schema.Record({ key: Schema.String, value: DeferredEntry }),
  clocks: Schema.Record({ key: Schema.String, value: ClockEntry }),
});

// ========== Derived Types ==========

export type ExecutionStatus = Schema.Schema.Type<typeof ExecutionStatus>;
export type ActivityStatus = Schema.Schema.Type<typeof ActivityStatus>;
export type ExecutionState = Schema.Schema.Type<typeof ExecutionState>;
export type ActivityEntry = Schema.Schema.Type<typeof ActivityEntry>;
export type DeferredEntry = Schema.Schema.Type<typeof DeferredEntry>;
export type ClockEntry = Schema.Schema.Type<typeof ClockEntry>;
export type IndexEntry = Schema.Schema.Type<typeof IndexEntry>;
export type FullState = Schema.Schema.Type<typeof FullState>;
