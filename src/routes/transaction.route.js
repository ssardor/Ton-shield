export default async function transactionRoutes(fastify) {
  fastify.post("/analyze/transaction", async (request, reply) => {
    const body = request.body || {};
    const requiredFields = ["user_wallet", "target_address"];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    try {
      const assessment = await fastify.riskEngine.analyzeTransaction(body);
      
      // Save to history if user_id provided in headers (optional)
      const userId = request.headers['x-user-id'];
      if (userId && fastify.supabaseService.client) {
        fastify.supabaseService.saveAssessment(userId, 'transaction', {
          ...assessment,
          origin_domain: body.origin_domain,
        }).catch(err => {
          request.log.warn({ err }, 'Failed to save assessment to history');
        });
      }
      
      return {
        status: "ok",
        data: assessment,
      };
    } catch (err) {
      request.log.error({ err }, "Transaction analysis failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to analyze transaction right now",
      };
    }
  });
}
