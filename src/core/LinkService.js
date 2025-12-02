import axios from "axios";

export default class LinkService {
  constructor(options = {}) {
    this.logger = options.logger;
  }

  /**
   * Parse URL and extract domain, path, and detect if it's a Telegram bot link
   */
  parseUrl(urlString) {
    try {
      const url = new URL(urlString);
      const domain = url.hostname.toLowerCase();
      const path = url.pathname;
      
      // Detect Telegram bot/mini app links
      const isTelegramLink = domain === 't.me' || domain === 'telegram.me';
      let botUsername = null;
      
      if (isTelegramLink && path) {
        // Extract bot username from t.me/botname or t.me/botname/app
        const match = path.match(/^\/([a-zA-Z0-9_]{5,32})/);
        if (match) {
          botUsername = match[1];
        }
      }

      return {
        original: urlString,
        domain,
        path,
        isTelegramLink,
        botUsername,
      };
    } catch (err) {
      this.logger?.warn({ err, urlString }, "Failed to parse URL");
      return null;
    }
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
   * Check Telegram bot info via unofficial heuristics
   * In production, integrate with Telegram Bot API if bot token available
   */
  async checkTelegramBot(botUsername) {
    const signals = [];

    if (!botUsername) {
      return { signals, botAge: null };
    }

    // Heuristic: bot usernames ending with "bot" are typically bots
    if (!botUsername.toLowerCase().endsWith('bot')) {
      signals.push("Telegram username may not be an official bot");
    }

    // Check for suspicious patterns in bot name
    if (/[\d-]{4,}/.test(botUsername)) {
      signals.push("Bot username contains suspicious patterns");
    }

    // Placeholder for bot age - would need Telegram API integration
    // For now, we can't determine bot creation date without API access
    signals.push("Bot age verification requires Telegram API (not available in MVP)");

    return { signals, botAge: null };
  }
}
