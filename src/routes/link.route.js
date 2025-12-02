export default async function linkRoutes(fastify) {
  fastify.post("/analyze/link", async (request, reply) => {
    const { url } = request.body || {};

    if (!url || typeof url !== "string") {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "URL is required in request body",
      };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "Invalid URL format",
      };
    }

    try {
      const data = await fastify.riskEngine.analyzeLink(url);
      
      // Save to history
      const userId = request.headers['x-user-id'];
      if (userId && fastify.supabaseService.client) {
        fastify.supabaseService.saveAssessment(userId, 'link', data).catch(err => {
          request.log.warn({ err }, 'Failed to save assessment to history');
        });
      }
      
      return {
        status: "ok",
        data,
      };
    } catch (err) {
      request.log.error({ err }, "Link analysis failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to analyze link right now",
      };
    }
  });
}
