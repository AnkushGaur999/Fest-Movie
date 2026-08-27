import axios from 'axios';
import { config } from '../config.js';
import { movieData, genreLookup } from '../data/movies.js';

const normalizeSort = (sortValue = 'releaseDate') => {
    const source = String(sortValue || 'releaseDate').trim();
    if (!source) return { field: 'releaseDate', direction: 'desc' };

    if (source.startsWith('-')) {
        return { field: source.slice(1), direction: 'desc' };
    }

    if (source.includes(':')) {
        const [field, direction] = source.split(':');
        return { field, direction: direction === 'asc' ? 'asc' : 'desc' };
    }

    return { field: source, direction: 'desc' };
};

const toGenreNameList = (genres) => {
    if (Array.isArray(genres)) {
        return genres.filter(Boolean).map((item) => String(item).trim());
    }

    if (Array.isArray(genres?.genre_ids)) {
        return genres.genre_ids
            .map((genreId) => genreLookup[genreId] || 'Drama')
            .filter(Boolean);
    }

    return [String(genres || 'Drama')];
};

const toOriginalImageUrl = (value) => {
    if (!value) return '';

    if (value.startsWith('http')) {
        return value.replace('/w500/', '/original/').replace('/w300/', '/original/').replace('/w780/', '/original/');
    }

    const normalized = value.startsWith('/') ? value : `/${value}`;
    return `https://image.tmdb.org/t/p/original${normalized}`;
};

const getSourceMovies = async () => {
    if (!config.tmdbApiKey) {
        return movieData;
    }

    try {
        const response = await axios.get(`${config.tmdbBaseUrl}/discover/movie`, {
            params: {
                api_key: config.tmdbApiKey,
                include_adult: false,
                page: 1,
            },
        });

        return (response.data?.results || []).map((movie) => ({
            id: movie.id,
            title: movie.title,
            description: movie.overview,
            releaseDate: movie.release_date,
            rating: movie.vote_average,
            runtime: movie.runtime || 120,
            cast: ['TMDB Cast'],
            genres: movie.genre_ids?.length ? movie.genre_ids.map((genreId) => genreLookup[genreId] || 'Drama') : ['Drama'],
            categories: movie.genre_ids?.length ? movie.genre_ids.map((genreId) => genreLookup[genreId] || 'Drama') : ['Drama'],
        }));
    } catch (error) {
        console.warn('TMDB fetch failed, using fallback local dataset:', error.message);
        return movieData;
    }
};

const ensureMovieShape = (movie) => {
    const genres = toGenreNameList(movie.genres ?? movie.categories ?? movie.genre_ids ?? ['Drama']);
    const categoryValues = Array.isArray(movie.categories)
        ? movie.categories
        : Array.isArray(movie.category)
            ? movie.category
            : genres;

    const imageUrl = toOriginalImageUrl(
        movie.image_url || movie.original_image_url || movie.poster_path || movie.backdrop_path || '',
    );

    return {
        ...movie,
        id: Number(movie.id),
        title: movie.title,
        description: movie.description || movie.overview || 'No description available',
        releaseDate: movie.releaseDate || movie.release_date || 'N/A',
        rating: Number(movie.rating ?? movie.vote_average ?? 0),
        runtime: Number(movie.runtime ?? 120),
        cast: Array.isArray(movie.cast) ? movie.cast : [movie.cast || 'Unknown'],
        categories: categoryValues,
        category: categoryValues[0] || null,
        genres,
        image_url: imageUrl,
        original_image_url: imageUrl,
        poster_url: toOriginalImageUrl(movie.poster_path || movie.image_url || ''),
        backdrop_url: toOriginalImageUrl(movie.backdrop_path || movie.image_url || ''),
    };
};

export const getMovies = async ({ page = 1, limit = 10, sort = 'releaseDate', genre = '', query = '' } = {}) => {
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
    const sortConfig = normalizeSort(sort);

    const sourceMovies = await getSourceMovies();
    const normalizedMovies = sourceMovies.map(ensureMovieShape);

    let filteredMovies = [...normalizedMovies];

    if (genre) {
        filteredMovies = filteredMovies.filter((movie) =>
            [...(movie.categories || []), ...(movie.genres || [])].some(
                (item) => String(item).toLowerCase() === String(genre).toLowerCase(),
            ),
        );
    }

    if (query) {
        filteredMovies = filteredMovies.filter((movie) =>
            movie.title.toLowerCase().includes(query.toLowerCase()),
        );
    }

    const total = filteredMovies.length;

    const sortedMovies = filteredMovies.sort((left, right) => {
        const leftValue = sortConfig.field === 'rating' ? Number(left.rating) : sortConfig.field === 'title' ? left.title : new Date(left.releaseDate).getTime();
        const rightValue = sortConfig.field === 'rating' ? Number(right.rating) : sortConfig.field === 'title' ? right.title : new Date(right.releaseDate).getTime();

        if (sortConfig.field === 'title') {
            return sortConfig.direction === 'asc'
                ? String(leftValue).localeCompare(String(rightValue))
                : String(rightValue).localeCompare(String(leftValue));
        }

        return sortConfig.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    });

    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginatedMovies = sortedMovies.slice(startIndex, startIndex + parsedLimit);

    return {
        data: paginatedMovies,
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / parsedLimit),
    };
};

export const searchMovies = async ({ query = '', page = 1, limit = 10, sort = 'releaseDate' }) => {
    if (!query || !String(query).trim()) {
        return {
            data: [],
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            total: 0,
            totalPages: 0,
        };
    }

    return getMovies({ page, limit, sort, query: String(query).trim() });
};

export const getMovieById = async (id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId)) {
        return null;
    }

    const movies = await getSourceMovies();
    const movie = movies.map(ensureMovieShape).find((item) => item.id === parsedId);
    return movie || null;
};

export const getGenres = async () => {
    const movies = await getSourceMovies();
    const collected = new Map();

    movies.forEach((movie) => {
        const categories = Array.isArray(movie.categories)
            ? movie.categories
            : Array.isArray(movie.genres)
                ? movie.genres
                : movie.genre_ids?.length
                    ? movie.genre_ids.map((genreId) => genreLookup[genreId] || 'Drama')
                    : ['Drama'];

        categories.forEach((genre) => {
            const name = String(genre).trim();
            const id = name.toLowerCase();
            if (!collected.has(id)) {
                collected.set(id, { id, name });
            }
        });
    });

    return [...collected.values()].sort((a, b) => a.name.localeCompare(b.name));
};
