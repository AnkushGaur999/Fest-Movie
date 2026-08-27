import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 3000,
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    tmdbBaseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
};
