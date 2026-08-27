export class AppError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export const createError = (statusCode, message, details = null) =>
    new AppError(statusCode, message, details);
