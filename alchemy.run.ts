import "dotenv/config"
import { execSync } from "child_process"
import alchemy from "alchemy"
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare"
import { CloudflareStateStore } from "alchemy/state"
import { GitHubComment } from "alchemy/github"

let branch = ""
try {
  branch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim()
} catch {
  // Not in a git repo or git not available
}

// Sanitize branch name for Cloudflare worker names (replace / with -)
const sanitizedBranch = branch.replace(/\//g, "-")
const stage = process.env.STAGE || sanitizedBranch || "dev"

const app = await alchemy("alchemy-do-demo", {
  stage,
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      forceUpdate: true,
    }),
})

// Define the Durable Object namespaces
const counter = DurableObjectNamespace("counter", {
  className: "Counter",
  sqlite: true,
})

const workflowExecution = DurableObjectNamespace("workflow-execution", {
  className: "WorkflowExecution",
  sqlite: true,
})

// Worker name includes stage to avoid conflicts between environments
const workerName =
  stage === "prod" ? "alchemy-do-demo" : `alchemy-do-demo-${stage}`

// Define the Worker with DO bindings
export const worker = await Worker("worker", {
  name: workerName,
  entrypoint: "./src/index.ts",
  bindings: {
    COUNTER: counter,
    WORKFLOW_EXECUTION: workflowExecution,
  },
})

console.log(`Deployed worker: ${worker.url}`)

// Post PR comment with preview URL
if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "bjacobso",
    repository: "cf-alchemy-demo",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## Preview Deployed

**URL:** ${worker.url}

Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

---
<time datetime="${new Date().toISOString()}">${new Date().toISOString()}</time>

<sub>This comment updates automatically with each push.</sub>`,
  })
}

await app.finalize()
