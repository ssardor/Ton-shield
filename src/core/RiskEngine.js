import { Address, Cell } from "@ton/core";

const ONE_TON_IN_NANOS = 10n ** 9n;
const LARGE_SUPPLY_THRESHOLD = 10n * ONE_TON_IN_NANOS * 1_000_000n; // 10M TON in nanos

export default class RiskEngine {
  constructor(options = {}) {
    this.logger = options.logger;
    this.tonService = options.tonService || null;
    this.aiService = options.aiService || null;
    this.linkService = options.linkService || null;
    this.scamAddressCache = new Map();
    this.loadScamList();
  }

  normalizeAddress(address) {
    if (!address || typeof address !== "string") {
      return "";
    }

    const trimmed = address.trim();

    try {
      // Remove leading ":" (non-bounceable marker some wallets add) before parsing
      const sanitized = trimmed.startsWith(":") ? trimmed.slice(1) : trimmed;
      const { address: parsed } = Address.parseFriendly(sanitized);
      return parsed.toString({ bounceable: false, urlSafe: true });
    } catch (err) {
      this.logger?.debug({ err, address: trimmed }, "Failed to parse TON address, falling back to uppercase");
      return trimmed.toUpperCase();
    }
  }

  mapScoreToLevel(score) {
    if (score >= 80) return "CRITICAL";
    if (score >= 40) return "WARNING";
    return "SAFE";
  }

  async analyzeTransaction(txData = {}) {
    const { user_wallet, target_address, amount_nanoton = 0, payload_boc, origin_domain } = txData;

    const normalizedUser = this.normalizeAddress(user_wallet);

    const {
      normalizedAddress: normalizedTarget,
      signals,
      riskScore: baseRiskScore,
      accountInfo,
    } = await this.assessAddressBasics(target_address);

    let riskScore = baseRiskScore;

    if (normalizedTarget && normalizedTarget === normalizedUser) {
      signals.push("Self-transfer detected");
      riskScore += 10;
    }

    try {
      const amountBigInt = BigInt(amount_nanoton || 0);
      const amountTon = Number(amountBigInt / ONE_TON_IN_NANOS);
      if (amountTon >= 100) {
        signals.push(`High value transfer: ${amountTon} TON`);
        riskScore = Math.max(riskScore, 60);
      }
    } catch (err) {
      signals.push("Invalid amount format");
      riskScore += 15;
      this.logger?.warn({ err }, "Failed to parse amount");
    }

    if (origin_domain) {
      if (/[0-9-]{4,}/.test(origin_domain)) {
        signals.push("Domain contains suspicious numeric/hyphen patterns");
        riskScore += 15;
      }
      if (!origin_domain.endsWith(".org") && origin_domain.includes("ston")) {
        signals.push("Domain impersonates known brand");
        riskScore += 10;
      }
    }

    if (payload_boc) {
      const opcode = this.extractOpcode(payload_boc);
      if (opcode) {
        signals.push(`Detected opcode 0x${opcode.toString(16)}`);
        if (this.isOpcodeSuspicious(opcode)) {
          signals.push("Opcode associated with ownership/admin transfer");
          riskScore = Math.max(riskScore, 75);
        }
      }
    }

    const risk_level = this.mapScoreToLevel(riskScore);
    const accountSnapshot = this.sanitizeAccount(accountInfo);

    const ai_explanation = await this.buildAiExplanation(
      {
        type: "transaction",
        risk_score: riskScore,
        risk_level,
        signals,
        target_address: normalizedTarget,
        target_account: accountSnapshot,
        origin_domain,
      },
      signals,
      risk_level
    );

    return {
      risk_level,
      risk_score: riskScore,
      signals,
      target_address: normalizedTarget || null,
      target_account: accountSnapshot,
      ai_explanation,
    };
  }

  async analyzeAddress(address) {
    const {
      normalizedAddress,
      signals,
      riskScore,
      accountInfo,
    } = await this.assessAddressBasics(address);

    const risk_level = this.mapScoreToLevel(riskScore);
    const accountSnapshot = this.sanitizeAccount(accountInfo);

    const ai_explanation = await this.buildAiExplanation(
      {
        type: "address",
        risk_score: riskScore,
        risk_level,
        signals,
        address: normalizedAddress,
        account: accountSnapshot,
      },
      signals,
      risk_level
    );

    return {
      address: normalizedAddress || null,
      risk_level,
      risk_score: riskScore,
      signals,
      account: accountSnapshot,
      ai_explanation,
    };
  }

