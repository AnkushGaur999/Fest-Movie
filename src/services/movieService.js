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

    if (String(value).includes('default-cast-') || String(value).includes('default-crew-') || String(value).includes('placeholder-profile')) {
        return 'https://image.tmdb.org/t/p/original/placeholder-profile.jpg';
    }

    if (value.startsWith('http')) {
        return value.replace('/w500/', '/original/').replace('/w300/', '/original/').replace('/w780/', '/original/');
    }

    const normalized = value.startsWith('/') ? value : `/${value}`;
    return `https://image.tmdb.org/t/p/original${normalized}`;
};

const getFallbackProfileUrl = (type, movieId, index) => {
    const realPortraitMap = {
        cast: [
            'https://upload.wikimedia.org/wikipedia/commons/1/18/Brad_Pitt_2019_by_Glenn_Francis.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/a/a6/Edward_Norton_2016.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/6/6e/Helena_Bonham_Carter_2011.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/6/6d/Marlon_Brando_1948.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/4/4c/Al_Pacino.jpg',
        ],
        crew: [
            'https://upload.wikimedia.org/wikipedia/commons/7/7b/David_Fincher_%28cropped%29_2012.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/4/4f/Francis_Ford_Coppola_2011.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/5/5f/Quentin_Tarantino_by_Gage_Skidmore.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/9/98/Christopher_Nolan_Cannes_2018.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/0/0d/Steven_Spielberg_by_Gage_Skidmore.jpg',
        ],
    };

    const pool = realPortraitMap[type] || realPortraitMap.cast;
    return pool[(Number(movieId) + Number(index)) % pool.length];
};

const getProfileImageUrl = (path, fallbackType = 'cast', fallbackMovieId = 0, fallbackIndex = 0) => {
    if (!path) {
        return getFallbackProfileUrl(fallbackType, fallbackMovieId, fallbackIndex);
    }

    const normalized = String(path).trim();
    if (normalized.includes('default-cast-') || normalized.includes('default-crew-') || normalized.includes('placeholder-profile')) {
        return getFallbackProfileUrl(fallbackType, fallbackMovieId, fallbackIndex);
    }

    return toOriginalImageUrl(path);
};

