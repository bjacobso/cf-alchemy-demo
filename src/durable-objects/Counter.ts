import { DurableObject } from "cloudflare:workers";
import { SqliteClient } from "@effect/sql-sqlite-do";
import { SqlClient } from "@effect/sql";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Reactivity } from "@effect/experimental";
import type { Env } from "../services/CloudflareEnv";

// Counter Durable Object with SQLite storage via Effect SQL
export class Counter extends DurableObject<Env> {
  private readonly runtime: ManagedRuntime.ManagedRuntime<SqlClient.SqlClient, never>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Create Effect SQL layer from DO's SqlStorage using make (avoids Config)
    // Layer.scoped creates a layer from an Effect that returns the service
    const sqlLayer = Layer.scoped(
      SqlClient.SqlClient,
      SqliteClient.make({ db: ctx.storage.sql }),
    ).pipe(Layer.provide(Reactivity.layer));

    // Create a managed runtime for running Effects with the SQL layer
    this.runtime = ManagedRuntime.make(sqlLayer);

    // Initialize table (runs synchronously via raw SQL)
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS counter (
        id TEXT PRIMARY KEY DEFAULT 'default',
        value INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Insert default row if not exists
    ctx.storage.sql.exec(`
      INSERT OR IGNORE INTO counter (id, value) VALUES ('default', 0)
    `);
  }

  async getCount(): Promise<number> {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        const rows = yield* sql`SELECT value FROM counter WHERE id = 'default'`;
        return (rows[0]?.value as number) ?? 0;
      }),
    );
  }

  async increment(): Promise<void> {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`UPDATE counter SET value = value + 1 WHERE id = 'default'`;
      }),
    );
  }

  async decrement(): Promise<void> {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`UPDATE counter SET value = value - 1 WHERE id = 'default'`;
      }),
    );
  }
}
