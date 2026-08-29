import express from 'express';
import {
    getAllMovies,
    getMovieCollectionController,
    searchMoviesController,
    getMovieDetails,
    getMovieCreditsController,
    getMovieGenres,
} from '../controllers/movieController.js';
import { validateMovieQuery, validateMovieSearchQuery, validateMovieId } from '../middleware/validation.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/movies', validateMovieQuery, getAllMovies);
router.get('/movies/search', validateMovieSearchQuery, searchMoviesController);
router.get('/movies/popular', validateMovieQuery, getMovieCollectionController('popular'));
router.get('/movies/trending', validateMovieQuery, getMovieCollectionController('trending'));
router.get('/movies/discover', validateMovieQuery, getMovieCollectionController('discover'));
router.get('/movies/upcoming', validateMovieQuery, getMovieCollectionController('upcoming'));
router.get('/movies/now-playing', validateMovieQuery, getMovieCollectionController('now-playing'));
router.get('/movies/:id', validateMovieId, getMovieDetails);
router.get('/movies/:id/credits', validateMovieId, getMovieCreditsController);
router.get('/genres', getMovieGenres);
router.get('/movies/categories', getMovieGenres);

export default router;