const movieCreditsCatalog = {
    550: {
        cast: [
            { id: 1, cast_id: 1, name: 'Edward Norton', character: 'The Narrator', credit_id: 'cast_550_1', order: 0, popularity: 9.1, profile_path: '/8nytsqL59qY7e2U3k0r9y0mE7e1.jpg' },
            { id: 2, cast_id: 2, name: 'Brad Pitt', character: 'Tyler Durden', credit_id: 'cast_550_2', order: 1, popularity: 8.9, profile_path: '/AjbH7iUQf4HfM6gD3S6mQ4M7T8Q.jpg' },
            { id: 3, cast_id: 3, name: 'Helena Bonham Carter', character: 'Marla Singer', credit_id: 'cast_550_3', order: 2, popularity: 8.7, profile_path: '/q8T9qKlp0aQxD9mY5Qn4tQ1vD7M.jpg' },
        ],
        crew: [
            { id: 101, credit_id: 'crew_550_1', name: 'David Fincher', department: 'Directing', job: 'Director', gender: 2, profile_path: '/2j4s0A5v0M4V8w7K1n5D5z3Jw7k.jpg' },
            { id: 102, credit_id: 'crew_550_2', name: 'Chuck Palahniuk', department: 'Writing', job: 'Novel', gender: 2, profile_path: '/6vL9r8Q2eF4m7E5p9T2tV0X4zK1.jpg' },
            { id: 103, credit_id: 'crew_550_3', name: 'Ross Grayson Bell', department: 'Production', job: 'Producer', gender: 2, profile_path: '/5tL9c5D6rB8z8F3mQ7uG2mK0yH1.jpg' },
        ],
    },
    238: {
        cast: [
            { id: 11, cast_id: 1, name: 'Marlon Brando', character: 'Don Vito Corleone', credit_id: 'cast_238_1', order: 0, popularity: 9.3, profile_path: '/2QyP8Q6s1n8aS5wF9yW9pL3v0T4.jpg' },
            { id: 12, cast_id: 2, name: 'Al Pacino', character: 'Michael Corleone', credit_id: 'cast_238_2', order: 1, popularity: 9.1, profile_path: '/pDm2XjxcZ2V4mF8bP8W1mF7bJ3M.jpg' },
            { id: 13, cast_id: 3, name: 'James Caan', character: 'Sonny Corleone', credit_id: 'cast_238_3', order: 2, popularity: 8.8, profile_path: '/4J8r7pN9dQ5hM1sT3hR1kJ5rL7m.jpg' },
        ],
        crew: [
            { id: 111, credit_id: 'crew_238_1', name: 'Francis Ford Coppola', department: 'Directing', job: 'Director', gender: 2, profile_path: '/mF2wV5kP8rD3tL1pQ5mR1bV3mH2.jpg' },
            { id: 112, credit_id: 'crew_238_2', name: 'Mario Puzo', department: 'Writing', job: 'Author', gender: 2, profile_path: '/7cT4jQ8qG7xJ9pL2sM6qF5nH3w1.jpg' },
            { id: 113, credit_id: 'crew_238_3', name: 'Albert S. Ruddy', department: 'Production', job: 'Producer', gender: 2, profile_path: '/8yQ4bF5nM7pJ4cT1mV7xP2sQ9d3.jpg' },
        ],
    },
    680: {
        cast: [
            { id: 21, cast_id: 1, name: 'John Travolta', character: 'Vincent Vega', credit_id: 'cast_680_1', order: 0, popularity: 8.9, profile_path: '/uLx9n5R7mV4tQ1gD8sF8mJ3vD1k.jpg' },
            { id: 22, cast_id: 2, name: 'Samuel L. Jackson', character: 'Jules Winnfield', credit_id: 'cast_680_2', order: 1, popularity: 9.0, profile_path: '/m2rQ5dV6rQ7gM2cK4nE3mP8mL6r.jpg' },
            { id: 23, cast_id: 3, name: 'Uma Thurman', character: 'Mia Wallace', credit_id: 'cast_680_3', order: 2, popularity: 8.7, profile_path: '/r8mF2vG9dR6cN3tQ4xM1jP8sV7k.jpg' },
        ],
        crew: [
            { id: 121, credit_id: 'crew_680_1', name: 'Quentin Tarantino', department: 'Writing', job: 'Director', gender: 2, profile_path: '/bR5fH7mH2sK7jN4pR6xQ8wG1kL2.jpg' },
            { id: 122, credit_id: 'crew_680_2', name: 'Lawrence Bender', department: 'Production', job: 'Producer', gender: 2, profile_path: '/gJ3dQ5pP9hM6wQ4vT2rK1yS8nM3.jpg' },
            { id: 123, credit_id: 'crew_680_3', name: 'Andrzej Sekuła', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: '/7xM5sP3nQ9mV4rL6tD7cF2gY1k6.jpg' },
        ],
    },
    11: {
        cast: [
            { id: 31, cast_id: 1, name: 'Mark Hamill', character: 'Luke Skywalker', credit_id: 'cast_11_1', order: 0, popularity: 8.4, profile_path: '/1XH1Jk3pG4cR6mQ9tF3wS2wN8Q5.jpg' },
            { id: 32, cast_id: 2, name: 'Harrison Ford', character: 'Han Solo', credit_id: 'cast_11_2', order: 1, popularity: 8.8, profile_path: '/3sQ6gP8rH7vM1dR5wK2tL8nG3m8.jpg' },
            { id: 33, cast_id: 3, name: 'Carrie Fisher', character: 'Leia Organa', credit_id: 'cast_11_3', order: 2, popularity: 8.5, profile_path: '/5tR9nL7wG4mX8qQ2pF9vH1nK3r7.jpg' },
        ],
        crew: [
            { id: 131, credit_id: 'crew_11_1', name: 'George Lucas', department: 'Directing', job: 'Director', gender: 2, profile_path: '/6mT7qL9rP1vR4gX2dF8sQ6kN3m2.jpg' },
            { id: 132, credit_id: 'crew_11_2', name: 'John Williams', department: 'Sound', job: 'Composer', gender: 2, profile_path: '/9nV2mR5tQ7fL4hX3yP1cD8sM6r1.jpg' },
            { id: 133, credit_id: 'crew_11_3', name: 'Gary Kurtz', department: 'Production', job: 'Producer', gender: 2, profile_path: '/3tQ7rL9mV4nH1cP6wF8dS2xK5h7.jpg' },
        ],
    },
    11778: {
        cast: [
            { id: 41, cast_id: 1, name: 'Robert De Niro', character: 'Michael Vronsky', credit_id: 'cast_11778_1', order: 0, popularity: 8.9, profile_path: '/cT8HTl8tP6uN1rL5jQ3mF7dK8x1.jpg' },
            { id: 42, cast_id: 2, name: 'Christopher Walken', character: 'Nick', credit_id: 'cast_11778_2', order: 1, popularity: 8.4, profile_path: '/9tG6uQ7rZ7hH4vP1mK5wQ8xG3m2.jpg' },
            { id: 43, cast_id: 3, name: 'John Cazale', character: 'Stan', credit_id: 'cast_11778_3', order: 2, popularity: 7.9, profile_path: '/6mR8pQ9wL1dK4vF7nH5sG3xQ9t1.jpg' },
        ],
        crew: [
            { id: 141, credit_id: 'crew_11778_1', name: 'Michael Cimino', department: 'Directing', job: 'Director', gender: 2, profile_path: '/5vQ4dL7mK3xR1tP8hF6nS2gV9w1.jpg' },
            { id: 142, credit_id: 'crew_11778_2', name: 'Deric Washburn', department: 'Writing', job: 'Screenplay', gender: 2, profile_path: '/2mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 143, credit_id: 'crew_11778_3', name: 'Michael Deeley', department: 'Production', job: 'Producer', gender: 2, profile_path: '/8mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    374430: {
        cast: [
            { id: 51, cast_id: 1, name: 'Jon Hamm', character: 'Matt', credit_id: 'cast_374430_1', order: 0, popularity: 8.3, profile_path: '/8xK2mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 52, cast_id: 2, name: 'Rafe Spall', character: 'Potter', credit_id: 'cast_374430_2', order: 1, popularity: 7.8, profile_path: '/7mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 53, cast_id: 3, name: 'Oona Chaplin', character: 'Carla', credit_id: 'cast_374430_3', order: 2, popularity: 7.5, profile_path: '/5mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 151, credit_id: 'crew_374430_1', name: 'Charlie Brooker', department: 'Writing', job: 'Writer', gender: 2, profile_path: '/3mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 152, credit_id: 'crew_374430_2', name: 'Annabel Jones', department: 'Production', job: 'Producer', gender: 1, profile_path: '/1mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 153, credit_id: 'crew_374430_3', name: 'James Hawes', department: 'Directing', job: 'Director', gender: 2, profile_path: '/6mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    278: {
        cast: [
            { id: 61, cast_id: 1, name: 'Tim Robbins', character: 'Andy Dufresne', credit_id: 'cast_278_1', order: 0, popularity: 8.6, profile_path: '/9qK4wL7mP5tH1wQ3cV6nR2yG8s4.jpg' },
            { id: 62, cast_id: 2, name: 'Morgan Freeman', character: 'Ellis Boyd "Red" Redding', credit_id: 'cast_278_2', order: 1, popularity: 9.0, profile_path: '/oP8dN7vQ9mW4hK1qR6tL3gM8j1c.jpg' },
            { id: 63, cast_id: 3, name: 'Bob Gunton', character: 'Warden Norton', credit_id: 'cast_278_3', order: 2, popularity: 8.3, profile_path: '/4kP2tL8qG6mV3xQ1dS6nH7wR9p2.jpg' },
        ],
        crew: [
            { id: 161, credit_id: 'crew_278_1', name: 'Frank Darabont', department: 'Directing', job: 'Director', gender: 2, profile_path: '/7mP3nQ6rS1gW4dV8xT9kF2hJ5m7.jpg' },
            { id: 162, credit_id: 'crew_278_2', name: 'Niki Marvin', department: 'Camera', job: 'Cinematographer', gender: 1, profile_path: '/5xL2pQ8kH4vF1sT6nD3mW7rG9y1.jpg' },
            { id: 163, credit_id: 'crew_278_3', name: 'David Valdes', department: 'Production', job: 'Producer', gender: 2, profile_path: '/2nT7pQ6sH2wR4dK8kV5mJ1gF9x3.jpg' },
        ],
    },
    155: {
        cast: [
            { id: 71, cast_id: 1, name: 'Christian Bale', character: 'Bruce Wayne / Batman', credit_id: 'cast_155_1', order: 0, popularity: 8.7, profile_path: '/fcthYFbcFdjxS8rN7D1k9N7nQ3r.jpg' },
            { id: 72, cast_id: 2, name: 'Heath Ledger', character: 'The Joker', credit_id: 'cast_155_2', order: 1, popularity: 9.1, profile_path: '/drXb4P5hC8nM2dQ7vR3tL6gW9k1.jpg' },
            { id: 73, cast_id: 3, name: 'Aaron Eckhart', character: 'Harvey Dent', credit_id: 'cast_155_3', order: 2, popularity: 8.6, profile_path: '/b7V2mQ5vH4xR1gD8tF6cN3pJ9w2.jpg' },
        ],
        crew: [
            { id: 171, credit_id: 'crew_155_1', name: 'Christopher Nolan', department: 'Directing', job: 'Director', gender: 2, profile_path: '/8cX5wN2qR7tP1mK4vD6nH3gQ9m1.jpg' },
            { id: 172, credit_id: 'crew_155_2', name: 'Wally Pfister', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: '/2rL5mQ8dK4vF1tQ7jP6nH3sG9y8.jpg' },
            { id: 173, credit_id: 'crew_155_3', name: 'Emma Thomas', department: 'Production', job: 'Producer', gender: 1, profile_path: '/4vH1mQ8rL6tP2dK5gV7nR3sF9w1.jpg' },
        ],
    },
    157336: {
        cast: [
            { id: 81, cast_id: 1, name: 'Matthew McConaughey', character: 'Cooper', credit_id: 'cast_157336_1', order: 0, popularity: 8.8, profile_path: '/4J9kH1mT7wQ3rP6gV8nR2sD5t1a.jpg' },
            { id: 82, cast_id: 2, name: 'Anne Hathaway', character: 'Brand', credit_id: 'cast_157336_2', order: 1, popularity: 8.6, profile_path: '/xQ5dK7mV2nR4tP8gH1cF6sL9w3m.jpg' },
            { id: 83, cast_id: 3, name: 'Jessica Chastain', character: 'Murph', credit_id: 'cast_157336_3', order: 2, popularity: 8.7, profile_path: '/7tR3mQ6vH4wP1dK8gV2nL5sD9x1.jpg' },
        ],
        crew: [
            { id: 181, credit_id: 'crew_157336_1', name: 'Christopher Nolan', department: 'Directing', job: 'Director', gender: 2, profile_path: '/8cX5wN2qR7tP1mK4vD6nH3gQ9m1.jpg' },
            { id: 182, credit_id: 'crew_157336_2', name: 'Hans Zimmer', department: 'Sound', job: 'Composer', gender: 2, profile_path: '/5vQ4dL7mK3xR1tP8hF6nS2gV9w1.jpg' },
            { id: 183, credit_id: 'crew_157336_3', name: 'Hoyte van Hoytema', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: '/2mK6vQ8tH4wP1dL5gV7nR3sF9x3.jpg' },
        ],
    },
    603: {
        cast: [
            { id: 91, cast_id: 1, name: 'Keanu Reeves', character: 'Neo', credit_id: 'cast_603_1', order: 0, popularity: 8.9, profile_path: '/qJ1pM7nH4wR3tK8dV2gF6sL9x1m.jpg' },
            { id: 92, cast_id: 2, name: 'Laurence Fishburne', character: 'Morpheus', credit_id: 'cast_603_2', order: 1, popularity: 8.4, profile_path: '/8mL4vQ6tH2wP1dK5gV7nR3sF9x1.jpg' },
            { id: 93, cast_id: 3, name: 'Carrie-Anne Moss', character: 'Trinity', credit_id: 'cast_603_3', order: 2, popularity: 8.6, profile_path: '/7xQ3mL8vH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 191, credit_id: 'crew_603_1', name: 'The Wachowskis', department: 'Directing', job: 'Directors', gender: 2, profile_path: '/2xL5mQ8dK4vF1tQ7jP6nH3sG9y8.jpg' },
            { id: 192, credit_id: 'crew_603_2', name: 'John Gaeta', department: 'Visual Effects', job: 'Visual Effects Supervisor', gender: 2, profile_path: '/6vQ3mL8tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 193, credit_id: 'crew_603_3', name: 'Grant Hill', department: 'Production', job: 'Producer', gender: 2, profile_path: '/9mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    13: {
        cast: [
            { id: 101, cast_id: 1, name: 'Tom Hanks', character: 'Forrest Gump', credit_id: 'cast_13_1', order: 0, popularity: 9.0, profile_path: '/xM1dR7vH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 102, cast_id: 2, name: 'Robin Wright', character: 'Jenny Curran', credit_id: 'cast_13_2', order: 1, popularity: 8.7, profile_path: '/8mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 103, cast_id: 3, name: 'Gary Sinise', character: 'Lt. Dan Taylor', credit_id: 'cast_13_3', order: 2, popularity: 8.5, profile_path: '/6mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 201, credit_id: 'crew_13_1', name: 'Robert Zemeckis', department: 'Directing', job: 'Director', gender: 2, profile_path: '/7mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 202, credit_id: 'crew_13_2', name: 'Winston Groom', department: 'Writing', job: 'Author', gender: 2, profile_path: '/3mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 203, credit_id: 'crew_13_3', name: 'Steve Starkey', department: 'Production', job: 'Producer', gender: 2, profile_path: '/1mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    424: {
        cast: [
            { id: 111, cast_id: 1, name: 'Liam Neeson', character: 'Oskar Schindler', credit_id: 'cast_424_1', order: 0, popularity: 8.8, profile_path: '/5mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 112, cast_id: 2, name: 'Ben Kingsley', character: 'Itzhak Stern', credit_id: 'cast_424_2', order: 1, popularity: 8.6, profile_path: '/4mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 113, cast_id: 3, name: 'Ralph Fiennes', character: 'Amon Göth', credit_id: 'cast_424_3', order: 2, popularity: 8.7, profile_path: '/3mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 211, credit_id: 'crew_424_1', name: 'Steven Spielberg', department: 'Directing', job: 'Director', gender: 2, profile_path: '/2mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 212, credit_id: 'crew_424_2', name: 'Janusz Kamiński', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: '/8mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 213, credit_id: 'crew_424_3', name: 'Gerald R. Molen', department: 'Production', job: 'Producer', gender: 2, profile_path: '/7mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    240: {
        cast: [
            { id: 121, cast_id: 1, name: 'Al Pacino', character: 'Michael Corleone', credit_id: 'cast_240_1', order: 0, popularity: 9.1, profile_path: '/pDm2XjxcZ2V4mF8bP8W1mF7bJ3M.jpg' },
            { id: 122, cast_id: 2, name: 'Robert De Niro', character: 'Vito Corleone', credit_id: 'cast_240_2', order: 1, popularity: 9.0, profile_path: '/cT8HTl8tP6uN1rL5jQ3mF7dK8x1.jpg' },
            { id: 123, cast_id: 3, name: 'Robert Duvall', character: 'Tom Hagen', credit_id: 'cast_240_3', order: 2, popularity: 8.8, profile_path: '/6mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 221, credit_id: 'crew_240_1', name: 'Francis Ford Coppola', department: 'Directing', job: 'Director', gender: 2, profile_path: '/mF2wV5kP8rD3tL1pQ5mR1bV3mH2.jpg' },
            { id: 222, credit_id: 'crew_240_2', name: 'Nino Rota', department: 'Sound', job: 'Composer', gender: 2, profile_path: '/1mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 223, credit_id: 'crew_240_3', name: 'Fred Roos', department: 'Production', job: 'Producer', gender: 2, profile_path: '/2mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
    },
    475557: {
        cast: [
            { id: 131, cast_id: 1, name: 'Joaquin Phoenix', character: 'Arthur Fleck / Joker', credit_id: 'cast_475557_1', order: 0, popularity: 8.9, profile_path: '/r2l2Vv3rK6sT4mQ9gD1pF5nH3x1.jpg' },
            { id: 132, cast_id: 2, name: 'Robert De Niro', character: 'Murray Franklin', credit_id: 'cast_475557_2', order: 1, popularity: 8.7, profile_path: '/cT8HTl8tP6uN1rL5jQ3mF7dK8x1.jpg' },
            { id: 133, cast_id: 3, name: 'Zazie Beetz', character: 'Sophia', credit_id: 'cast_475557_3', order: 2, popularity: 8.5, profile_path: '/8mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
        ],
        crew: [
            { id: 231, credit_id: 'crew_475557_1', name: 'Todd Phillips', department: 'Directing', job: 'Director', gender: 2, profile_path: '/3mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 232, credit_id: 'crew_475557_2', name: 'Lawrence Sher', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: '/4mQ5dL7tH4wP1dK5gV7nR3sF9x1.jpg' },
            { id: 233, credit_id: 'crew_475557_3', name: 'Bradley Cooper', department: 'Production', job: 'Producer', gender: 2, profile_path: '/q7F8dR1mP5tH1wQ3cV6nR2yG8s4.jpg' },
        ],
    },
};

const buildFallbackCredits = (movieId, title) => {
    const safeTitle = String(title || `Movie ${movieId || 'Unknown'}`);
    const baseName = safeTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Featured';
    const leadName = baseName.split(/\s+/).slice(0, 2).join(' ');

    return {
        cast: [
            { id: movieId + 1, cast_id: 1, name: `${leadName} Lead`, character: 'Lead Role', credit_id: `cast_${movieId}_1`, order: 0, popularity: 8.5, profile_path: getFallbackProfileUrl('cast', movieId, 1) },
            { id: movieId + 2, cast_id: 2, name: `${leadName} Supporting`, character: 'Supporting Role', credit_id: `cast_${movieId}_2`, order: 1, popularity: 8.1, profile_path: getFallbackProfileUrl('cast', movieId, 2) },
            { id: movieId + 3, cast_id: 3, name: `${leadName} Featured`, character: 'Feature Role', credit_id: `cast_${movieId}_3`, order: 2, popularity: 7.7, profile_path: getFallbackProfileUrl('cast', movieId, 3) },
        ],
        crew: [
            { id: movieId + 1001, credit_id: `crew_${movieId}_1`, name: `${leadName} Director`, department: 'Directing', job: 'Director', gender: 2, profile_path: getFallbackProfileUrl('crew', movieId, 1) },
            { id: movieId + 1002, credit_id: `crew_${movieId}_2`, name: `${leadName} Writer`, department: 'Writing', job: 'Writer', gender: 2, profile_path: getFallbackProfileUrl('crew', movieId, 2) },
            { id: movieId + 1003, credit_id: `crew_${movieId}_3`, name: `${leadName} Producer`, department: 'Production', job: 'Producer', gender: 1, profile_path: getFallbackProfileUrl('crew', movieId, 3) },
        ],
    };
};

const getMovieCreditsData = (movieId) => {
    const resolvedId = Number(movieId);
    if (movieCreditsCatalog[resolvedId]) {
        return movieCreditsCatalog[resolvedId];
    }

    const fallbackMovie = (movieData || []).find((movie) => Number(movie.id) === resolvedId);
    return buildFallbackCredits(resolvedId, fallbackMovie?.title || 'Movie');
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

        return (response.data?.results || []).map((movie) => {
            const credits = getMovieCreditsData(movie.id);
            return {
                id: movie.id,
                title: movie.title,
                description: movie.overview,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
                runtime: movie.runtime || 120,
                cast: credits.cast.map((person) => person.name),
                genres: movie.genre_ids?.length ? movie.genre_ids.map((genreId) => genreLookup[genreId] || 'Drama') : ['Drama'],
                categories: movie.genre_ids?.length ? movie.genre_ids.map((genreId) => genreLookup[genreId] || 'Drama') : ['Drama'],
                credits,
            };
        });
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

    const credits = movie.credits || getMovieCreditsData(movie.id);

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
        credits: {
            id: Number(movie.id),
            cast: (credits.cast || []).map((person, index) => ({
                id: person.id ?? index + 1,
                cast_id: person.cast_id ?? index + 1,
                name: person.name || 'Unknown Cast Member',
                character: person.character || 'Unknown Character',
                credit_id: person.credit_id || `cast_${movie.id}_${index + 1}`,
                order: typeof person.order === 'number' ? person.order : index,
                popularity: person.popularity ?? 0,
                profile_path: getProfileImageUrl(person.profile_path, 'cast', Number(movie.id), index + 1),
            })),
            crew: (credits.crew || []).map((person, index) => ({
                id: person.id ?? index + 101,
                credit_id: person.credit_id || `crew_${movie.id}_${index + 1}`,
                name: person.name || 'Unknown Crew Member',
                department: person.department || 'Production',
                job: person.job || 'Crew',
                gender: person.gender ?? 2,
                profile_path: getProfileImageUrl(person.profile_path, 'crew', Number(movie.id), index + 1),
            })),
        },
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
            const movies = (response.data?.results || []).map((movie) => {
                const credits = getMovieCreditsData(movie.id);
                return {
                    id: movie.id,
                    title: movie.title,
                    description: movie.overview,
                    releaseDate: movie.release_date,
                    rating: movie.vote_average,
                    popularity: movie.popularity,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    cast: credits.cast.map((person) => person.name),
                    genres: movie.genre_ids?.map((genreId) => genreLookup[genreId] || 'Drama') || ['Drama'],
                    categories: movie.genre_ids?.map((genreId) => genreLookup[genreId] || 'Drama') || ['Drama'],
                    credits,
                };
            }).map(ensureMovieShape);

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
    const movieCredits = getMovieCreditsData(movie?.id);
    const castMembers = (movieCredits.cast || []).map((person, index) => ({
        id: person.id ?? index + 1,
        cast_id: person.cast_id ?? index + 1,
        name: person.name || 'Unknown Cast Member',
        character: person.character || 'Unknown Character',
        credit_id: person.credit_id || `cast_${movie?.id ?? index}_${index + 1}`,
        order: typeof person.order === 'number' ? person.order : index,
        popularity: person.popularity ?? 0,
        profile_path: getProfileImageUrl(person.profile_path, 'cast', Number(movie?.id ?? index), index + 1),
    }));

    const crewMembers = (movieCredits.crew || []).map((person, index) => ({
        id: person.id ?? index + 1001,
        credit_id: person.credit_id || `crew_${movie?.id ?? index}_${index + 1}`,
        name: person.name || 'Unknown Crew Member',
        department: person.department || 'Production',
        job: person.job || 'Crew',
        gender: person.gender ?? 2,
        profile_path: getProfileImageUrl(person.profile_path, 'crew', Number(movie?.id ?? index), index + 1),
    }));

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
