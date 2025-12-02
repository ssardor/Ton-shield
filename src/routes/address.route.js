export default async function addressRoutes(fastify) {
  fastify.get("/analyze/address/:address", async (request, reply) => {
    const { address } = request.params;

    if (!address) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "Wallet address is required",
      };
    }

    try {
      const data = await fastify.riskEngine.analyzeAddress(address);
      
      // Save to history
      const userId = request.headers['x-user-id'];
      if (userId && fastify.supabaseService.client) {
        fastify.supabaseService.saveAssessment(userId, 'address', data).catch(err => {
          request.log.warn({ err }, 'Failed to save assessment to history');
        });
      }
      
      return {
        status: "ok",
        data,
      };
    } catch (err) {
      request.log.error({ err }, "Address analysis failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to analyze address right now",
      };
    }
  });
}
