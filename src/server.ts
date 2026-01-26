import { createServer } from 'http';
import { createApp } from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = createApp();
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Experience API listening on port ${PORT}`);
});
