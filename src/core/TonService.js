import axios from "axios";

const DEFAULT_BASE_URL = "https://tonapi.io/v2";

export default class TonService {
  constructor(options = {}) {
    const { apiKey, baseURL = DEFAULT_BASE_URL, timeout = 8000, logger } = options;
    this.logger = logger;

    const normalizedBase = baseURL.endsWith("/")
      ? baseURL.slice(0, -1)
      : baseURL;

    this.client = axios.create({
      baseURL: normalizedBase,
      timeout,
      headers: {
        Accept: "application/json",
      },
    });

    if (apiKey) {
      this.client.defaults.headers.common.Authorization = `Bearer ${apiKey}`;
    }
  }

  async getAccountInfo(address) {
    if (!address) return null;
    try {
      const { data } = await this.client.get(`/accounts/${address}`);
      return data;
    } catch (err) {
      this.handleError("getAccountInfo", err, { address });
      return null;
    }
  }

  async getJettonInfo(address) {
    if (!address) return null;
    try {
      const { data } = await this.client.get(`/jettons/${address}`);
      return data;
    } catch (err) {
      this.handleError("getJettonInfo", err, { address });
      return null;
    }
  }

  async getJettonHolders(address, params = {}) {
    if (!address) return [];
    try {
      const query = {
        limit: params.limit ?? 20,
        ...params,
      };
      const { data } = await this.client.get(`/jettons/${address}/holders`, {
        params: query,
      });
      return data?.addresses || data?.balances || [];
    } catch (err) {
      this.handleError("getJettonHolders", err, { address });
      return [];
    }
  }

  async getAccountTransactions(address, params = {}) {
    if (!address) return [];
    try {
      const query = {
        limit: params.limit ?? 10,
        ...params,
      };
      // Use /accounts/{account_id}/events endpoint (recommended by TON API)
      const { data } = await this.client.get(`/accounts/${address}/events`, {
        params: query,
      });
      return data?.events || [];
    } catch (err) {
      this.handleError("getAccountTransactions", err, { address });
      return [];
    }
  }

  handleError(method, err, meta = {}) {
    const message = err.response?.data?.message || err.message;
    this.logger?.warn({ method, meta, message }, "TON API request failed");
  }
}
