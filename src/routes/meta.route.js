const FAVICON_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAABzOBPAAAAAE0lEQVR42mP8/58BCzCgwEDAAAFzA/1IXDHnAAAAAElFTkSuQmCC",
  "base64"
);

export default async function metaRoutes(fastify) {
  fastify.get("/", async () => ({
    status: "ok",
    service: "TON Shield AI backend",
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
  }));

  fastify.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  fastify.get("/favicon.ico", async (request, reply) => {
    reply
      .type("image/png")
      .header("Cache-Control", "public, max-age=86400")
      .send(FAVICON_BUFFER);
  });
}
