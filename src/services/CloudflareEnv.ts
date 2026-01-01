import { Context, Layer } from "effect"
import type { Counter } from "../durable-objects/Counter"
import type { WorkflowExecution } from "../durable-objects/WorkflowExecution"

// Cloudflare Worker environment bindings
export interface Env {
  COUNTER: DurableObjectNamespace<Counter>
  WORKFLOW_EXECUTION: DurableObjectNamespace<WorkflowExecution>
}

// Effect Context.Tag for accessing Cloudflare env bindings
export class CloudflareEnv extends Context.Tag(
  "CloudflareEnv",
)<CloudflareEnv, Env>() {}

// Create a Layer from the env bindings at request time
export const makeEnvLayer = (env: Env) => Layer.succeed(CloudflareEnv, env)
