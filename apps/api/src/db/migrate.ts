import "dotenv/config";
import { getDb } from "./connection";

async function migrate() {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Ideas table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       TEXT NOT NULL,
        description TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created','generating','pending','completed','error')),
        ai_provider TEXT NOT NULL DEFAULT 'openai'
                      CHECK (ai_provider IN ('openai','claude','gemini','ollama')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id       UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        type          TEXT NOT NULL
                        CHECK (type IN ('proposal','spec','ui','implementation')),
        status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','running','completed','failed')),
        input         JSONB NOT NULL DEFAULT '{}',
        output_path   TEXT,
        error_message TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_jobs_idea_id ON jobs(idea_id)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status)`
    );

    // Auto-update updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS ideas_updated_at ON ideas;
      CREATE TRIGGER ideas_updated_at
        BEFORE UPDATE ON ideas
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
      CREATE TRIGGER jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);

    await client.query("COMMIT");
    console.log("✅ Migration completed successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await db.end();
  }
}

migrate().catch(() => process.exit(1));
