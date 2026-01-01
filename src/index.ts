import { DurableObject } from "cloudflare:workers"

interface Env {
  COUNTER: DurableObjectNamespace<Counter>
}

function renderHTML(count: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .counter {
      text-align: center;
      background: white;
      padding: 2rem 3rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .count {
      font-size: 4rem;
      font-weight: bold;
      margin: 1rem 0;
    }
    .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    button {
      font-size: 1.5rem;
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      opacity: 0.9;
    }
    .decrement {
      background: #ef4444;
      color: white;
    }
    .increment {
      background: #22c55e;
      color: white;
    }
  </style>
</head>
<body>
  <div class="counter">
    <h1>Counter</h1>
    <div class="count" id="count">${count}</div>
    <div class="buttons">
      <button class="decrement" onclick="update('/decrement')">-</button>
      <button class="increment" onclick="update('/increment')">+</button>
    </div>
  </div>
  <script>
    async function update(path) {
      const res = await fetch(path);
      const data = await res.json();
      document.getElementById('count').textContent = data.count;
    }
  </script>
</body>
</html>`
}

export class Counter extends DurableObject<Env> {
  private count: number = 0

  async fetch(request: Request) {
    const url = new URL(request.url)

    // Load current count from storage
    const stored = await this.ctx.storage.get<number>("count")
    this.count = stored ?? 0

    if (url.pathname === "/increment") {
      this.count++
      await this.ctx.storage.put("count", this.count)
      return Response.json({ count: this.count })
    } else if (url.pathname === "/decrement") {
      this.count--
      await this.ctx.storage.put("count", this.count)
      return Response.json({ count: this.count })
    }

    return new Response(renderHTML(this.count), {
      headers: { "Content-Type": "text/html" },
    })
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const id = env.COUNTER.idFromName("A")
    const stub = env.COUNTER.get(id)
    return stub.fetch(request)
  },
}
