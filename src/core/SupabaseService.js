import { createClient } from "@supabase/supabase-js";

export default class SupabaseService {
  constructor(options = {}) {
    const { supabaseUrl, supabaseKey, logger } = options;
    this.logger = logger;

    if (!supabaseUrl || !supabaseKey) {
      this.logger?.warn("Supabase credentials missing — persistence disabled");
      this.client = null;
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Get or create user by telegram_id or wallet_address
   */
  async getOrCreateUser(identifier) {
    if (!this.client) return null;

    try {
      const isTelegram = typeof identifier === "number" || /^\d+$/.test(identifier);
      const query = isTelegram
        ? { telegram_id: parseInt(identifier) }
        : { wallet_address: identifier };

      // Try to find existing user
      const { data: existing, error: findError } = await this.client
        .from("users")
        .select("*")
        .match(query)
        .single();

      if (existing && !findError) {
        return existing;
      }

      // Create new user
      const { data: newUser, error: createError } = await this.client
        .from("users")
        .insert([query])
        .select()
        .single();

      if (createError) {
        this.logger?.error({ err: createError }, "Failed to create user");
        return null;
      }

      return newUser;
    } catch (err) {
      this.logger?.error({ err }, "getOrCreateUser failed");
      return null;
    }
  }

  /**
   * Save assessment to history
   */
  async saveAssessment(userId, assessmentType, assessmentData) {
    if (!this.client || !userId) return null;

    try {
      const record = {
        user_id: userId,
        assessment_type: assessmentType,
        target_identifier: this.extractTargetIdentifier(assessmentType, assessmentData),
        risk_level: assessmentData.risk_level,
        risk_score: assessmentData.risk_score,
        signals: assessmentData.signals || [],
        assessment_data: assessmentData,
        origin_domain: assessmentData.origin_domain || null,
      };

      const { data, error } = await this.client
        .from("assessments")
        .insert([record])
        .select()
        .single();

      if (error) {
        this.logger?.error({ err: error }, "Failed to save assessment");
        return null;
      }

      return data;
    } catch (err) {
      this.logger?.error({ err }, "saveAssessment failed");
      return null;
    }
  }

  /**
   * Get dashboard summary for user
   */
  async getDashboardSummary(userId) {
    if (!this.client || !userId) return null;

    try {
      const { data, error } = await this.client.rpc("get_dashboard_summary", {
        p_user_id: userId,
      });

      if (error) {
        this.logger?.error({ err: error }, "Failed to get dashboard summary");
        return null;
      }

      return data;
    } catch (err) {
      this.logger?.error({ err }, "getDashboardSummary failed");
      return null;
    }
  }

  /**
   * Get assessment history with pagination
   */
  async getAssessmentHistory(userId, options = {}) {
    if (!this.client || !userId) return { items: [], total: 0 };

    try {
      const {
        limit = 20,
        offset = 0,
        type = null, // filter by assessment_type
        riskLevel = null, // filter by risk_level
      } = options;

      let query = this.client
        .from("assessments")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("assessment_type", type);
      }

      if (riskLevel) {
        query = query.eq("risk_level", riskLevel);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        this.logger?.error({ err: error }, "Failed to get assessment history");
        return { items: [], total: 0 };
      }

      return {
        items: data || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (err) {
      this.logger?.error({ err }, "getAssessmentHistory failed");
      return { items: [], total: 0 };
    }
  }

  /**
   * Get dashboard stats for user
   */
  async getDashboardStats(userId) {
    if (!this.client || !userId) return null;

    try {
      const { data, error } = await this.client
        .from("dashboard_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        this.logger?.error({ err: error }, "Failed to get dashboard stats");
        return null;
      }

      return data || this.getEmptyStats(userId);
    } catch (err) {
      this.logger?.error({ err }, "getDashboardStats failed");
      return null;
    }
  }

  /**
   * Extract target identifier from assessment data
   */
  extractTargetIdentifier(type, data) {
    switch (type) {
      case "transaction":
        return data.target_address || "unknown";
      case "jetton":
        return data.jetton_address || "unknown";
      case "address":
        return data.address || "unknown";
      case "link":
        return data.domain || data.url || "unknown";
      default:
        return "unknown";
    }
  }

  /**
   * Return empty stats structure
   */
  getEmptyStats(userId) {
    return {
      user_id: userId,
      total_checks: 0,
      checks_today: 0,
      checks_this_week: 0,
      safe_count: 0,
      warning_count: 0,
      critical_count: 0,
      transaction_checks: 0,
      jetton_checks: 0,
      address_checks: 0,
      link_checks: 0,
      last_check_at: null,
      updated_at: new Date().toISOString(),
    };
  }
}
