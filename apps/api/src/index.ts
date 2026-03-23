import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ideaRoutes } from "./routes/ideas";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

async function bootstrap() {
  await app.register(cors, {
    origin: true, // すべてのオリジンを許可（必要に応じて絞る）
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(ideaRoutes, { prefix: "/api" });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  const port = parseInt(process.env.API_PORT || "3001");
  const host = process.env.API_HOST || "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`🚀 API server listening at http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
