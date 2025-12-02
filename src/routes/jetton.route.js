export default async function jettonRoutes(fastify) {
  fastify.get("/analyze/jetton/:address", async (request, reply) => {
    const { address } = request.params;

    if (!address) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "Jetton master address is required",
      };
    }

    if (address.length < 48) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "Provide a valid TON jetton master address",
      };
    }

    try {
      const data = await fastify.riskEngine.analyzeJetton(address);
      
      // Save to history
      const userId = request.headers['x-user-id'];
      if (userId && fastify.supabaseService.client) {
        fastify.supabaseService.saveAssessment(userId, 'jetton', data).catch(err => {
          request.log.warn({ err }, 'Failed to save assessment to history');
        });
      }
      
      return {
        status: "ok",
        data,
      };
    } catch (err) {
      if (err.code === "NOT_JETTON_MASTER") {
        request.log.warn({ err }, "Jetton analysis rejected: not a jetton master");
        reply.code(400);
        return {
          error: "NOT_JETTON_MASTER",
          message: err.message,
        };
      }

      request.log.error({ err }, "Jetton analysis failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to analyze jetton right now",
      };
    }
  });
}
