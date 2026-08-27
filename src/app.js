import express from 'express';
import movieRoutes from './routes/movieRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config.js';

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use('/api', movieRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export function createServer({ port = config.port } = {}) {
    const app = createApp();
    const server = app.listen(port, () => {
        console.log(`Movie API listening on http://localhost:${port}`);
    });

    return { app, server, port };
}
