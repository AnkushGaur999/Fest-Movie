import { getMovies, getMovieCollection, searchMovies, getMovieById, getGenres } from '../services/movieService.js';
import { AppError } from '../utils/AppError.js';

export const getAllMovies = async (req, res, next) => {
    try {
        const { page, limit, sort, genre } = req.query;

        const result = await getMovies({ page, limit, sort, genre });
        res.status(200).json({
            success: true,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

export const searchMoviesController = async (req, res, next) => {
    try {
        const { query, page, limit, sort } = req.query;

        if (!query || !String(query).trim()) {
            throw new AppError(400, 'Search query is required');
        }

        const result = await searchMovies({ query, page, limit, sort });
        res.status(200).json({
            success: true,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

export const getMovieCollectionController = (type) => async (req, res, next) => {
    try {
        const { page, limit, sort, genre } = req.query;
        const result = await getMovieCollection(type, { page, limit, sort, genre });
        res.status(200).json({
            success: true,
            type,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

export const getMovieDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const movie = await getMovieById(id);

        if (!movie) {
            throw new AppError(404, 'Movie not found');
        }

        res.status(200).json({
            success: true,
            data: movie,
        });
    } catch (error) {
        next(error);
    }
};

export const getMovieGenres = async (req, res, next) => {
    try {
        const genres = await getGenres();
        res.status(200).json({
            success: true,
            data: genres,
        });
    } catch (error) {
        next(error);
    }
};
