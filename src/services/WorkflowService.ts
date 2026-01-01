import { Effect, Context, Layer, Exit } from "effect";
import { CloudflareEnv } from "./CloudflareEnv";
import type { IndexEntry } from "../durable-objects/WorkflowIndex";

// Execution detail from WorkflowExecution DO
export interface ExecutionDetail {
  state:
    | {
        executionId: string;
        workflowName: string;
        status: string;
        payload: unknown;
        result?: unknown;
        error?: unknown;
        createdAt: number;
        updatedAt: number;
      }
    | undefined;
  activities: Array<{
    name: string;
    status: string;
    attempts: number;
    result?: unknown;
    error?: unknown;
  }>;
  deferreds: Array<{
    name: string;
    resolved: boolean;
    value?: unknown;
  }>;
  clocks: Array<{
    name: string;
    wakeAt: number;
    completed: boolean;
  }>;
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
          const fullState = (await stub.getFullState()) as {
            state:
              | {
                  executionId: string;
                  workflowName: string;
                  status: string;
                  payload: unknown;
                  result?: unknown;
                  error?: unknown;
                  createdAt: number;
                  updatedAt: number;
                }
              | undefined;
            activities: Map<
              string,
              {
                name: string;
                status: string;
                attempts: number;
                result?: unknown;
                error?: unknown;
              }
            >;
            deferreds: Map<string, { name: string; resolved: boolean; value?: unknown }>;
            clocks: Map<string, { name: string; wakeAt: number; completed: boolean }>;
          };

          return {
            state: fullState.state,
            activities: Array.from(fullState.activities.values()).map((a) => ({
              name: a.name,
              status: a.status,
              attempts: a.attempts,
              result: a.result,
              error: a.error,
            })),
            deferreds: Array.from(fullState.deferreds.values()).map((d) => ({
              name: d.name,
              resolved: d.resolved,
              value: d.value,
            })),
            clocks: Array.from(fullState.clocks.values()).map((c) => ({
              name: c.name,
              wakeAt: c.wakeAt,
              completed: c.completed,
            })),
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
