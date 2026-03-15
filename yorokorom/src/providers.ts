import { config } from "./config.js";

export type ProviderName = "openai" | "anthropic";

export type ProviderStatus = {
  name: ProviderName;
  enabled: boolean;
  hasApiKey: boolean;
  baseUrl: string;
};

const providerMap: Record<ProviderName, { apiKey?: string; baseUrl: string }> = {
  openai: {
    apiKey: config.OPENAI_API_KEY,
    baseUrl: config.OPENAI_BASE_URL
  },
  anthropic: {
    apiKey: config.ANTHROPIC_API_KEY,
    baseUrl: config.ANTHROPIC_BASE_URL
  }
};

export function listProviderStatus(): ProviderStatus[] {
  return (Object.keys(providerMap) as ProviderName[]).map((name) => ({
    name,
    enabled: Boolean(providerMap[name].apiKey),
    hasApiKey: Boolean(providerMap[name].apiKey),
    baseUrl: providerMap[name].baseUrl
  }));
}

export function getProviderAuth(name: ProviderName): { apiKey: string; baseUrl: string } {
  const provider = providerMap[name];
  if (!provider || !provider.apiKey) {
    throw new Error(`Provider '${name}' is not configured. Add API key in .env`);
  }
  return {
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl
  };
}