  async analyzeJetton(jettonMasterAddress) {
    const normalized = this.normalizeAddress(jettonMasterAddress);
    const signals = [];
    let riskScore = 20;

    if (!normalized) {
      signals.push("Missing jetton address");
      riskScore = 85;
      return {
        jetton_address: null,
        is_honeypot_suspected: true,
        risk_score: riskScore,
        risk_level: this.mapScoreToLevel(riskScore),
        signals,
        metadata: null,
        holder_count: 0,
        admin_address: null,
        ai_verdict: this.buildFallbackExplanation(this.mapScoreToLevel(riskScore), signals),
      };
    }

    const jettonInfo = await this.fetchJettonInfo(normalized);

    if (!jettonInfo) {
      const accountInfo = await this.fetchAccountInfo(normalized);
      if (this.accountLooksLikeWallet(accountInfo)) {
        const error = new Error("Provided address belongs to a wallet, not a jetton master contract");
        error.code = "NOT_JETTON_MASTER";
        throw error;
      }
    }

    const holders = await this.fetchJettonHolders(normalized);
    const holderCount = holders.length;

    if (!jettonInfo) {
      signals.push("Jetton metadata unavailable from TON API");
      riskScore = Math.max(riskScore, 65);
    }

    const rawAdmin = jettonInfo?.admin?.address || jettonInfo?.admin_address || null;
    const adminBurned = this.isZeroAddress(rawAdmin);
    const adminAddress = adminBurned ? null : this.normalizeAddress(rawAdmin);
    if (adminAddress) {
      signals.push(`Admin can mint or pause tokens (${adminAddress})`);
      riskScore += 50;
    } else if (adminBurned) {
      signals.push("Admin privileges burned (zero address)");
    }

    const totalSupply = this.parseBigInt(jettonInfo?.total_supply);
    if (totalSupply && holderCount > 0 && holderCount < 10 && totalSupply > LARGE_SUPPLY_THRESHOLD) {
      signals.push("Huge supply but holder base < 10 (centralized)");
      riskScore += 30;
    }

    if (holderCount === 0) {
      signals.push("No holder data returned — likely illiquid");
      riskScore += 20;
    }

    const risk_level = this.mapScoreToLevel(riskScore);
    const ai_verdict = await this.buildAiExplanation(
      {
        type: "jetton",
        risk_score: riskScore,
        risk_level,
        signals,
        jetton_address: normalized,
        admin_address: adminAddress || null,
        holder_count: holderCount,
        total_supply: totalSupply?.toString() || null,
      },
      signals,
      risk_level
    );

    return {
      jetton_address: normalized || null,
      is_honeypot_suspected: riskScore >= 60,
      risk_score: riskScore,
      risk_level,
      signals,
      metadata: this.sanitizeJettonMetadata(jettonInfo),
      holder_count: holderCount,
      admin_address: adminAddress || null,
      ai_verdict,
    };
  }

  accountLooksLikeWallet(accountInfo) {
    if (!accountInfo || !Array.isArray(accountInfo.interfaces)) {
      return false;
    }
    return accountInfo.interfaces.some((iface) => typeof iface === "string" && iface.toLowerCase().startsWith("wallet"));
  }

  isZeroAddress(address) {
    if (!address || typeof address !== "string") return false;
    const trimmed = address.trim().toLowerCase();
    if (trimmed === "0" || trimmed === "0x0") return true;
    if (/^0x0+$/i.test(trimmed)) return true;
    if (/^0:0+$/i.test(trimmed)) return true;
    if (/^0+$/.test(trimmed)) return true;
    return false;
  }

