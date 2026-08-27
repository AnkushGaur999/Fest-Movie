import { createServer } from './src/app.js';
import { config } from './src/config.js';

const { server } = createServer({ port: config.port });

server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});
