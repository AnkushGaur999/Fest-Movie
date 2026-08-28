import { AppError } from '../utils/AppError.js';

export const validateMovieQuery = (req, res, next) => {
    const { page, limit, sort, genre } = req.query;

    if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
        return next(new AppError(400, 'Query parameter "page" must be a positive integer'));
    }

    if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
        return next(new AppError(400, 'Query parameter "limit" must be a positive integer'));
    }

    if (sort !== undefined && String(sort).trim() === '') {
        return next(new AppError(400, 'Query parameter "sort" cannot be empty'));
    }

    if (genre !== undefined && String(genre).trim() === '') {
        return next(new AppError(400, 'Query parameter "genre" cannot be empty'));
    }

    next();
};

export const validateMovieSearchQuery = (req, res, next) => {
    const { page, limit } = req.query;

    if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
        return next(new AppError(400, 'Query parameter "page" must be a positive integer'));
    }

    if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
        return next(new AppError(400, 'Query parameter "limit" must be a positive integer'));
    }

    next();
};

export const validateMovieId = (req, res, next) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
        return next(new AppError(400, 'Movie ID must be a positive integer'));
    }

    next();
};
