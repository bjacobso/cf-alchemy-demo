import { Effect, Context, Layer, Schedule, Duration } from "effect"
import { CloudflareEnv } from "./CloudflareEnv"
import {
  SemaphoreTimeoutError,
  SemaphoreRejectedError,
  SemaphoreReleaseError,
  type SemaphoreError,
} from "./SemaphoreErrors"
import type {
  AcquireResult,
  ReleaseResult,
  SemaphoreStatus as DOSemaphoreStatus,
} from "../durable-objects/Semaphore"

interface AcquireOptions {
  timeoutMs?: number
  permitTTLMs?: number
}

interface TryAcquireOptions {
  permitTTLMs?: number
}

export interface PermitHandle {
  permitId: string
  key: string
  release: Effect.Effect<void, SemaphoreReleaseError>
}

export interface SemaphoreStatus {
  available: number
  active: number
  queued: number
  maxPermits: number
}

interface ISemaphoreService {
  configure: (
    key: string,
    maxPermits: number,
    defaultTimeoutMs?: number,
  ) => Effect.Effect<void>

  acquire: (
    key: string,
    options?: AcquireOptions,
  ) => Effect.Effect<PermitHandle, SemaphoreTimeoutError | SemaphoreRejectedError>

  tryAcquire: (
    key: string,
    options?: TryAcquireOptions,
  ) => Effect.Effect<PermitHandle, SemaphoreRejectedError>

  withPermit: <A,
  E,
  R,>(
    key: string,
    effect: Effect.Effect<A, E, R>,
    options?: AcquireOptions,
  ) => Effect.Effect<A, E | SemaphoreError, R>

  status: (key: string) => Effect.Effect<SemaphoreStatus>

  release: (
    key: string,
    permitId: string,
  ) => Effect.Effect<void, SemaphoreReleaseError>
}

export class SemaphoreService extends Context.Tag(
  "SemaphoreService",
)<SemaphoreService, ISemaphoreService>() {}

export const SemaphoreServiceLive = Layer.effect(
  SemaphoreService,
  Effect.gen(function* () {
    const env = yield* CloudflareEnv

    const getStub = (key: string) => {
      const id = env.SEMAPHORE.idFromName(key)
      return env.SEMAPHORE.get(id)
    }

    const makeReleaser = (key: string, permitId: string) =>
      Effect.tryPromise({
        try: async (): Promise<ReleaseResult> => getStub(key).release(permitId),
        catch: (error) =>
          new SemaphoreReleaseError({
            key,
            permitId,
            message: String(error),
          }),
      }).pipe(
        Effect.flatMap((result) =>
          result.success
            ? Effect.void
            : Effect.fail(
                new SemaphoreReleaseError({
                  key,
                  permitId,
                  message: result.error ?? "Unknown error",
                }),
              ),
        ),
      )

    const service: ISemaphoreService = {
      configure: (key, maxPermits, defaultTimeoutMs) =>
        Effect.tryPromise(() =>
          getStub(key).configure(maxPermits, defaultTimeoutMs),
        ).pipe(Effect.orDie),

      tryAcquire: (key, options) =>
        Effect.tryPromise(
          async (): Promise<AcquireResult> =>
            getStub(key).tryAcquire(options?.permitTTLMs),
        ).pipe(
          Effect.flatMap((result) =>
            result.success
              ? Effect.succeed({
                  permitId: result.permitId,
                  key,
                  release: makeReleaser(key, result.permitId),
                })
              : Effect.fail(
                  new SemaphoreRejectedError({
                    key,
                    reason: result.reason,
                  }),
                ),
          ),
          Effect.orDie,
        ),

      acquire: (key, options) =>
        Effect.gen(function* () {
          const result: AcquireResult = yield* Effect.tryPromise(async () =>
            getStub(key).acquire(options?.timeoutMs, options?.permitTTLMs),
          ).pipe(Effect.orDie)

          if (result.success) {
            return {
              permitId: result.permitId,
              key,
              release: makeReleaser(key, result.permitId),
            }
          }

          // If we got a waiterId, poll for result
          const waiterId = result.waiterId
          if (waiterId) {
            const timeoutMs = options?.timeoutMs ?? 30000
            const pollInterval = Math.min(100, timeoutMs / 10)

            const pollEffect = Effect.tryPromise(
              async (): Promise<AcquireResult> =>
                getStub(key).checkWaiter(waiterId),
            ).pipe(
              Effect.orDie,
              Effect.flatMap((checkResult) =>
                checkResult.success
                  ? Effect.succeed({
                      permitId: checkResult.permitId,
                      key,
                      release: makeReleaser(key, checkResult.permitId),
                    })
                  : checkResult.reason === "timeout"
                    ? Effect.fail(new SemaphoreTimeoutError({ key, timeoutMs }))
                    : Effect.fail(new Error("still_waiting")),
              ),
              Effect.retry(
                Schedule.spaced(Duration.millis(pollInterval)).pipe(
                  Schedule.whileInput(
                    (e: unknown) =>
                      e instanceof Error &&
                      (e as Error).message === "still_waiting",
                  ),
                  Schedule.compose(
                    Schedule.elapsed.pipe(
                      Schedule.whileOutput(
                        Duration.lessThanOrEqualTo(Duration.millis(timeoutMs)),
                      ),
                    ),
                  ),
                ),
              ),
              Effect.catchAll((error) =>
                error instanceof SemaphoreTimeoutError
                  ? Effect.fail(error)
                  : Effect.fail(new SemaphoreTimeoutError({ key, timeoutMs })),
              ),
            )

            return yield* pollEffect
          }

          return yield* Effect.fail(
            new SemaphoreRejectedError({ key, reason: result.reason }),
          )
        }),

      withPermit: (key, effect, options) =>
        Effect.acquireUseRelease(
          service.acquire(key, options),
          () => effect,
          (handle) => handle.release.pipe(Effect.orDie),
        ),

      status: (key) =>
        Effect.tryPromise(
          async (): Promise<DOSemaphoreStatus> => getStub(key).status(),
        ).pipe(Effect.orDie),

      release: (key, permitId) => makeReleaser(key, permitId),
    }

    return service
  }),
)
