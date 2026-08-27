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

## Tests

```bash
npm test
```
