import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/app.js';

let baseUrl;
let server;

test.before(async () => {
    const result = await new Promise((resolve) => {
        const instance = createServer({ port: 4100 });
        instance.server.on('listening', () => resolve(instance));
    });

    baseUrl = `http://127.0.0.1:${result.port}`;
    server = result.server;
});

test.after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});

test('GET /api/health returns ok', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
});

test('GET /api/movies returns paginated list', async () => {
    const response = await fetch(`${baseUrl}/api/movies?page=1&limit=2`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.page, 1);
    assert.equal(body.limit, 2);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 2);
    assert.ok(body.total > 0);
});

test('GET /api/movies/search finds matching results', async () => {
    const response = await fetch(`${baseUrl}/api/movies/search?query=Fight Club`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
});

test('GET /api/movies/:id returns a movie', async () => {
    const response = await fetch(`${baseUrl}/api/movies/550`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.id, 550);
});

test('GET /api/movies/:id missing returns 404', async () => {
    const response = await fetch(`${baseUrl}/api/movies/999999`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.message, 'Movie not found');
});

test('GET /api/genres returns genres list', async () => {
    const response = await fetch(`${baseUrl}/api/genres`);
});
