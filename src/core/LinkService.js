import axios from "axios";

export default class LinkService {
  constructor(options = {}) {
    this.logger = options.logger;
  }

  /**
   * Parse URL or @username and extract domain, path, and detect if it's a Telegram bot
   * Supports:
   * - URLs: https://t.me/notcoin_bot
   * - @username: @notcoin_bot
   * - Plain username: notcoin_bot
   */
  parseUrl(urlString) {
    try {
      // Handle @username format (e.g., @notcoin_bot)
      if (urlString.startsWith('@')) {
        const username = urlString.slice(1); // Remove @
        return this.parseTelegramUsername(username);
      }
      
      // Handle plain username without @ or URL (e.g., notcoin_bot)
      if (!urlString.includes('/') && !urlString.includes('.')) {
        return this.parseTelegramUsername(urlString);
      }
      
      // Handle full URLs
      const url = new URL(urlString);
      const domain = url.hostname.toLowerCase();
      const path = url.pathname;
      const searchParams = url.searchParams;
      
      // Detect Telegram bot/mini app links
      const isTelegramLink = domain === 't.me' || domain === 'telegram.me';
      let botUsername = null;
      let isMiniApp = false;
      let startApp = null;
      
      if (isTelegramLink && path) {
        // Extract bot username from t.me/botname or t.me/botname/app
        const match = path.match(/^\/([a-zA-Z0-9_]{5,32})/);
        if (match) {
          botUsername = match[1];
        }
        
        // Check if it's a Mini App (has /app path or startapp parameter)
        isMiniApp = path.includes('/app') || searchParams.has('startapp');
        startApp = searchParams.get('startapp');
      }

      return {
        original: urlString,
        domain,
        path,
        isTelegramLink,
        botUsername,
        isMiniApp,
        startApp,
      };
    } catch (err) {
      this.logger?.warn({ err, urlString }, "Failed to parse URL");
      return null;
    }
  }

  /**
   * Parse plain Telegram username
   * Validates format and detects if it's a bot
   */
  parseTelegramUsername(username) {
    // Telegram username rules:
    // - 5-32 characters
    // - Only a-z, A-Z, 0-9, underscore
    // - Must start with a letter
    // - Cannot end with underscore
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
    
    if (!usernameRegex.test(username)) {
      this.logger?.warn({ username }, "Invalid Telegram username format");
      return null;
    }
    
    // Check if username ends with _bot or Bot (Telegram bot convention)
    const isBotUsername = username.toLowerCase().endsWith('_bot') || username.toLowerCase().endsWith('bot');
    
    return {
      original: `@${username}`,
      domain: 't.me',
      path: `/${username}`,
      isTelegramLink: true,
      botUsername: username,
      isMiniApp: false,
      startApp: null,
      isDirectMention: true, // Flag to indicate it was @username format
      isBotUsername, // Flag to indicate if it looks like a bot
    };
  }

  /**
   * Check if domain has suspicious patterns (numbers, hyphens, common phishing tactics)
   */
  hasSuspiciousPattern(domain) {
    const signals = [];

    // Multiple hyphens or numbers in domain
    if (/[\d-]{4,}/.test(domain)) {
      signals.push("Domain contains suspicious numeric/hyphen patterns");
    }

    // Common typosquatting patterns for TON ecosystem
    const knownBrands = ['ston', 'dedust', 'getgems', 'tonkeeper', 'wallet', 'ton'];
    for (const brand of knownBrands) {
      if (domain.includes(brand) && !domain.endsWith('.org') && !domain.endsWith('.io')) {
        // Check if it's not the official domain
        const officialDomains = [
          'ston.fi',
          'dedust.io',
          'getgems.io',
          'tonkeeper.com',
          'ton.org',
          'wallet.tg'
        ];
        if (!officialDomains.includes(domain)) {
          signals.push(`Domain may impersonate ${brand}`);
        }
      }
    }

    // Very new or free TLDs commonly used in phishing
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    for (const tld of suspiciousTlds) {
      if (domain.endsWith(tld)) {
        signals.push(`Uses free/suspicious TLD (${tld})`);
      }
    }

    return signals;
  }

