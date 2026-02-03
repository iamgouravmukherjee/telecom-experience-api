import { AppConfig } from '../types';

const devConfig: AppConfig = {
  name: 'development',
  port: 3000,
  apiKey: 'dev-experience-api-key',
  salesforceContextTtlMs: 5 * 60 * 1000,
};

export default devConfig;
