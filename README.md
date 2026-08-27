# Fest Movie API

## Local development

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

## Vercel deployment

1. Push this repository to GitHub or GitLab.
2. In Vercel, choose **Add New Project** and import the repository.
3. Keep the default Node.js settings and deploy.
4. In **Project Settings > Environment Variables**, add `TMDB_API_KEY` if TMDB data is required. `TMDB_BASE_URL` is optional.
5. Redeploy after adding or changing environment variables.

The serverless handler is `api/index.js`, and Vercel routes requests to the Express application automatically.

Example deployed requests:

```bash
curl https://YOUR-PROJECT.vercel.app/api/health
curl "https://YOUR-PROJECT.vercel.app/api/movies?page=1&limit=2"
curl "https://YOUR-PROJECT.vercel.app/api/movies/search?query=Fight%20Club"
```

Movie collections are available at these endpoints:

```text
GET /api/movies/popular
GET /api/movies/trending
GET /api/movies/discover
GET /api/movies/upcoming
GET /api/movies/now-playing
```

They support the same `page`, `limit`, `sort`, and `genre` query parameters as `/api/movies`:

```bash
curl "https://YOUR-PROJECT.vercel.app/api/movies/popular?limit=10"
curl "https://YOUR-PROJECT.vercel.app/api/movies/trending?page=1&limit=5"
curl "https://YOUR-PROJECT.vercel.app/api/movies/discover?genre=Action"
curl "https://YOUR-PROJECT.vercel.app/api/movies/upcoming"
curl "https://YOUR-PROJECT.vercel.app/api/movies/now-playing"
```

When `TMDB_API_KEY` is configured, these use TMDB's popular, trending, discover, upcoming, and now-playing collections. Without the key, the six bundled historical sample movies are rotated across each section so every section has at least five movies; configure the key for live and date-accurate upcoming/now-playing results.

## Tests

```bash
npm test
```