  /**
   * Estimate domain age heuristically (simplified - in production use WHOIS API)
   * Returns: { ageInDays: number | null, signals: string[] }
   */
  async estimateDomainAge(domain) {
    // Placeholder: In production, integrate with WHOIS API or domain age checker
    // For now, we'll use heuristics based on TLD and known domains
    
    const signals = [];
    let estimatedAgeDays = null;

    // Known old/trusted domains
    const trustedDomains = {
      'ton.org': 2000,
      'ston.fi': 800,
      'dedust.io': 600,
      'getgems.io': 700,
      'tonkeeper.com': 900,
    };

    if (trustedDomains[domain]) {
      estimatedAgeDays = trustedDomains[domain];
      return { ageInDays: estimatedAgeDays, signals };
    }

    // For unknown domains, we can't determine age without WHOIS
    // In production, call WHOIS API here
    // For MVP, we'll flag as "unknown age" which increases suspicion
    signals.push("Domain age unknown (unable to verify registration date)");
    
    return { ageInDays: null, signals };
  }

  /**
   * Check Telegram bot info via heuristics and pattern matching
   * Analyzes bot username for brand impersonation and suspicious patterns
   */
  async checkTelegramBot(botUsername) {
    const signals = [];
    const brands = [];

    if (!botUsername) {
      return { signals, brands, isOfficialBot: false };
    }

    const usernameLower = botUsername.toLowerCase();

    // Validate bot username format
    // Telegram bot usernames MUST end with "bot" or "_bot"
    const isBotFormat = usernameLower.endsWith('_bot') || usernameLower.endsWith('bot');
    
    if (!isBotFormat) {
      signals.push("⚠️ Invalid bot format: username must end with 'bot' or '_bot'");
      signals.push("This might be a user account or channel, not a bot");
      return { 
        signals, 
        brands, 
        isOfficialBot: false,
        isValidBotFormat: false 
      };
    }

    // Check for known official bots
    const officialBots = {
      'notcoin_bot': 'Notcoin',
      'wallet': 'TON Wallet',
      'tonkeeper': 'Tonkeeper',
      'dedust': 'DeDust',
      'stonfi_bot': 'STON.fi',
      'getgems_bot': 'Getgems',
      'fragment': 'Fragment',
      'cexio_ton_bot': 'CEX.IO',
      'cryptobot': 'CryptoBot',
      'tonrocketbot': 'Rocket Wallet',
    };

    const isOfficialBot = officialBots[usernameLower] !== undefined;
    
    if (isOfficialBot) {
      signals.push(`Matches official bot: ${officialBots[usernameLower]}`);
      brands.push(officialBots[usernameLower]);
    }

    // Check for brand impersonation patterns
    const knownBrands = {
      'notcoin': 'Notcoin',
      'ston': 'STON.fi',
      'stonfi': 'STON.fi',
      'dedust': 'DeDust',
      'getgems': 'Getgems',
      'tonkeeper': 'Tonkeeper',
      'wallet': 'TON Wallet',
      'fragment': 'Fragment',
      'ton': 'TON',
    };

    for (const [keyword, brandName] of Object.entries(knownBrands)) {
      if (usernameLower.includes(keyword)) {
        brands.push(brandName);
        if (!isOfficialBot) {
          signals.push(`Bot name contains '${keyword}' → possible ${brandName} impersonation`);
        }
      }
    }

    // Check for suspicious patterns
    if (/[\d-]{4,}/.test(botUsername)) {
      signals.push("Username contains suspicious numeric/hyphen patterns");
    }

    // Check for common scam keywords
    const scamKeywords = ['airdrop', 'bonus', 'free', 'giveaway', 'claim', 'reward', 'earn', 'profit', 'x2', 'double'];
    for (const keyword of scamKeywords) {
      if (usernameLower.includes(keyword)) {
        signals.push(`Username contains scam keyword: '${keyword}'`);
      }
    }

    // Check for multiple brands (red flag)
    if (brands.length > 1) {
      signals.push(`Username combines multiple brands: ${brands.join(', ')} → likely fake`);
    }

    return { 
      signals, 
      brands,
      isOfficialBot,
      officialBrandName: isOfficialBot ? officialBots[usernameLower] : null
    };
  }

