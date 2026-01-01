import alchemy from "alchemy"
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare"
import { CloudflareStateStore } from "alchemy/state"
import { GitHubComment } from "alchemy/github"

const stage = process.env.STAGE || "dev"

const app = await alchemy("alchemy-do-demo", {
  stage,
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      forceUpdate: true,
    }),
})

// Define the Durable Object namespace
const counter = DurableObjectNamespace("counter", {
  className: "Counter",
  sqlite: true,
})

// Worker name includes stage to avoid conflicts between environments
const workerName =
  stage === "prod" ? "alchemy-do-demo" : `alchemy-do-demo-${stage}`

// Define the Worker with DO binding
export const worker = await Worker("worker", {
  name: workerName,
  entrypoint: "./src/index.ts",
  bindings: {
    COUNTER: counter,
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
<sub>This comment updates automatically with each push.</sub>`,
  })
}

await app.finalize()