  async assessAddressBasics(address) {
    const normalizedAddress = this.normalizeAddress(address);
    const signals = [];
    let riskScore = 10;

    if (!normalizedAddress) {
      signals.push("Missing address");
      return {
        normalizedAddress,
        signals,
        riskScore: 80,
        accountInfo: null,
      };
    }

    if (this.scamAddressCache.has(normalizedAddress)) {
      signals.push(`Address flagged as scam: ${normalizedAddress}`);
      riskScore = Math.max(riskScore, 95);
    }

    const accountInfo = await this.fetchAccountInfo(normalizedAddress);

    if (!accountInfo) {
      signals.push("Address not yet active on-chain");
      // Treat fresh wallets as informational instead of high risk
      riskScore = Math.max(riskScore, 30);
      return { normalizedAddress, signals, riskScore, accountInfo: null };
    }

    if (accountInfo.status === "uninit") {
      signals.push("Account is uninitialized");
      riskScore += 20;
    } else if (accountInfo.status === "frozen") {
      signals.push("Account is frozen");
      riskScore = Math.max(riskScore, 80);
    }

    if (accountInfo.interfaces?.includes("nft_item")) {
      signals.push("Address points to an NFT, not a wallet");
      riskScore += 15;
    }

    const balance = this.parseBigInt(accountInfo.balance);
    if (balance !== null) {
      const tonBalance = Number(balance / ONE_TON_IN_NANOS);
      if (tonBalance < 0.01) {
        signals.push("Balance below 0.01 TON");
        riskScore += 5;
      }
    }

    return { normalizedAddress, signals, riskScore, accountInfo };
  }

  async fetchAccountInfo(address) {
    if (!this.tonService || !address) return null;
    return this.tonService.getAccountInfo(address);
  }

  async fetchJettonInfo(address) {
    if (!this.tonService || !address) return null;
    return this.tonService.getJettonInfo(address);
  }

  async fetchJettonHolders(address) {
    if (!this.tonService || !address) return [];
    return this.tonService.getJettonHolders(address, { limit: 20 });
  }

  sanitizeAccount(accountInfo) {
    if (!accountInfo) return null;
    return {
      status: accountInfo.status,
      balance: this.formatTonAmount(accountInfo.balance),
      balance_nanoton: accountInfo.balance,
      interfaces: accountInfo.interfaces,
      name: accountInfo.name,
    };
  }

  sanitizeJettonMetadata(jettonInfo) {
    if (!jettonInfo) return null;
    const decimals = Number(jettonInfo.metadata?.decimals ?? 9);
    return {
      name: jettonInfo.metadata?.name,
      symbol: jettonInfo.metadata?.symbol,
      description: jettonInfo.metadata?.description,
      image: jettonInfo.metadata?.image,
      decimals: jettonInfo.metadata?.decimals,
      total_supply: jettonInfo.total_supply,
      total_supply_tokens: this.formatTokenAmount(jettonInfo.total_supply, decimals),
    };
  }

  parseBigInt(value) {
    try {
      if (value === null || value === undefined) return null;
      if (typeof value === "bigint") return value;
      if (typeof value === "number") return BigInt(Math.floor(value));
      if (typeof value === "string") {
        if (value.startsWith("0x")) {
          return BigInt(value);
        }
        return BigInt(value);
      }
      return null;
    } catch (err) {
      this.logger?.warn({ err, value }, "Failed to parse BigInt");
      return null;
    }
  }

  formatTonAmount(value, precision = 4) {
    return this.formatTokenAmount(value, 9, precision);
  }

  formatTokenAmount(value, decimals = 9, precision = 4) {
    const amount = this.parseBigInt(value);
    const numericDecimals = Number(decimals);
    if (amount === null || Number.isNaN(numericDecimals) || !Number.isFinite(numericDecimals)) {
      return null;
    }

    const safeDecimals = Math.max(0, Math.min(30, Math.trunc(numericDecimals)));
    const divisor = 10n ** BigInt(safeDecimals);
    const sign = amount < 0n ? "-" : "";
    const abs = amount < 0n ? -amount : amount;

    let whole = abs / divisor;
    let fraction = abs % divisor;

    if (precision <= 0) {
      return `${sign}${whole.toString()}`;
    }

    const scale = 10n ** BigInt(precision);
    fraction = (fraction * scale + divisor / 2n) / divisor; // bankers rounding
    if (fraction === scale) {
      whole += 1n;
      fraction = 0n;
    }

    const fractionStr = fraction.toString().padStart(precision, "0").replace(/0+$/, "");
    return fractionStr ? `${sign}${whole.toString()}.${fractionStr}` : `${sign}${whole.toString()}`;
  }

  extractOpcode(payload) {
    try {
      const [cell] = Cell.fromBoc(Buffer.from(payload, "base64"));
      const slice = cell.beginParse();
      if (slice.remainingBits >= 32) {
        return slice.loadUint(32);
      }
    } catch (err) {
      this.logger?.warn({ err }, "Failed to parse payload BOC");
    }
    return null;
  }

