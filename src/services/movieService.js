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

    const stringValue = String(value).trim();
    if (!stringValue) return '';

    if (stringValue.startsWith('http')) {
        return stringValue
            .replace('/w500/', '/original/')
            .replace('/w300/', '/original/')
            .replace('/w780/', '/original/')
            .replace('/w92/', '/original/')
            .replace('/w128/', '/original/')
            .replace('/w185/', '/original/')
            .replace('/w342/', '/original/')
            .replace('/w500/', '/original/')
            .replace('/w780/', '/original/');
    }

    const normalized = stringValue.startsWith('/') ? stringValue : `/${stringValue}`;
    return `https://image.tmdb.org/t/p/original${normalized}`;
};

const getFallbackProfileUrl = () => 'https://upload.wikimedia.org/wikipedia/commons/4/49/Chris_Nolan_Cannes_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original';

const isBlockedProfilePath = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return !normalized || normalized.includes('default-cast-') || normalized.includes('default-crew-') || normalized.includes('placeholder-profile') || normalized.includes('images.unsplash.com') || normalized.includes('picsum.photos') || normalized.includes('placehold.co') || normalized.includes('loremflickr') || normalized.includes('unsplash');
};

const personProfileMap = {
    'Edward Norton': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Ed_Norton_and_Shauna_Robertson_TIFF_2025_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Brad Pitt': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Brad_Pitt-69858.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Helena Bonham Carter': 'https://upload.wikimedia.org/wikipedia/commons/2/23/MerchantIvoryCurzMayfair201124_%2816_of_28%29_%2854154554145%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'David Fincher': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/TheKillerBFILFF051023_%288_of_22%29_%2853255176376%29_%28cropped2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Chuck Palahniuk': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Chuck_Palahniuk_%2821962%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Marlon Brando': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Marlon-Brando-in-Finland-1967_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Al Pacino': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Al_Pacino_-_Killing_Castro_-_Q%26A_-_Tribeca_2026_-_by_%40JJxFile-23_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'James Caan': 'https://upload.wikimedia.org/wikipedia/commons/3/35/James_Caan_Cannes_2013.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Francis Ford Coppola': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Lena_Herzog_Francis_Ford_Coppola_Wernder_Herzog_Venice_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Mario Puzo': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Mario_Puzo_1972_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Tom Hanks': 'https://upload.wikimedia.org/wikipedia/commons/3/39/TomHanksPrincEdw031223_%2811_of_41%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Anne Hathaway': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Anne_Hathaway-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194764955_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Morgan Freeman': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Morgan_Freeman_Deauville_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Tim Robbins': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Tim_Robbins_2016.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Joaquin Phoenix': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Joaquin_Phoenix_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Robert De Niro': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Robert_De_Niro_2011_Shankbone.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Christopher Nolan': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Christopher_Nolan_Cannes_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Christian Bale': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Christian_Bale-7837.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Keanu Reeves': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Keanu_Reeves_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Harrison Ford': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Harrison_Ford_by_Gage_Skidmore_3.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Steven Spielberg': 'https://upload.wikimedia.org/wikipedia/commons/9/95/Steven_Spielberg_2011.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'George Lucas': 'https://upload.wikimedia.org/wikipedia/commons/2/20/George_Lucas_cropped_2009.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'John Travolta': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/John_Travolta_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Samuel L. Jackson': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/SamuelLJackson.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Uma Thurman': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Uma_Thurman_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Quentin Tarantino': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Quentin_Tarantino_by_Gage_Skidmore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Mark Hamill': 'https://upload.wikimedia.org/wikipedia/commons/6/62/Mark_Hamill_by_Gage_Skidmore_3.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Carrie Fisher': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Carrie_Fisher_2013.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Robin Wright': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Robin_Wright_2017.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Gary Sinise': 'https://upload.wikimedia.org/wikipedia/commons/6/65/Gary_Sinise_2011.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Liam Neeson': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Liam_Neeson_2017.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Ben Kingsley': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Ben_Kingsley_2013.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Ralph Fiennes': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Ralph_Fiennes_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Matthew McConaughey': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Matthew_McConaughey_2019.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Jessica Chastain': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Jessica_Chastain_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Hans Zimmer': 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Hans_Zimmer_2015.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Heath Ledger': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Heath_Ledger_2006.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Aaron Eckhart': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Aaron_Eckhart_2012.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Wally Pfister': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Wally_Pfister_2015.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Emma Thomas': 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Emma_Thomas_2015.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Todd Phillips': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Todd_Phillips_2019.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Bradley Cooper': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Bradley_Cooper_2019.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'John Williams': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/John_Williams_tux.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Gary Kurtz': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Gary_Kurtz.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Frank Darabont': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Frank_Darabont_2010.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Niki Marvin': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Niki_Marvin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'David Valdes': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/David_Valdes.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Lawrence Sher': 'https://upload.wikimedia.org/wikipedia/commons/0/03/Lawrence_Sher.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'The Wachowskis': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Wachowskis_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'John Gaeta': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/John_Gaeta.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Grant Hill': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Grant_Hill_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Robert Zemeckis': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Robert_Zemeckis_2013.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Winston Groom': 'https://upload.wikimedia.org/wikipedia/commons/8/86/Winston_Groom.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Steve Starkey': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Steve_Starkey.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Janusz Kamiński': 'https://upload.wikimedia.org/wikipedia/commons/3/32/Janusz_Kami%C5%84ski.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Gerald R. Molen': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Gerald_Molen.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Robert Duvall': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Robert_Duvall_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Nino Rota': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Nino_Rota.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Fred Roos': 'https://upload.wikimedia.org/wikipedia/commons/2/27/Fred_Roos.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Zazie Beetz': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Zazie_Beetz_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Lawrence Sher': 'https://upload.wikimedia.org/wikipedia/commons/0/03/Lawrence_Sher.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Thomas Newman': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Thomas_Newman_2010.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Andrzej Sekuła': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Andrzej_Seku%C5%82a.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Ross Grayson Bell': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Ross_Grayson_Bell.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Albert S. Ruddy': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Albert_S._Ruddy.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Lawrence Bender': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Lawrence_Bender_2012.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Christopher Walken': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Christopher_Walken_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'John Cazale': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/John_Cazale_1977.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Jon Hamm': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Jon_Hamm_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Rafe Spall': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Rafe_Spall_2015.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Oona Chaplin': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Oona_Chaplin_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Charlie Brooker': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Charlie_Brooker_2015.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Annabel Jones': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Annabel_Jones.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'James Hawes': 'https://upload.wikimedia.org/wikipedia/commons/7/76/James_Hawes.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Bob Gunton': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bob_Gunton_2017.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Carrie-Anne Moss': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Carrie-Anne_Moss_2017.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Laurence Fishburne': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Laurence_Fishburne_2008.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Michael Cimino': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Michael_Cimino_2020.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Deric Washburn': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Deric_Washburn.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Michael Deeley': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Michael_Deeley.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    'Hoyte van Hoytema': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Hoyte_van_Hoytema_2017.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
};

