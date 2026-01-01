import { jsx, Fragment, RawHtml } from "../jsx-runtime"

interface CounterProps {
  count: number
}

export function Counter({ count }: CounterProps): RawHtml {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Counter</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
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
        `,
          }}
        />
      </head>
      <body>
        <div className="counter">
          <h1>Counter</h1>
          <div className="count">{count}</div>
          <div className="buttons">
            <form method="post" action="/decrement" style="display:inline">
              <button type="submit" className="decrement">
                -
              </button>
            </form>
            <form method="post" action="/increment" style="display:inline">
              <button type="submit" className="increment">
                +
              </button>
            </form>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          // Inline JS works too! This logs on every page load.
          console.log('SSR Counter loaded. Current count:', ${count});
        `,
          }}
        />
      </body>
    </html>
  )
}