  isOpcodeSuspicious(opcode) {
    const suspectOpcodes = new Set([
      0x5fcc3d14, // transferOwner
      0x0f8a7ea5, // changeAdmin placeholder
      0x178d4519, // withdraw
    ]);
    return suspectOpcodes.has(opcode);
  }

  async buildAiExplanation(payload, signals, riskLevel) {
    const fallback = this.buildFallbackExplanation(riskLevel, signals);
    if (!this.aiService) {
      return fallback;
    }
    return this.aiService.explainRisk({ ...payload, fallback_text: fallback });
  }

  buildFallbackExplanation(riskLevel, signals = []) {
    if (!signals || signals.length === 0) {
      return `Risk level ${riskLevel}. No notable heuristics triggered.`;
    }
    return `Risk level ${riskLevel}. Key signals: ${signals.slice(0, 3).join("; ")}.`;
  }

  loadScamList() {
    const sampleScams = [
      {
        address: "EQCFAKEFRAUDADDRESS000000000000000000000000000000000000",
        reason: "Reported phishing drain",
      },
      {
        address: "EQDREDTEAMTESTADDRESS111111111111111111111111111111111",
        reason: "Malicious jetton mint",
      },
    ];

    sampleScams.forEach((entry) => {
      const key = this.normalizeAddress(entry.address);
      if (key) {
        this.scamAddressCache.set(key, entry.reason || "Flagged scam");
      }
    });
  }

  /**
   * Analyze a website URL or Telegram Mini App link
   * Returns risk assessment based on domain age, patterns, and AI web search
   */
  async analyzeLink(url) {
    const signals = [];
    let riskScore = 10;

    if (!url || typeof url !== "string") {
      signals.push("Invalid or missing URL");
      return {
        url: null,
        risk_level: "CRITICAL",
        risk_score: 90,
        signals,
        domain: null,
        is_telegram_link: false,
        ai_summary: "Unable to analyze: no valid URL provided.",
      };
    }

    // Parse URL
    const parsed = this.linkService?.parseUrl(url);
    if (!parsed || !parsed.domain) {
      signals.push("Failed to parse URL");
      riskScore = 85;
      return {
        url,
        risk_level: this.mapScoreToLevel(riskScore),
        risk_score: riskScore,
        signals,
        domain: null,
        is_telegram_link: false,
        ai_summary: "Unable to parse the provided URL.",
      };
    }

    const { domain, isTelegramLink, botUsername } = parsed;

    // Check for suspicious domain patterns
    const patternSignals = this.linkService?.hasSuspiciousPattern(domain) || [];
    signals.push(...patternSignals);
    riskScore += patternSignals.length * 15;

    // Estimate domain age
    const { ageInDays, signals: ageSignals } = await (this.linkService?.estimateDomainAge(domain) || { ageInDays: null, signals: [] });
    signals.push(...ageSignals);

    if (ageInDays === null) {
      // Unknown age increases risk
      riskScore += 25;
    } else if (ageInDays < 90) {
      signals.push(`Domain is very new (${ageInDays} days old)`);
      riskScore += 35;
    } else if (ageInDays < 365) {
      signals.push(`Domain is relatively new (${ageInDays} days old)`);
      riskScore += 15;
    }

    // Check Telegram bot if applicable
    if (isTelegramLink && botUsername) {
      const { signals: botSignals } = await (this.linkService?.checkTelegramBot(botUsername) || { signals: [] });
      signals.push(...botSignals);
      riskScore += botSignals.length * 10;
    }

    // AI web search for official mentions/news
    let webSearchSummary = "No web search performed.";
    let hasOfficialNews = false;

    if (this.aiService) {
      const searchQuery = isTelegramLink && botUsername ? `Telegram bot @${botUsername}` : domain;
      const searchResult = await this.aiService.searchWebMentions(searchQuery);
      webSearchSummary = searchResult.summary;
      hasOfficialNews = searchResult.hasOfficialNews;

      if (!hasOfficialNews) {
        signals.push("No official news or trusted mentions found online");
        riskScore += 20;
      } else {
        signals.push("Found official mentions or community trust signals");
        riskScore = Math.max(riskScore - 15, 10);
      }
    }

    const risk_level = this.mapScoreToLevel(riskScore);

    return {
      url,
      domain,
      is_telegram_link: isTelegramLink,
      bot_username: botUsername || null,
      risk_level,
      risk_score: riskScore,
      signals,
      domain_age_days: ageInDays,
      has_official_news: hasOfficialNews,
      ai_summary: webSearchSummary,
    };
  }
}
