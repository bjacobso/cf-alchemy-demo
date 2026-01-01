import { WorkflowEngine, Workflow } from "@effect/workflow"
import type * as Activity from "@effect/workflow/Activity"
import type * as DurableDeferred from "@effect/workflow/DurableDeferred"
import type { DurableClock } from "@effect/workflow/DurableClock"
import { Effect, Layer, Exit, Duration } from "effect"
import { CloudflareEnv } from "../services/CloudflareEnv"
import type { WorkflowExecution } from "../durable-objects/WorkflowExecution"

// Type aliases for the poll result
interface PollResult {
  status: string
  result?: unknown
  error?: unknown
}

// Type alias for activity entry
interface ActivityEntry {
  name: string
  attempts: number
  status: "pending" | "running" | "completed" | "failed"
  result?: unknown
  error?: unknown
}

/**
 * DurableObjectWorkflowEngine
 *
 * Implements @effect/workflow's WorkflowEngine.Encoded interface
 * backed by Cloudflare Durable Objects for durability.
 *
 * Each workflow execution gets its own DO instance (keyed by executionId).
 */
export const DurableObjectWorkflowEngineLive = Layer.scoped(
  WorkflowEngine.WorkflowEngine,
  Effect.gen(function* () {
    const env = yield* CloudflareEnv

    // Storage for registered workflow handlers
    const registeredWorkflows = new Map<
      string,
      {
        workflow: Workflow.Any
        execute: (
          payload: object,
          executionId: string
        ) => Effect.Effect<
          unknown,
          unknown,
          WorkflowEngine.WorkflowInstance | WorkflowEngine.WorkflowEngine
        >
      }
    >()

    const getStub = (
      executionId: string
    ): DurableObjectStub<WorkflowExecution> => {
      const id = env.WORKFLOW_EXECUTION.idFromName(executionId)
      return env.WORKFLOW_EXECUTION.get(id)
    }

    // Helper to convert poll result to Workflow.Result
    const pollResultToWorkflowResult = (
      pollResult: PollResult | undefined
    ): Workflow.Result<unknown, unknown> | undefined => {
      if (!pollResult) return undefined

      if (pollResult.status === "done") {
        return new Workflow.Complete({
          exit: Exit.succeed(pollResult.result),
        })
      } else if (pollResult.status === "failed") {
        return new Workflow.Complete({
          exit: Exit.fail(pollResult.error),
        })
      } else if (pollResult.status === "suspended") {
        return new Workflow.Suspended()
      }

      return undefined
    }

    // Create the WorkflowEngine implementation
    const encoded: WorkflowEngine.Encoded = {
      // Register a workflow with its handler
      register: (workflow, execute) =>
        Effect.gen(function* () {
          registeredWorkflows.set(workflow.name, { workflow, execute })
          // Use scope to clean up on shutdown
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              registeredWorkflows.delete(workflow.name)
            })
          )
        }),

      // Start a workflow execution
      execute: <const Discard extends boolean>(
        workflow: Workflow.Any,
        options: {
          readonly executionId: string
          readonly payload: object
          readonly discard: Discard
          readonly parent?: WorkflowEngine.WorkflowInstance["Type"] | undefined
        }
      ): Effect.Effect<
        Discard extends true ? void : Workflow.Result<unknown, unknown>
      > =>
        Effect.gen(function* () {
          const stub = getStub(options.executionId)

          // Initialize the execution in the DO
          yield* Effect.tryPromise(() =>
            stub.execute(options.executionId, workflow.name, options.payload)
          ).pipe(Effect.orDie)

          // Get the registered handler
          const registered = registeredWorkflows.get(workflow.name)
          if (!registered) {
            return yield* Effect.die(
              new Error(`Workflow "${workflow.name}" is not registered`)
            )
          }

          if (options.discard) {
            // Fire and forget - return immediately
            return undefined as Discard extends true
              ? void
              : Workflow.Result<unknown, unknown>
          }

          // Execute the workflow handler
          const workflowInstance = WorkflowEngine.WorkflowInstance.initial(
            workflow,
            options.executionId
          )

          const result: Workflow.Result<unknown, unknown> = yield* registered
            .execute(options.payload, options.executionId)
            .pipe(
              Effect.provideService(
                WorkflowEngine.WorkflowInstance,
                workflowInstance
              ),
              Effect.provideService(
                WorkflowEngine.WorkflowEngine,
                WorkflowEngine.makeUnsafe(encoded)
              ),
              Effect.map(
                (value) =>
                  new Workflow.Complete({ exit: Exit.succeed(value) })
              ),
              Effect.catchAll((error) =>
                Effect.succeed(
                  new Workflow.Complete({ exit: Exit.fail(error) })
                )
              ),
              Effect.catchAllDefect(() => {
                // Check if this is a suspension
                if (workflowInstance.suspended) {
                  return Effect.succeed(new Workflow.Suspended())
                }
                return Effect.succeed(new Workflow.Suspended())
              })
            )

          // Update DO with final status
          if (result._tag === "Complete") {
            if (Exit.isSuccess(result.exit)) {
              yield* Effect.tryPromise(() =>
                stub.complete(Exit.getOrElse(result.exit, () => undefined))
              ).pipe(Effect.orDie)
            } else {
              yield* Effect.tryPromise(() => stub.fail(result.exit)).pipe(
                Effect.orDie
              )
            }
          } else {
            yield* Effect.tryPromise(() => stub.suspend()).pipe(Effect.orDie)
          }

          return result as Discard extends true
            ? void
            : Workflow.Result<unknown, unknown>
        }),

      // Poll for workflow status
      poll: (
        workflow: Workflow.Any,
        executionId: string
      ): Effect.Effect<Workflow.Result<unknown, unknown> | undefined> =>
        Effect.gen(function* () {
          const stub = getStub(executionId)
          const status: PollResult | undefined = yield* Effect.tryPromise(
            () => stub.poll()
          ).pipe(Effect.orDie)

          return pollResultToWorkflowResult(status)
        }),

      // Interrupt a workflow
      interrupt: (
        workflow: Workflow.Any,
        executionId: string
      ): Effect.Effect<void> =>
        Effect.gen(function* () {
          const stub = getStub(executionId)
          yield* Effect.tryPromise(() => stub.interrupt()).pipe(Effect.orDie)
        }),

      // Resume a suspended workflow
      resume: (
        workflow: Workflow.Any,
        executionId: string
      ): Effect.Effect<void> =>
        Effect.gen(function* () {
          const stub = getStub(executionId)
          yield* Effect.tryPromise(() => stub.resume()).pipe(Effect.orDie)
        }),

      // Execute an activity
      activityExecute: (
        activity: Activity.Any,
        attempt: number
      ): Effect.Effect<
        Workflow.Result<unknown, unknown>,
        never,
        WorkflowEngine.WorkflowInstance
      > =>
        Effect.gen(function* () {
          const instance = yield* WorkflowEngine.WorkflowInstance
          const stub = getStub(instance.executionId)

          // Check if activity already completed (replay)
          const existing = (yield* Effect.tryPromise(() =>
            stub.getActivity(activity.name)
          ).pipe(Effect.orDie)) as ActivityEntry | undefined

          if (existing?.status === "completed") {
            return new Workflow.Complete({
              exit: Exit.succeed(existing.result),
            })
          }
          if (existing?.status === "failed") {
            return new Workflow.Complete({
              exit: Exit.fail(existing.error),
            })
          }

          // Mark activity as started
          yield* Effect.tryPromise(() =>
            stub.activityStart(activity.name, attempt)
          ).pipe(Effect.orDie)

          // Execute the activity
          const result: Workflow.Result<unknown, unknown> =
            yield* activity.executeEncoded.pipe(
              Effect.map(
                (value) =>
                  new Workflow.Complete({ exit: Exit.succeed(value) })
              ),
              Effect.catchAll((error) =>
                Effect.succeed(
                  new Workflow.Complete({ exit: Exit.fail(error) })
                )
              ),
              Effect.catchAllDefect((defect) =>
                Effect.succeed(
                  new Workflow.Complete({ exit: Exit.die(defect) })
                )
              )
            )

          // Persist the result
          if (result._tag === "Complete") {
            if (Exit.isSuccess(result.exit)) {
              yield* Effect.tryPromise(() =>
                stub.activityComplete(
                  activity.name,
                  Exit.getOrElse(result.exit, () => undefined)
                )
              ).pipe(Effect.orDie)
            } else {
              yield* Effect.tryPromise(() =>
                stub.activityFail(activity.name, result.exit)
              ).pipe(Effect.orDie)
            }
          }

          return result
        }),

      // Get deferred result
      deferredResult: (
        deferred: DurableDeferred.Any
      ): Effect.Effect<
        Exit.Exit<unknown, unknown> | undefined,
        never,
        WorkflowEngine.WorkflowInstance
      > =>
        Effect.gen(function* () {
          const instance = yield* WorkflowEngine.WorkflowInstance
          const stub = getStub(instance.executionId)

          const result = yield* Effect.tryPromise(() =>
            stub.deferredResult(deferred.name)
          ).pipe(Effect.orDie)

          if (result !== undefined) {
            return Exit.succeed(result) as Exit.Exit<unknown, unknown>
          }

          // Register that we're waiting for this deferred
          yield* Effect.tryPromise(() =>
            stub.registerDeferred(deferred.name)
          ).pipe(Effect.orDie)

          return undefined
        }),

      // Complete a deferred
      deferredDone: (options: {
        readonly workflowName: string
        readonly executionId: string
        readonly deferredName: string
        readonly exit: Exit.Exit<unknown, unknown>
      }): Effect.Effect<void> =>
        Effect.gen(function* () {
          const stub = getStub(options.executionId)
          yield* Effect.tryPromise(() =>
            stub.deferredDone(options.deferredName, options.exit)
          ).pipe(Effect.orDie)
        }),

      // Schedule a clock wake-up
      scheduleClock: (
        workflow: Workflow.Any,
        options: {
          readonly executionId: string
          readonly clock: DurableClock
        }
      ): Effect.Effect<void> =>
        Effect.gen(function* () {
          const stub = getStub(options.executionId)
          const wakeAt = Date.now() + Duration.toMillis(options.clock.duration)

          yield* Effect.tryPromise(() =>
            stub.scheduleClock(options.clock.name, wakeAt)
          ).pipe(Effect.orDie)
        }),
    }

    return WorkflowEngine.makeUnsafe(encoded)
  })
)
