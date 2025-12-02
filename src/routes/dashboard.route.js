export default async function dashboardRoutes(fastify) {
  /**
   * GET /dashboard/:userId
   * Get comprehensive dashboard summary for user
   */
  fastify.get("/dashboard/:userId", async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "User ID is required",
      };
    }

    try {
      const summary = await fastify.supabaseService.getDashboardSummary(userId);

      if (!summary) {
        // Fallback if no data or Supabase unavailable
        return {
          status: "ok",
          data: {
            user_id: userId,
            stats: fastify.supabaseService.getEmptyStats(userId),
            recent_critical: [],
            risk_timeline: [],
          },
        };
      }

      return {
        status: "ok",
        data: summary,
      };
    } catch (err) {
      request.log.error({ err }, "Dashboard summary failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to fetch dashboard data",
      };
    }
  });

  /**
   * GET /history/:userId
   * Get assessment history with pagination and filters
   */
  fastify.get("/history/:userId", async (request, reply) => {
    const { userId } = request.params;
    const { limit, offset, type, risk_level } = request.query;

    if (!userId) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "User ID is required",
      };
    }

    try {
      const options = {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        type: type || null,
        riskLevel: risk_level || null,
      };

      const history = await fastify.supabaseService.getAssessmentHistory(
        userId,
        options
      );

      return {
        status: "ok",
        data: history,
      };
    } catch (err) {
      request.log.error({ err }, "History fetch failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to fetch history",
      };
    }
  });

  /**
   * GET /stats/:userId
   * Get just the statistics (faster than full dashboard)
   */
  fastify.get("/stats/:userId", async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      reply.code(400);
      return {
        error: "VALIDATION_ERROR",
        message: "User ID is required",
      };
    }

    try {
      const stats = await fastify.supabaseService.getDashboardStats(userId);

      return {
        status: "ok",
        data: stats || fastify.supabaseService.getEmptyStats(userId),
      };
    } catch (err) {
      request.log.error({ err }, "Stats fetch failed");
      reply.code(502);
      return {
        error: "UPSTREAM_ERROR",
        message: "Unable to fetch stats",
      };
    }
  });
}
