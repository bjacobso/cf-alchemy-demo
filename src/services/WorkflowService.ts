import { Effect, Context, Layer, Exit, Schema } from "effect";
import { CloudflareEnv } from "./CloudflareEnv";
import type { IndexEntry } from "../durable-objects/WorkflowIndex";
import {
  FullState,
  type ExecutionState,
  type ActivityEntry,
  type DeferredEntry,
  type ClockEntry,
} from "../workflow/schemas";

// Decoder for validating RPC response
const decodeFullState = Schema.decodeUnknownSync(FullState);

// Execution detail for UI display
export interface ExecutionDetail {
  state: ExecutionState | undefined;
  activities: ActivityEntry[];
  deferreds: DeferredEntry[];
  clocks: ClockEntry[];
}

// Available workflow definition
export interface AvailableWorkflow {
  name: string;
  payloadSchema?: unknown;
}

// Workflow service interface
interface IWorkflowService {
  listExecutions: Effect.Effect<IndexEntry[]>;
  getExecution: (executionId: string) => Effect.Effect<ExecutionDetail>;
  startExecution: (workflowName: string, payload: unknown) => Effect.Effect<string>;
  sendEvent: (executionId: string, deferredName: string, value: unknown) => Effect.Effect<void>;
  cancelExecution: (executionId: string) => Effect.Effect<void>;
  getAvailableWorkflows: Effect.Effect<AvailableWorkflow[]>;
}

// Effect Context.Tag for the WorkflowService
export class WorkflowService extends Context.Tag("WorkflowService")<
  WorkflowService,
  IWorkflowService
>() {}

// Live implementation
export const WorkflowServiceLive = Layer.effect(
  WorkflowService,
  Effect.gen(function* () {
    const env = yield* CloudflareEnv;

    // Get the global index stub
    const getIndexStub = () => env.WORKFLOW_INDEX.get(env.WORKFLOW_INDEX.idFromName("global"));

    // Get an execution stub by ID
    const getExecutionStub = (executionId: string) =>
      env.WORKFLOW_EXECUTION.get(env.WORKFLOW_EXECUTION.idFromName(executionId));

    return {
      listExecutions: Effect.tryPromise(() => getIndexStub().list()).pipe(Effect.orDie),

      getExecution: (executionId: string) =>
        Effect.tryPromise(async () => {
          const stub = getExecutionStub(executionId);
          const rawState = await stub.getFullState();

          // Skip schema validation for now - just cast
          const fullState = rawState as {
            state: ExecutionState | undefined;
            activities: Record<string, ActivityEntry>;
            deferreds: Record<string, DeferredEntry>;
            clocks: Record<string, ClockEntry>;
          };

          return {
            state: fullState.state,
            activities: Object.values(fullState.activities || {}),
            deferreds: Object.values(fullState.deferreds || {}),
            clocks: Object.values(fullState.clocks || {}),
          };
        }).pipe(Effect.orDie),

      startExecution: (workflowName: string, payload: unknown) =>
        Effect.tryPromise(async () => {
          const executionId = crypto.randomUUID();
          const stub = getExecutionStub(executionId);
          await stub.execute(executionId, workflowName, payload);
          return executionId;
        }).pipe(Effect.orDie),

      sendEvent: (executionId: string, deferredName: string, value: unknown) =>
        Effect.tryPromise(async () => {
          const stub = getExecutionStub(executionId);
          await stub.deferredDone(deferredName, Exit.succeed(value));
        }).pipe(Effect.orDie),

      cancelExecution: (executionId: string) =>
        Effect.tryPromise(async () => {
          const stub = getExecutionStub(executionId);
          await stub.interrupt();
        }).pipe(Effect.orDie),

      // Return available workflows - for now hardcoded, could be dynamic later
      getAvailableWorkflows: Effect.succeed([{ name: "order-fulfillment" }]),
    };
  }),
);
