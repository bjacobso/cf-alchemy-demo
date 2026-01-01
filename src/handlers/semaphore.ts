import { HttpApiBuilder, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { AppApi } from "../api/api";
import { SemaphoreService } from "../services/SemaphoreService";
import { SemaphoreDemo } from "../components/SemaphoreDemo";

const DEMO_KEY = "demo";
const DEFAULT_MAX_PERMITS = 3;
const DEFAULT_PERMIT_TTL_MS = 60000;

// Helper to parse URL-encoded form data from request
const parseFormData = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const formData = yield* request.urlParamsBody;
  const result: Record<string, string> = {};
  for (const [key, value] of formData) {
    result[key] = value;
  }
  return result;
});

// Handler implementation for the semaphore group
export const SemaphoreHandlerLive = HttpApiBuilder.group(AppApi, "semaphore", (handlers) =>
  handlers
    .handleRaw("getDemoPage", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;
        const status = yield* semaphoreService.status(DEMO_KEY);
        const html = "<!DOCTYPE html>" + SemaphoreDemo({ status });
        return HttpServerResponse.html(html);
      }),
    )
    .handleRaw("getStatus", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;
        const status = yield* semaphoreService.status(DEMO_KEY);
        return HttpServerResponse.unsafeJson(status);
      }),
    )
    .handleRaw("configure", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;
        const formData = yield* parseFormData;
        const maxPermits = parseInt(formData.maxPermits ?? "", 10) || DEFAULT_MAX_PERMITS;
        yield* semaphoreService.configure(DEMO_KEY, maxPermits);
        return HttpServerResponse.redirect("/semaphore/demo", { status: 303 });
      }).pipe(Effect.orDie),
    )
    .handleRaw("simulateWork", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;
        const formData = yield* parseFormData;
        const durationMs = parseInt(formData.durationMs ?? "", 10) || 3000;

        // Acquire permit, wait, then release
        const permit = yield* semaphoreService.acquire(DEMO_KEY, {
          permitTTLMs: DEFAULT_PERMIT_TTL_MS,
        });

        // Simulate work by sleeping
        yield* Effect.sleep(durationMs);

        // Release the permit
        yield* permit.release;

        return HttpServerResponse.redirect("/semaphore/demo", { status: 303 });
      }).pipe(Effect.orDie),
    )
    .handleRaw("acquire", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;

        // Configure with defaults if not already configured
        yield* semaphoreService.configure(DEMO_KEY, DEFAULT_MAX_PERMITS);

        const permit = yield* semaphoreService.tryAcquire(DEMO_KEY, {
          permitTTLMs: DEFAULT_PERMIT_TTL_MS,
        });

        // Return JSON with permitId for manual release
        return HttpServerResponse.unsafeJson({
          permitId: permit.permitId,
          expiresAt: Date.now() + DEFAULT_PERMIT_TTL_MS,
        });
      }).pipe(Effect.orDie),
    )
    .handleRaw("release", () =>
      Effect.gen(function* () {
        const semaphoreService = yield* SemaphoreService;
        const formData = yield* parseFormData;
        const permitId = formData.permitId ?? "";
        yield* semaphoreService.release(DEMO_KEY, permitId);
        return HttpServerResponse.redirect("/semaphore/demo", { status: 303 });
      }).pipe(Effect.orDie),
    ),
);
