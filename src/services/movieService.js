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
        const leftValue = sortConfig.field === 'rating'
            ? Number(left.rating)
            : sortConfig.field === 'popularity'
                ? Number(left.popularity || 0)
                : sortConfig.field === 'title'
                    ? left.title
                    : new Date(left.releaseDate).getTime();
        const rightValue = sortConfig.field === 'rating'
            ? Number(right.rating)
            : sortConfig.field === 'popularity'
                ? Number(right.popularity || 0)
                : sortConfig.field === 'title'
                    ? right.title
                    : new Date(right.releaseDate).getTime();

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

const collectionEndpoints = {
    popular: '/movie/popular',
    trending: '/trending/movie/week',
    discover: '/discover/movie',
    upcoming: '/movie/upcoming',
    'now-playing': '/movie/now_playing',
};

const getLocalMovieCollection = async (type, { page = 1, limit = 10, genre = '' } = {}) => {
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
    const movies = movieData
        .map(ensureMovieShape)
        .filter((movie) => !genre || [...movie.categories, ...movie.genres]
            .some((item) => String(item).toLowerCase() === String(genre).toLowerCase()))
        .sort((left, right) => Number(right.popularity || 0) - Number(left.popularity || 0));

    // The bundled sample data is small, so rotate it to keep every section populated.
    const collectionOffset = {
        popular: 0,
        trending: 1,
        discover: 2,
        upcoming: 3,
        'now-playing': 4,
    }[type];
    const offset = collectionOffset === undefined ? 0 : collectionOffset;
    const bucketedMovies = movies.length === 0
        ? []
        : movies.map((_, index) => movies[(index + offset) % movies.length]).slice(0, Math.min(5, movies.length));
    const startIndex = (parsedPage - 1) * parsedLimit;

    return {
        data: bucketedMovies.slice(startIndex, startIndex + parsedLimit),
        page: parsedPage,
        limit: parsedLimit,
        total: bucketedMovies.length,
        totalPages: bucketedMovies.length === 0 ? 0 : Math.ceil(bucketedMovies.length / parsedLimit),
    };
};

export const getMovieCollection = async (type, { page = 1, limit = 10, sort, genre = '' } = {}) => {
    const endpoint = collectionEndpoints[type];
    if (!endpoint) return getMovies({ page, limit, sort, genre });

    if (config.tmdbApiKey) {
        try {
            const response = await axios.get(`${config.tmdbBaseUrl}${endpoint}`, {
                params: {
                    api_key: config.tmdbApiKey,
                    include_adult: false,
                    page,
                },
            });
            const movies = (response.data?.results || []).map((movie) => ({
                id: movie.id,
                title: movie.title,
                description: movie.overview,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
                popularity: movie.popularity,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                cast: ['TMDB Cast'],
                genres: movie.genre_ids?.map((genreId) => genreLookup[genreId] || 'Drama') || ['Drama'],
                categories: movie.genre_ids?.map((genreId) => genreLookup[genreId] || 'Drama') || ['Drama'],
            })).map(ensureMovieShape);

            const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
            return {
                data: movies.slice(0, parsedLimit),
                page: Number(page) || 1,
                limit: parsedLimit,
                total: response.data?.total_results || movies.length,
                totalPages: response.data?.total_pages || 0,
            };
        } catch (error) {
            console.warn(`TMDB ${type} fetch failed, using fallback local dataset:`, error.message);
        }
    }

    return getLocalMovieCollection(type, { page, limit, genre });
};

export const searchMovies = async ({ query = '', page = 1, limit, sort = 'releaseDate' }) => {
    const normalizedQuery = String(query ?? '').trim();

    if (!normalizedQuery || normalizedQuery.toLowerCase() === 'null') {
        return getMovies({ page, limit: limit ?? 50, sort });
    }

    return getMovies({ page, limit, sort, query: normalizedQuery });
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

const buildMovieCredits = (movie) => {
    const title = movie?.title || 'Movie';
    const castMembers = [
        { id: 1001, cast_id: 1, name: 'Alex Morgan', character: `${title} Lead`, credit_id: 'cast_1', order: 0, popularity: 8.4, profile_path: null },
        { id: 1002, cast_id: 2, name: 'Jamie Lee', character: 'Supporting Character', credit_id: 'cast_2', order: 1, popularity: 7.6, profile_path: null },
        { id: 1003, cast_id: 3, name: 'Chris Patel', character: 'Rival', credit_id: 'cast_3', order: 2, popularity: 7.1, profile_path: null },
        { id: 1004, cast_id: 4, name: 'Dana Brooks', character: 'Guide', credit_id: 'cast_4', order: 3, popularity: 6.9, profile_path: null },
        { id: 1005, cast_id: 5, name: 'Ethan Ross', character: 'Friend', credit_id: 'cast_5', order: 4, popularity: 6.5, profile_path: null },
    ];

    const crewMembers = [
        { id: 2001, credit_id: 'crew_1', name: 'Alicia Grant', department: 'Directing', job: 'Director', gender: 1, profile_path: null },
        { id: 2002, credit_id: 'crew_2', name: 'Marcus Wells', department: 'Writing', job: 'Writer', gender: 2, profile_path: null },
        { id: 2003, credit_id: 'crew_3', name: 'Nina Shah', department: 'Production', job: 'Producer', gender: 1, profile_path: null },
        { id: 2004, credit_id: 'crew_4', name: 'Paul Stone', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
    ];

    return {
        id: Number(movie?.id ?? 0),
        cast: castMembers,
        crew: crewMembers,
    };
};

export const getMovieCredits = async (id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId)) {
        return null;
    }

    const movie = await getMovieById(parsedId);
    if (!movie) {
        return null;
    }

    return buildMovieCredits(movie);
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
