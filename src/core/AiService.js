import OpenAI from "openai";

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat";

export default class AiService {
  constructor(options = {}) {
    const {
      apiKey,
      baseURL = DEFAULT_BASE_URL,
      model = DEFAULT_MODEL,
      logger,
      temperature = 0.3,
    } = options;

    this.logger = logger;
    this.model = model;
    this.temperature = temperature;

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL,
      });
    } else {
      this.client = null;
      this.logger?.warn("DeepSeek API key missing — falling back to heuristic summaries");
    }
  }

  async explainRisk(riskData) {
    const fallback = riskData?.fallback_text || "AI explanation unavailable.";
    if (!this.client) {
      return fallback;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        messages: [
          {
            role: "system",
            content:
              "You are a TON blockchain security analyst. Explain risk findings in one short sentence for a non-technical user.",
          },
          {
            role: "user",
            content: `Analyze this JSON and summarize risk in <=25 words. JSON: ${JSON.stringify(
              riskData
            )}`,
          },
        ],
      });

      return response?.choices?.[0]?.message?.content?.trim() || fallback;
    } catch (err) {
      this.logger?.warn({ err }, "DeepSeek summary failed");
      return fallback;
    }
  }

  /**
   * Search web mentions and news for a domain or Telegram bot
   * Returns AI summary of findings
   */
  async searchWebMentions(query) {
    const fallback = "No web search results available.";
    if (!this.client) {
      return { summary: fallback, hasOfficialNews: false };
    }

    try {
      // Use DeepSeek to generate a web search summary
      // Note: DeepSeek doesn't have built-in web search, so we simulate it with reasoning
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You are a security researcher analyzing web presence. Based on the domain/bot name provided, assess if it appears legitimate. Consider: known TON ecosystem projects, official announcements, community mentions. Be cautious and note if you cannot find reliable information.",
          },
          {
            role: "user",
            content: `Search for information about: "${query}". Is this a known/official TON project or Telegram bot? Are there official announcements or community trust signals? Respond in 2-3 sentences.`,
          },
        ],
      });

      const summary = response?.choices?.[0]?.message?.content?.trim() || fallback;
      
      // Simple heuristic: if AI mentions "official", "known", "legitimate" -> likely has news
      const hasOfficialNews = /\b(official|known|legitimate|trusted|verified)\b/i.test(summary);

      return { summary, hasOfficialNews };
    } catch (err) {
      this.logger?.warn({ err }, "Web search via AI failed");
      return { summary: fallback, hasOfficialNews: false };
    }
  }
}