  /**
   * Fetch and analyze TonConnect manifest from Mini App
   * Returns permissions, wallet addresses, and suspicious patterns
   */
  async analyzeTonConnectManifest(manifestUrl) {
    const signals = [];
    let permissions = [];
    let walletAddresses = [];
    let appDomain = null;

    if (!manifestUrl) {
      return { signals, permissions, walletAddresses, appDomain, manifest: null };
    }

    try {
      // Fetch manifest
      const response = await axios.get(manifestUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'TONShield/1.0',
        },
      });

      const manifest = response.data;
      
      // Extract app domain
      if (manifest.url) {
        try {
          const url = new URL(manifest.url);
          appDomain = url.hostname;
        } catch (err) {
          signals.push("Invalid app URL in manifest");
        }
      }

      // Analyze requested permissions (if present)
      if (manifest.permissions) {
        permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [manifest.permissions];
        
        // Check for dangerous permissions
        if (permissions.includes('sendTransaction') || permissions.includes('signTransaction')) {
          signals.push("Requests permission to send transactions from your wallet");
        }
        
        if (permissions.includes('requestAccounts') || permissions.includes('ton_requestAccounts')) {
          signals.push("Requests access to your wallet address");
        }
      }

      // Extract wallet addresses from manifest (if any)
      if (manifest.wallet_address) {
        walletAddresses.push(manifest.wallet_address);
      }
      
      if (manifest.receiver_address) {
        walletAddresses.push(manifest.receiver_address);
      }

      // Check for suspicious domains
      if (appDomain) {
        const domainSignals = this.hasSuspiciousPattern(appDomain);
        signals.push(...domainSignals);
      }

      return {
        signals,
        permissions,
        walletAddresses,
        appDomain,
        manifest,
      };

    } catch (err) {
      this.logger?.warn({ err, manifestUrl }, "Failed to fetch TonConnect manifest");
      
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        signals.push("TonConnect manifest not found or unreachable");
      } else if (err.response?.status === 404) {
        signals.push("TonConnect manifest not found (404)");
      } else {
        signals.push("Unable to fetch TonConnect manifest");
      }
      
      return { signals, permissions, walletAddresses, appDomain, manifest: null };
    }
  }

  /**
   * Comprehensive Telegram bot/Mini App analysis
   * Combines bot username check, domain analysis, and TonConnect manifest
   */
  async analyzeTelegramApp(urlInfo) {
    if (!urlInfo || !urlInfo.isTelegramLink) {
      return null;
    }

    const analysis = {
      bot_username: urlInfo.botUsername,
      is_mini_app: urlInfo.isMiniApp,
      brands_detected: [],
      is_official: false,
      official_brand: null,
      is_valid_bot_format: true, // Will be set based on bot check
      app_domain: null,
      permissions: [],
      wallet_addresses: [],
      signals: [],
    };

    // Analyze bot username
    if (urlInfo.botUsername) {
      const botCheck = await this.checkTelegramBot(urlInfo.botUsername);
      analysis.brands_detected = botCheck.brands;
      analysis.is_official = botCheck.isOfficialBot;
      analysis.official_brand = botCheck.officialBrandName;
      analysis.is_valid_bot_format = botCheck.isValidBotFormat !== false; // Check if format is valid
      analysis.signals.push(...botCheck.signals);
    }

    // For Mini Apps, try to fetch TonConnect manifest
    if (urlInfo.isMiniApp) {
      // Common TonConnect manifest patterns
      const possibleManifestUrls = [
        `https://${urlInfo.botUsername}.ton.app/tonconnect-manifest.json`,
        `https://${urlInfo.botUsername}.web.app/tonconnect-manifest.json`,
      ];

      // Try to fetch manifest from common locations
      for (const manifestUrl of possibleManifestUrls) {
        const manifestAnalysis = await this.analyzeTonConnectManifest(manifestUrl);
        if (manifestAnalysis.manifest) {
          analysis.app_domain = manifestAnalysis.appDomain;
          analysis.permissions = manifestAnalysis.permissions;
          analysis.wallet_addresses = manifestAnalysis.walletAddresses;
          analysis.signals.push(...manifestAnalysis.signals);
          break;
        }
      }
    }

    return analysis;
  }
}
