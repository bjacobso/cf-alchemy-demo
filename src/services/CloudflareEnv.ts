import { Context, Layer } from "effect";
import type { Counter } from "../durable-objects/Counter";
import type { Semaphore } from "../durable-objects/Semaphore";

// Cloudflare Worker environment bindings
export interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
  SEMAPHORE: DurableObjectNamespace<Semaphore>;
}

// Effect Context.Tag for accessing Cloudflare env bindings
export class CloudflareEnv extends Context.Tag("CloudflareEnv")<CloudflareEnv, Env>() {}

// Create a Layer from the env bindings at request time
export const makeEnvLayer = (env: Env) => Layer.succeed(CloudflareEnv, env);
