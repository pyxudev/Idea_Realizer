import type { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import type { CreateIdeaRequest } from "@ai-dashboard/shared";
import {
  listIdeas,
  getIdeaById,
  createIdea,
  retryJob,
  getStats,
} from "../services/ideas";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
};

export async function ideaRoutes(app: FastifyInstance) {
  // GET /api/ideas
  app.get("/ideas", async (_req, reply) => {
    try {
      return reply.send({ data: await listIdeas() });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch ideas" });
    }
  });

  // GET /api/ideas/stats
  app.get("/ideas/stats", async (_req, reply) => {
    try {
      return reply.send({ data: await getStats() });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch stats" });
    }
  });

  // GET /api/ideas/:id
  app.get<{ Params: { id: string } }>("/ideas/:id", async (req, reply) => {
    try {
      const idea = await getIdeaById(req.params.id);
      if (!idea) return reply.status(404).send({ error: "Idea not found" });
      return reply.send({ data: idea });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch idea" });
    }
  });

  // POST /api/ideas
  app.post<{ Body: CreateIdeaRequest }>("/ideas", async (req, reply) => {
    try {
      const { title, description, ai_provider } = req.body;
      if (!title || !description) {
        return reply.status(400).send({ error: "title and description are required" });
      }
      const idea = await createIdea({
        title,
        description,
        ai_provider: ai_provider || "openai",
      });
      return reply.status(201).send({ data: idea });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create idea" });
    }
  });

  // POST /api/jobs/:id/retry
  app.post<{ Params: { id: string } }>("/jobs/:id/retry", async (req, reply) => {
    try {
      const job = await retryJob(req.params.id);
      if (!job) return reply.status(404).send({ error: "Job not found" });
      return reply.send({ data: job });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to retry job" });
    }
  });

  // GET /api/outputs/:ideaId/:filename – serve generated files via stream
  app.get<{ Params: { ideaId: string; filename: string } }>(
    "/outputs/:ideaId/:filename",
    async (req, reply) => {
      const outputsDir =
        process.env.OUTPUTS_DIR || path.join(process.cwd(), "../../outputs");

      // Sanitize to prevent path traversal
      const safeIdeaId  = path.basename(req.params.ideaId);
      const safeFilename = path.basename(req.params.filename);
      const filePath = path.join(outputsDir, safeIdeaId, safeFilename);

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({ error: "File not found" });
      }

      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      reply.header("Content-Type", contentType);
      reply.header("Cache-Control", "no-cache");

      // Stream the file directly – no @fastify/static needed
      return reply.send(fs.createReadStream(filePath));
    }
  );
}
