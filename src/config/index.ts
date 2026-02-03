import devConfig from './dev';
import preprodConfig from './preprod';
import prodConfig from './prod';
import { AppConfig } from '../types';

const CONFIG_MAP: Record<string, AppConfig> = {
  development: devConfig,
  dev: devConfig,
  'pre-prod': preprodConfig,
  preprod: preprodConfig,
  staging: preprodConfig,
  production: prodConfig,
  prod: prodConfig,
};

const cloneConfig = (config: AppConfig): AppConfig => ({
  ...config,
});

export const loadConfig = (env = process.env.NODE_ENV ?? 'development'): AppConfig => {
  const normalized = env.toLowerCase();
  const base = CONFIG_MAP[normalized] ?? devConfig;
  const cloned = cloneConfig(base);

  const overriddenPort = process.env.PORT ? Number(process.env.PORT) : cloned.port;
  const overriddenApiKey = process.env.API_KEY ?? cloned.apiKey;
  const overriddenTtl = process.env.SF_CONTEXT_TTL_MS
    ? Number(process.env.SF_CONTEXT_TTL_MS)
    : cloned.salesforceContextTtlMs;

  return {
    ...cloned,
    name: normalized,
    port: overriddenPort,
    apiKey: overriddenApiKey,
    salesforceContextTtlMs: overriddenTtl,
  };
};
