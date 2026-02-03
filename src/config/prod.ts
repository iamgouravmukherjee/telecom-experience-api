import { AppConfig } from '../types';

const prodConfig: AppConfig = {
  name: 'production',
  port: Number(process.env.PORT ?? 3000),
  apiKey: process.env.API_KEY ?? 'prod-experience-api-key',
  salesforceContextTtlMs: 2 * 60 * 1000,
};

export default prodConfig;
