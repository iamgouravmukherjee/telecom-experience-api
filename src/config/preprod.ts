import { AppConfig } from '../types';

const preprodConfig: AppConfig = {
  name: 'preprod',
  port: 4000,
  apiKey: 'preprod-experience-api-key',
  salesforceContextTtlMs: 3 * 60 * 1000,
};

export default preprodConfig;
