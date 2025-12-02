import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import pino from "pino";

import RiskEngine from "./core/RiskEngine.js";
import TonService from "./core/TonService.js";
import AiService from "./core/AiService.js";
import LinkService from "./core/LinkService.js";
import SupabaseService from "./core/SupabaseService.js";
import transactionRoutes from "./routes/transaction.route.js";
import jettonRoutes from "./routes/jetton.route.js";
import addressRoutes from "./routes/address.route.js";
import linkRoutes from "./routes/link.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import metaRoutes from "./routes/meta.route.js";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const app = Fastify({
  logger,
});

const tonService = new TonService({
  apiKey: process.env.TONAPI_KEY,
  baseURL: process.env.TONAPI_BASE_URL,
  logger,
});

const aiService = new AiService({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
  model: process.env.DEEPSEEK_MODEL,
  logger,
});

const linkService = new LinkService({
  logger,
});

const supabaseService = new SupabaseService({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  logger,
});

const riskEngine = new RiskEngine({
  logger,
  tonService,
  aiService,
  linkService,
});
app.decorate("riskEngine", riskEngine);
app.decorate("supabaseService", supabaseService);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : true;

await app.register(cors, {
  origin: allowedOrigins,
  methods: ["GET", "POST", "OPTIONS"],
});

await app.register(metaRoutes);
await app.register(transactionRoutes);
await app.register(jettonRoutes);
await app.register(addressRoutes);
await app.register(linkRoutes);
await app.register(dashboardRoutes);

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

const start = async () => {
  try {
    await app.listen({ port, host });
    logger.info(`TON Shield backend running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
