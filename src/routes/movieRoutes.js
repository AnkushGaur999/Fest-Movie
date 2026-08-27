import express from 'express';
import {
    getAllMovies,
    searchMoviesController,
    getMovieDetails,
    getMovieGenres,
} from '../controllers/movieController.js';
import { validateMovieQuery, validateMovieSearchQuery, validateMovieId } from '../middleware/validation.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/movies', validateMovieQuery, getAllMovies);
router.get('/movies/search', validateMovieSearchQuery, searchMoviesController);
router.get('/movies/:id', validateMovieId, getMovieDetails);
router.get('/genres', getMovieGenres);
router.get('/movies/categories', getMovieGenres);

export default router;
