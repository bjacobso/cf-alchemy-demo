import { Data } from "effect"

export class SemaphoreTimeoutError extends Data.TaggedError(
  "SemaphoreTimeoutError",
)<{
  key: string
  timeoutMs: number
}> {}

export class SemaphoreRejectedError extends Data.TaggedError(
  "SemaphoreRejectedError",
)<{
  key: string
  reason: string
}> {}

export class SemaphoreReleaseError extends Data.TaggedError(
  "SemaphoreReleaseError",
)<{
  key: string
  permitId: string
  message: string
}> {}

export type SemaphoreError =
  | SemaphoreTimeoutError
  | SemaphoreRejectedError
  | SemaphoreReleaseError