const personProfileCache = new Map();

const getPersonProfileUrl = async (personName) => {
    const cleanName = String(personName || '').trim();
    if (!cleanName) {
        return null;
    }

    if (personProfileMap[cleanName]) {
        return personProfileMap[cleanName];
    }

    if (personProfileCache.has(cleanName)) {
        return personProfileCache.get(cleanName);
    }

    const lookupPromise = (async () => {
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&redirects=1&titles=${encodeURIComponent(cleanName)}&origin=*`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                return null;
            }

            const payload = await response.json();
            const pageEntries = Object.values(payload?.query?.pages || {});
            const page = pageEntries.find((entry) => entry && typeof entry === 'object');
            const source = page?.original?.source || page?.thumbnail?.source;
            return source ? toOriginalImageUrl(source) : null;
        } catch (error) {
            return null;
        }
    })();

    personProfileCache.set(cleanName, lookupPromise);
    return lookupPromise;
};

const getProfileImageUrl = async (path, personName = '', fallbackType = 'cast', fallbackMovieId = 0, fallbackIndex = 0) => {
    if (path) {
        const normalized = String(path).trim();
        if (isBlockedProfilePath(normalized)) {
            return getFallbackProfileUrl(fallbackType, fallbackMovieId, fallbackIndex);
        }

        return toOriginalImageUrl(path);
    }

    if (personName) {
        return (await getPersonProfileUrl(personName)) || getFallbackProfileUrl(fallbackType, fallbackMovieId, fallbackIndex);
    }

    return getFallbackProfileUrl(fallbackType, fallbackMovieId, fallbackIndex);
};

const movieCreditsCatalog = {
    550: {
        cast: [
            { id: 1, cast_id: 1, name: 'Edward Norton', character: 'The Narrator', credit_id: 'cast_550_1', order: 0, popularity: 9.1, profile_path: null },
            { id: 2, cast_id: 2, name: 'Brad Pitt', character: 'Tyler Durden', credit_id: 'cast_550_2', order: 1, popularity: 8.9, profile_path: null },
            { id: 3, cast_id: 3, name: 'Helena Bonham Carter', character: 'Marla Singer', credit_id: 'cast_550_3', order: 2, popularity: 8.7, profile_path: null },
        ],
        crew: [
            { id: 101, credit_id: 'crew_550_1', name: 'David Fincher', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 102, credit_id: 'crew_550_2', name: 'Chuck Palahniuk', department: 'Writing', job: 'Novel', gender: 2, profile_path: null },
            { id: 103, credit_id: 'crew_550_3', name: 'Ross Grayson Bell', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    238: {
        cast: [
            { id: 11, cast_id: 1, name: 'Marlon Brando', character: 'Don Vito Corleone', credit_id: 'cast_238_1', order: 0, popularity: 9.3, profile_path: null },
            { id: 12, cast_id: 2, name: 'Al Pacino', character: 'Michael Corleone', credit_id: 'cast_238_2', order: 1, popularity: 9.1, profile_path: null },
            { id: 13, cast_id: 3, name: 'James Caan', character: 'Sonny Corleone', credit_id: 'cast_238_3', order: 2, popularity: 8.8, profile_path: null },
        ],
        crew: [
            { id: 111, credit_id: 'crew_238_1', name: 'Francis Ford Coppola', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 112, credit_id: 'crew_238_2', name: 'Mario Puzo', department: 'Writing', job: 'Author', gender: 2, profile_path: null },
            { id: 113, credit_id: 'crew_238_3', name: 'Albert S. Ruddy', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    680: {
        cast: [
            { id: 21, cast_id: 1, name: 'John Travolta', character: 'Vincent Vega', credit_id: 'cast_680_1', order: 0, popularity: 8.9, profile_path: null },
            { id: 22, cast_id: 2, name: 'Samuel L. Jackson', character: 'Jules Winnfield', credit_id: 'cast_680_2', order: 1, popularity: 9.0, profile_path: null },
            { id: 23, cast_id: 3, name: 'Uma Thurman', character: 'Mia Wallace', credit_id: 'cast_680_3', order: 2, popularity: 8.7, profile_path: null },
        ],
        crew: [
            { id: 121, credit_id: 'crew_680_1', name: 'Quentin Tarantino', department: 'Writing', job: 'Director', gender: 2, profile_path: null },
            { id: 122, credit_id: 'crew_680_2', name: 'Lawrence Bender', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
            { id: 123, credit_id: 'crew_680_3', name: 'Andrzej Sekuła', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
        ],
    },
    11: {
        cast: [
            { id: 31, cast_id: 1, name: 'Mark Hamill', character: 'Luke Skywalker', credit_id: 'cast_11_1', order: 0, popularity: 8.4, profile_path: null },
            { id: 32, cast_id: 2, name: 'Harrison Ford', character: 'Han Solo', credit_id: 'cast_11_2', order: 1, popularity: 8.8, profile_path: null },
            { id: 33, cast_id: 3, name: 'Carrie Fisher', character: 'Leia Organa', credit_id: 'cast_11_3', order: 2, popularity: 8.5, profile_path: null },
        ],
        crew: [
            { id: 131, credit_id: 'crew_11_1', name: 'George Lucas', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 132, credit_id: 'crew_11_2', name: 'John Williams', department: 'Sound', job: 'Composer', gender: 2, profile_path: null },
            { id: 133, credit_id: 'crew_11_3', name: 'Gary Kurtz', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    11778: {
        cast: [
            { id: 41, cast_id: 1, name: 'Robert De Niro', character: 'Michael Vronsky', credit_id: 'cast_11778_1', order: 0, popularity: 8.9, profile_path: null },
            { id: 42, cast_id: 2, name: 'Christopher Walken', character: 'Nick', credit_id: 'cast_11778_2', order: 1, popularity: 8.4, profile_path: null },
            { id: 43, cast_id: 3, name: 'John Cazale', character: 'Stan', credit_id: 'cast_11778_3', order: 2, popularity: 7.9, profile_path: null },
        ],
        crew: [
            { id: 141, credit_id: 'crew_11778_1', name: 'Michael Cimino', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 142, credit_id: 'crew_11778_2', name: 'Deric Washburn', department: 'Writing', job: 'Screenplay', gender: 2, profile_path: null },
            { id: 143, credit_id: 'crew_11778_3', name: 'Michael Deeley', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    374430: {
        cast: [
            { id: 51, cast_id: 1, name: 'Jon Hamm', character: 'Matt', credit_id: 'cast_374430_1', order: 0, popularity: 8.3, profile_path: null },
            { id: 52, cast_id: 2, name: 'Rafe Spall', character: 'Potter', credit_id: 'cast_374430_2', order: 1, popularity: 7.8, profile_path: null },
            { id: 53, cast_id: 3, name: 'Oona Chaplin', character: 'Carla', credit_id: 'cast_374430_3', order: 2, popularity: 7.5, profile_path: null },
        ],
        crew: [
            { id: 151, credit_id: 'crew_374430_1', name: 'Charlie Brooker', department: 'Writing', job: 'Writer', gender: 2, profile_path: null },
            { id: 152, credit_id: 'crew_374430_2', name: 'Annabel Jones', department: 'Production', job: 'Producer', gender: 1, profile_path: null },
            { id: 153, credit_id: 'crew_374430_3', name: 'James Hawes', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
        ],
    },
    278: {
        cast: [
            { id: 61, cast_id: 1, name: 'Tim Robbins', character: 'Andy Dufresne', credit_id: 'cast_278_1', order: 0, popularity: 8.6, profile_path: null },
            { id: 62, cast_id: 2, name: 'Morgan Freeman', character: 'Ellis Boyd "Red" Redding', credit_id: 'cast_278_2', order: 1, popularity: 9.0, profile_path: null },
            { id: 63, cast_id: 3, name: 'Bob Gunton', character: 'Warden Norton', credit_id: 'cast_278_3', order: 2, popularity: 8.3, profile_path: null },
        ],
        crew: [
            { id: 161, credit_id: 'crew_278_1', name: 'Frank Darabont', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 162, credit_id: 'crew_278_2', name: 'Niki Marvin', department: 'Camera', job: 'Cinematographer', gender: 1, profile_path: null },
            { id: 163, credit_id: 'crew_278_3', name: 'David Valdes', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    155: {
        cast: [
            { id: 71, cast_id: 1, name: 'Christian Bale', character: 'Bruce Wayne / Batman', credit_id: 'cast_155_1', order: 0, popularity: 8.7, profile_path: null },
            { id: 72, cast_id: 2, name: 'Heath Ledger', character: 'The Joker', credit_id: 'cast_155_2', order: 1, popularity: 9.1, profile_path: null },
            { id: 73, cast_id: 3, name: 'Aaron Eckhart', character: 'Harvey Dent', credit_id: 'cast_155_3', order: 2, popularity: 8.6, profile_path: null },
        ],
        crew: [
            { id: 171, credit_id: 'crew_155_1', name: 'Christopher Nolan', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 172, credit_id: 'crew_155_2', name: 'Wally Pfister', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
            { id: 173, credit_id: 'crew_155_3', name: 'Emma Thomas', department: 'Production', job: 'Producer', gender: 1, profile_path: null },
        ],
    },
    157336: {
        cast: [
            { id: 81, cast_id: 1, name: 'Matthew McConaughey', character: 'Cooper', credit_id: 'cast_157336_1', order: 0, popularity: 8.8, profile_path: null },
            { id: 82, cast_id: 2, name: 'Anne Hathaway', character: 'Brand', credit_id: 'cast_157336_2', order: 1, popularity: 8.6, profile_path: null },
            { id: 83, cast_id: 3, name: 'Jessica Chastain', character: 'Murph', credit_id: 'cast_157336_3', order: 2, popularity: 8.7, profile_path: null },
        ],
        crew: [
            { id: 181, credit_id: 'crew_157336_1', name: 'Christopher Nolan', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 182, credit_id: 'crew_157336_2', name: 'Hans Zimmer', department: 'Sound', job: 'Composer', gender: 2, profile_path: null },
            { id: 183, credit_id: 'crew_157336_3', name: 'Hoyte van Hoytema', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
        ],
    },
    603: {
        cast: [
            { id: 91, cast_id: 1, name: 'Keanu Reeves', character: 'Neo', credit_id: 'cast_603_1', order: 0, popularity: 8.9, profile_path: null },
            { id: 92, cast_id: 2, name: 'Laurence Fishburne', character: 'Morpheus', credit_id: 'cast_603_2', order: 1, popularity: 8.4, profile_path: null },
            { id: 93, cast_id: 3, name: 'Carrie-Anne Moss', character: 'Trinity', credit_id: 'cast_603_3', order: 2, popularity: 8.6, profile_path: null },
        ],
        crew: [
            { id: 191, credit_id: 'crew_603_1', name: 'The Wachowskis', department: 'Directing', job: 'Directors', gender: 2, profile_path: null },
            { id: 192, credit_id: 'crew_603_2', name: 'John Gaeta', department: 'Visual Effects', job: 'Visual Effects Supervisor', gender: 2, profile_path: null },
            { id: 193, credit_id: 'crew_603_3', name: 'Grant Hill', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    13: {
        cast: [
            { id: 101, cast_id: 1, name: 'Tom Hanks', character: 'Forrest Gump', credit_id: 'cast_13_1', order: 0, popularity: 9.0, profile_path: null },
            { id: 102, cast_id: 2, name: 'Robin Wright', character: 'Jenny Curran', credit_id: 'cast_13_2', order: 1, popularity: 8.7, profile_path: null },
            { id: 103, cast_id: 3, name: 'Gary Sinise', character: 'Lt. Dan Taylor', credit_id: 'cast_13_3', order: 2, popularity: 8.5, profile_path: null },
        ],
        crew: [
            { id: 201, credit_id: 'crew_13_1', name: 'Robert Zemeckis', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 202, credit_id: 'crew_13_2', name: 'Winston Groom', department: 'Writing', job: 'Author', gender: 2, profile_path: null },
            { id: 203, credit_id: 'crew_13_3', name: 'Steve Starkey', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    424: {
        cast: [
            { id: 111, cast_id: 1, name: 'Liam Neeson', character: 'Oskar Schindler', credit_id: 'cast_424_1', order: 0, popularity: 8.8, profile_path: null },
            { id: 112, cast_id: 2, name: 'Ben Kingsley', character: 'Itzhak Stern', credit_id: 'cast_424_2', order: 1, popularity: 8.6, profile_path: null },
            { id: 113, cast_id: 3, name: 'Ralph Fiennes', character: 'Amon Göth', credit_id: 'cast_424_3', order: 2, popularity: 8.7, profile_path: null },
        ],
        crew: [
            { id: 211, credit_id: 'crew_424_1', name: 'Steven Spielberg', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 212, credit_id: 'crew_424_2', name: 'Janusz Kamiński', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
            { id: 213, credit_id: 'crew_424_3', name: 'Gerald R. Molen', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    240: {
        cast: [
            { id: 121, cast_id: 1, name: 'Al Pacino', character: 'Michael Corleone', credit_id: 'cast_240_1', order: 0, popularity: 9.1, profile_path: null },
            { id: 122, cast_id: 2, name: 'Robert De Niro', character: 'Vito Corleone', credit_id: 'cast_240_2', order: 1, popularity: 9.0, profile_path: null },
            { id: 123, cast_id: 3, name: 'Robert Duvall', character: 'Tom Hagen', credit_id: 'cast_240_3', order: 2, popularity: 8.8, profile_path: null },
        ],
        crew: [
            { id: 221, credit_id: 'crew_240_1', name: 'Francis Ford Coppola', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 222, credit_id: 'crew_240_2', name: 'Nino Rota', department: 'Sound', job: 'Composer', gender: 2, profile_path: null },
            { id: 223, credit_id: 'crew_240_3', name: 'Fred Roos', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    299534: {
        cast: [
            { id: 1311, cast_id: 1, name: 'Robert Downey Jr.', character: 'Tony Stark / Iron Man', credit_id: 'cast_299534_1', order: 0, popularity: 9.3, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 1312, cast_id: 2, name: 'Chris Evans', character: 'Steve Rogers / Captain America', credit_id: 'cast_299534_2', order: 1, popularity: 9.1, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Chris_Evans_2018.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 1313, cast_id: 3, name: 'Mark Ruffalo', character: 'Bruce Banner / Hulk', credit_id: 'cast_299534_3', order: 2, popularity: 8.9, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Mark_Ruffalo_%2836201774756%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 1314, cast_id: 4, name: 'Chris Hemsworth', character: 'Thor', credit_id: 'cast_299534_4', order: 3, popularity: 8.8, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Chris_Hemsworth_-_Crime_101.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 1315, cast_id: 5, name: 'Scarlett Johansson', character: 'Natasha Romanoff / Black Widow', credit_id: 'cast_299534_5', order: 4, popularity: 8.7, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Scarlett_Johansson-8588.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 1316, cast_id: 6, name: 'Jeremy Renner', character: 'Clint Barton / Hawkeye', credit_id: 'cast_299534_6', order: 5, popularity: 8.6, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Jeremy_Renner_at_TIFF_2025_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
        ],
        crew: [
            { id: 2311, credit_id: 'crew_299534_1', name: 'Anthony Russo', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 2312, credit_id: 'crew_299534_2', name: 'Joe Russo', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 2313, credit_id: 'crew_299534_3', name: 'Christopher Markus', department: 'Writing', job: 'Screenplay', gender: 2, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Christopher_Markus_%26_Stephen_McFeely_%2848385355446%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 2314, credit_id: 'crew_299534_4', name: 'Stephen McFeely', department: 'Writing', job: 'Screenplay', gender: 2, profile_path: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Christopher_Markus_%26_Stephen_McFeely_%2848385355446%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original' },
            { id: 2315, credit_id: 'crew_299534_5', name: 'Kevin Feige', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
    475557: {
        cast: [
            { id: 131, cast_id: 1, name: 'Joaquin Phoenix', character: 'Arthur Fleck / Joker', credit_id: 'cast_475557_1', order: 0, popularity: 8.9, profile_path: null },
            { id: 132, cast_id: 2, name: 'Robert De Niro', character: 'Murray Franklin', credit_id: 'cast_475557_2', order: 1, popularity: 8.7, profile_path: null },
            { id: 133, cast_id: 3, name: 'Zazie Beetz', character: 'Sophia', credit_id: 'cast_475557_3', order: 2, popularity: 8.5, profile_path: null },
        ],
        crew: [
            { id: 231, credit_id: 'crew_475557_1', name: 'Todd Phillips', department: 'Directing', job: 'Director', gender: 2, profile_path: null },
            { id: 232, credit_id: 'crew_475557_2', name: 'Lawrence Sher', department: 'Camera', job: 'Cinematographer', gender: 2, profile_path: null },
            { id: 233, credit_id: 'crew_475557_3', name: 'Bradley Cooper', department: 'Production', job: 'Producer', gender: 2, profile_path: null },
        ],
    },
};

for (const movieCredits of Object.values(movieCreditsCatalog)) {
    if (movieCredits?.cast) {
        movieCredits.cast = movieCredits.cast.map((person) => ({
            ...person,
            profile_path: person.profile_path || personProfileMap[person.name] || null,
        }));
    }

    if (movieCredits?.crew) {
        movieCredits.crew = movieCredits.crew.map((person) => ({
            ...person,
            profile_path: person.profile_path || personProfileMap[person.name] || null,
        }));
    }
}

const buildFallbackCredits = () => ({
    cast: [],
    crew: [],
});

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

const ensureMovieShape = async (movie) => {
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
    const castMembers = await Promise.all((credits.cast || []).map(async (person, index) => ({
        id: person.id ?? index + 1,
        cast_id: person.cast_id ?? index + 1,
        name: person.name || 'Unknown Cast Member',
        character: person.character || 'Unknown Character',
        credit_id: person.credit_id || `cast_${movie.id}_${index + 1}`,
        order: typeof person.order === 'number' ? person.order : index,
        popularity: person.popularity ?? 0,
        profile_path: await getProfileImageUrl(person.profile_path, person.name, 'cast', Number(movie.id), index + 1),
    })));

    const crewMembers = await Promise.all((credits.crew || []).map(async (person, index) => ({
        id: person.id ?? index + 101,
        credit_id: person.credit_id || `crew_${movie.id}_${index + 1}`,
        name: person.name || 'Unknown Crew Member',
        department: person.department || 'Production',
        job: person.job || 'Crew',
        gender: person.gender ?? 2,
        profile_path: await getProfileImageUrl(person.profile_path, person.name, 'crew', Number(movie.id), index + 1),
    })));

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
            cast: castMembers,
            crew: crewMembers,
        },
    };
};

export const getMovies = async ({ page = 1, limit = 10, sort = 'releaseDate', genre = '', query = '' } = {}) => {
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;
    const sortConfig = normalizeSort(sort);

    const sourceMovies = await getSourceMovies();
    const normalizedMovies = await Promise.all(sourceMovies.map(ensureMovieShape));

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
    const movies = (await Promise.all(movieData.map(ensureMovieShape)))
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
            const movies = await Promise.all((response.data?.results || []).map(async (movie) => {
                const credits = getMovieCreditsData(movie.id);
                const shapedMovie = {
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
                return ensureMovieShape(shapedMovie);
            }));

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
    const shapedMovies = await Promise.all(movies.map(ensureMovieShape));
    const movie = shapedMovies.find((item) => item.id === parsedId);
    return movie || null;
};

const buildMovieCredits = async (movie) => {
    const movieCredits = getMovieCreditsData(movie?.id);
    const castMembers = await Promise.all((movieCredits.cast || []).map(async (person, index) => ({
        id: person.id ?? index + 1,
        cast_id: person.cast_id ?? index + 1,
        name: person.name || 'Unknown Cast Member',
        character: person.character || 'Unknown Character',
        credit_id: person.credit_id || `cast_${movie?.id ?? index}_${index + 1}`,
        order: typeof person.order === 'number' ? person.order : index,
        popularity: person.popularity ?? 0,
        profile_path: await getProfileImageUrl(person.profile_path, person.name, 'cast', Number(movie?.id ?? index), index + 1),
    })));

    const crewMembers = await Promise.all((movieCredits.crew || []).map(async (person, index) => ({
        id: person.id ?? index + 1001,
        credit_id: person.credit_id || `crew_${movie?.id ?? index}_${index + 1}`,
        name: person.name || 'Unknown Crew Member',
        department: person.department || 'Production',
        job: person.job || 'Crew',
        gender: person.gender ?? 2,
        profile_path: await getProfileImageUrl(person.profile_path, person.name, 'crew', Number(movie?.id ?? index), index + 1),
    })));

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
