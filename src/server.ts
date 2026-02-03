import { createServer } from 'http';
import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = createApp({ config, enableDocs: true });
const server = createServer(app);

/**
 * Start the server on the specified port.
 */
server.listen(config.port, () => {
  console.log(`Experience API (${config.name}) listening on port ${config.port}`);
});
