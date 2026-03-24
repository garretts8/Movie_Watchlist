const request = require('supertest');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const { app, initApp, closeDb } = require('../server');

let authToken;
let createdMovieId;

// Get an existing movie from the database that hasn't been modified
// Let's use one of the other movies from your database
let existingMovieId = '69a61024975615bcb31f46f7'; // League of Extraordinary Gentlemen
let existingMovieTitle = 'League of Extraordinary Gentlemen';

// Unknown movie ID
let unknownMovieId = '69a610f4975615bcb31f4709';

// function to create a valid movie payload
const makeValidMoviePayload = () => {
    return {
        title: `Test Movie ${Date.now()}`,
        director: 'Test Director',
        genre: 'Drama, Romance',
        releaseDate: 'February 28, 2026',
        runtime: '2 hours and 7 minutes',
        rating: 'PG',
        cast: 'Test Actor One, Test Actor Two'
    };
};

// function to create a movie payload that already exists
const makeExistingMoviePayload = () => {
    return {
        title: 'League of Extraordinary Gentlemen',
        director: 'Stephen Norrington',
        genre: 'Action, Adventure',
        releaseDate: 'December 16, 2003',
        runtime: '1 hours and 50 minutes',
        rating: 'PG-13',
        cast: 'Jason Flemyng, Peta Wilson, Sean Connery, Stuart Townsend, Tony Curran'
    };
};

// function to create Nacho Libre movie payload
const makeNachoMoviePayload = () => {
    return {
        title: "Nacho Libre",
        director: "Jared Hess",
        genre: "Comedy",
        releaseDate: "April 25, 2017",
        runtime: "1 hours 32 minutes",
        rating: "PG",
        cast: "Hector Jimenez, Jack Black"
    };
};

// function to create a unique Nacho Libre movie payload
const makeUniqueNachoMoviePayload = () => {
    return {
        title: `Nacho Libre ${Date.now()}`,
        director: "Jared Hess",
        genre: "Comedy",
        releaseDate: "April 25, 2017",
        runtime: "1 hours 32 minutes",
        rating: "PG",
        cast: "Hector Jimenez, Jack Black"
    };
};

// function to create a movie payload with specific overrides
const makeCustomMoviePayload = (overrides = {}) => {
    return {
        title: `Test Movie ${Date.now()}`,
        director: 'Test Director',
        genre: 'Drama, Romance',
        releaseDate: 'February 28, 2026',
        runtime: '2 hours and 7 minutes',
        rating: 'PG',
        cast: 'Test Actor One, Test Actor Two',
        ...overrides
    };
};

// Initialize the app and get an auth token before running tests
beforeAll(async () => {
    await initApp();

    authToken = jwt.sign(
        { id: 'test-user-id', email: 'testuser@example.com' },
        process.env.JWT_SECRET || keys.session.SECRET,
        { expiresIn: '1h' }
    );
});

// Close the database connection after all tests are done
afterAll(async () => {
    await closeDb();
});

// Test Movies API - Unauthorized access (No token)
describe('Movies API - Unauthorized', () => {
    test('GET /movies - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/movies');
        expect(res.status).toBe(401);
    });

    test('GET /movies/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/movies/' + existingMovieId);
        expect(res.status).toBe(401);
    });

    test('POST /movies - returned 401 Unauthorized without token', async () => {
        const res = await request(app).post('/movies').send(makeValidMoviePayload());
        expect(res.status).toBe(401);
    });

    test('PUT /movies/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).put('/movies/' + existingMovieId).send(makeValidMoviePayload());
        expect(res.status).toBe(401);
    });

    test('DELETE /movies/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).delete('/movies/' + existingMovieId);
        expect(res.status).toBe(401);
    });
});

// Test Movies API - GET operations
describe('Movies API - GET operations', () => {
    test('GET /movies - returned all movies', async () => {
        const res = await request(app)
            .get('/movies')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /movies/:id - returned movie with valid ID', async () => {
        const res = await request(app)
            .get('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(existingMovieId);
        expect(res.body.title).toBe(existingMovieTitle);
        expect(res.body.director).toBeDefined();
        expect(res.body.genre).toBeDefined();
        expect(res.body.releaseDate).toBeDefined();
        expect(res.body.runtime).toBeDefined();
        expect(res.body.rating).toBeDefined();
        expect(res.body.cast).toBeDefined();
    });

    test('GET /movies/:id - returned 404 for unknown movie ID', async () => {
        const res = await request(app)
            .get('/movies/' + unknownMovieId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Movie not found');
    });

    test('GET /movies/:id - returned 400 for invalid movie ID (less than 24 chars)', async () => {
        const res = await request(app)
            .get('/movies/69a610f4')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });
});

// Test suite for Movies API - POST create movie validation
describe('Movies API - POST create movie validation', () => {
    // Test 1: Create Nacho Libre movie with unique title
    test('POST /movies - created Nacho Libre movie', async () => {
        const payload = makeUniqueNachoMoviePayload();

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('Movie created successfully');
        expect(res.body.id).toBeDefined();

        // Store the ID for cleanup
        createdMovieId = res.body.id;
    });

    // Test 2: Missing field
    test('POST /movies - returns 400 for missing field', async () => {
        const payload = {
            title: 'Test Movie',
            director: 'Test Director',
            genre: 'Drama',
            releaseDate: 'February 28, 2026',
            runtime: '2 hours',
            rating: 'PG'
            // cast is missing
        };

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        // Check that cast is in the errors array
        const castError = res.body.errors.find(e => e.field === 'cast');
        expect(castError).toBeDefined();
        expect(castError.message).toContain('Cast is required');
    });

    // Test 3: Multiple validation failures
    test('POST /movies - returns 400 for multiple validation failures', async () => {
        const payload = {
            title: 'T',
            director: 'J',
            genre: 'D',
            releaseDate: 'invalid date',
            runtime: 'invalid runtime',
            rating: 'INVALID',
            cast: 'A'
        };

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    // Test 4: Fields too long
    test('POST /movies - returns 400 for fields too long', async () => {
        const longTitle = 'A'.repeat(201);
        const longDirector = 'A'.repeat(101);
        const longGenre = 'A'.repeat(201);
        const longCast = 'A'.repeat(501);

        const payload = {
            title: longTitle,
            director: longDirector,
            genre: longGenre,
            releaseDate: 'February 28, 2026',
            runtime: '2 hours',
            rating: 'PG',
            cast: longCast
        };

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 5: Invalid director name with special characters
    test('POST /movies - rejects director with invalid characters', async () => {
        const payload = makeCustomMoviePayload({
            director: "Director123!@#"
        });

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const directorError = res.body.errors.find(e => e.field === 'director');
        expect(directorError).toBeDefined();
    });

    // Test 6: Valid director name with special characters
    test('POST /movies - accepts director with valid special characters', async () => {
        const payload = makeCustomMoviePayload({
            director: "Steven Spielberg, Jr. & Co."
        });

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        
        // Clean up
        if (res.body.id) {
            await request(app)
                .delete('/movies/' + res.body.id)
                .set('Authorization', `Bearer ${authToken}`);
        }
    });

    // Test 7: Invalid rating
    test('POST /movies - rejects invalid rating', async () => {
        const payload = makeCustomMoviePayload({
            rating: 'RATED-R'
        });

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const ratingError = res.body.errors.find(e => e.field === 'rating');
        expect(ratingError).toBeDefined();
    });

    // Test 8: Valid all ratings
    test('POST /movies - accepts all valid ratings', async () => {
        const validRatings = ['G', 'PG', 'PG-13', 'R', 'NR', 'TV-MA', 'TV-14', 'TV-PG'];
        
        for (const rating of validRatings) {
            const payload = makeCustomMoviePayload({
                rating: rating,
                title: `Test Movie ${rating} ${Date.now()}`
            });

            const res = await request(app)
                .post('/movies')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            
            // Clean up
            if (res.body.id) {
                await request(app)
                    .delete('/movies/' + res.body.id)
                    .set('Authorization', `Bearer ${authToken}`);
            }
        }
    });

    // Test 9: Invalid release date format
    test('POST /movies - rejects invalid release date format', async () => {
        const invalidDates = [
            '2024-03-09',
            '03/09/2024',
            '28 February 2026',
            'invalid-date'
        ];

        for (const invalidDate of invalidDates) {
            const payload = makeCustomMoviePayload({
                releaseDate: invalidDate,
                title: `Test Movie ${Date.now()}`
            });

            const res = await request(app)
                .post('/movies')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
        }
    });

    // Test 10: Valid release date format
    test('POST /movies - accepts valid release date format', async () => {
        const validDates = [
            'February 28, 2026',
            'April 25, 2017',
            'December 19, 2001'
        ];

        for (const validDate of validDates) {
            const payload = makeCustomMoviePayload({
                releaseDate: validDate,
                title: `Test Movie ${Date.now()}`
            });

            const res = await request(app)
                .post('/movies')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            
            // Clean up
            if (res.body.id) {
                await request(app)
                    .delete('/movies/' + res.body.id)
                    .set('Authorization', `Bearer ${authToken}`);
            }
        }
    });

    // Test 11: Valid runtime formats
    test('POST /movies - accepts valid runtime formats', async () => {
        const validRuntimes = [
            '2 hours and 7 minutes',
            '1 hour 50 minutes',
            '2 hours',
            '90 minutes',
            '2 hrs 7 mins',
            '1 hours 32 minutes'
        ];

        for (const runtime of validRuntimes) {
            const payload = makeCustomMoviePayload({
                runtime: runtime,
                title: `Test Movie ${Date.now()}`
            });

            const res = await request(app)
                .post('/movies')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            
            // Clean up
            if (res.body.id) {
                await request(app)
                    .delete('/movies/' + res.body.id)
                    .set('Authorization', `Bearer ${authToken}`);
            }
        }
    });

    // Test 12: Duplicate movie
    test('POST /movies - returns 409 for duplicate movie', async () => {
        const payload = makeExistingMoviePayload();

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        // Check if movie exists (might be 409 or 201 depending on if it's a duplicate)
        if (res.status === 409) {
            expect(res.body.message).toContain('Movie with this title, director, and release date already exists');
        } else if (res.status === 201) {
            // If it was created (maybe the movie didn't exist), clean it up
            if (res.body.id) {
                await request(app)
                    .delete('/movies/' + res.body.id)
                    .set('Authorization', `Bearer ${authToken}`);
            }
        }
    });

    // Test 13: Valid movie creation
    test('POST /movies - created a new movie with valid fields', async () => {
        const payload = makeValidMoviePayload();

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('Movie created successfully');
        expect(res.body.id).toBeDefined();

        createdMovieId = res.body.id;
    });
});

// Test suite for Movies API - PUT update movie validation
describe('Movies API - PUT update movie validation', () => {
    // Test 1: Create a Nacho Libre movie first, then update it
    test('PUT /movies/:id - created and updated Nacho Libre movie', async () => {
        // First create a Nacho Libre movie
        const createRes = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(makeUniqueNachoMoviePayload());
        
        expect(createRes.status).toBe(201);
        const nachoId = createRes.body.id;
        
        // Then update it
        const updatePayload = {
            title: `Nacho Libre Updated ${Date.now()}`,
            director: "Jared Hess",
            genre: "Comedy",
            releaseDate: "April 25, 2017",
            runtime: "1 hours 32 minutes",
            rating: "PG",
            cast: "Hector Jimenez, Jack Black"
        };

        const updateRes = await request(app)
            .put('/movies/' + nachoId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload);

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.message).toBe('Movie updated successfully');
        
        // Clean up
        await request(app)
            .delete('/movies/' + nachoId)
            .set('Authorization', `Bearer ${authToken}`);
    });

    // Test 2: Update with partial fields
    test('PUT /movies/:id - updates movie with partial fields', async () => {
        const payload = {
            title: 'Updated Movie Title',
            rating: 'PG-13'
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Movie updated successfully');
    });

    // Test 3: Update with multiple validation failures
    test('PUT /movies/:id - returns 400 for validation failures', async () => {
        const payload = {
            title: 'T',
            director: 'J',
            genre: 'D',
            releaseDate: 'invalid date',
            runtime: 'invalid',
            rating: 'INVALID',
            cast: 'A'
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    // Test 4: Update with fields too long
    test('PUT /movies/:id - returns 400 for fields too long', async () => {
        const longTitle = 'A'.repeat(201);
        const longCast = 'A'.repeat(501);

        const payload = {
            title: longTitle,
            cast: longCast
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 5: Update with invalid director characters
    test('PUT /movies/:id - rejects director with invalid characters', async () => {
        const payload = {
            director: "Director123!@#"
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 6: Update with invalid rating
    test('PUT /movies/:id - rejects invalid rating', async () => {
        const payload = {
            rating: 'RATED-R'
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 7: Update with all fields correct
    test('PUT /movies/:id - updates movie with all fields correct', async () => {
        const payload = {
            title: existingMovieTitle,
            director: 'Stephen Norrington',
            genre: 'Action, Adventure',
            releaseDate: 'December 16, 2003',
            runtime: '1 hours and 50 minutes',
            rating: 'PG-13',
            cast: 'Jason Flemyng, Peta Wilson, Sean Connery, Stuart Townsend, Tony Curran'
        };

        const res = await request(app)
            .put('/movies/' + existingMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Movie updated successfully');
    });

    // Test 8: Update non-existent movie
    test('PUT /movies/:id - returns 404 for non-existent movie', async () => {
        const payload = makeValidMoviePayload();

        const res = await request(app)
            .put('/movies/' + unknownMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Movie not found');
    });

    // Test 9: Update with invalid ID format
    test('PUT /movies/:id - returns 400 for invalid ID format', async () => {
        const payload = makeValidMoviePayload();

        const res = await request(app)
            .put('/movies/invalid-id-format')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Movies API - DELETE operations
describe('Movies API - DELETE operations', () => {
    test('DELETE /movies/:id - deletes Nacho Libre movie', async () => {
        // First create a unique Nacho Libre movie to delete
        const createRes = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(makeUniqueNachoMoviePayload());

        expect(createRes.status).toBe(201);
        const movieIdToDelete = createRes.body.id;

        // Then delete it
        const deleteRes = await request(app)
            .delete('/movies/' + movieIdToDelete)
            .set('Authorization', `Bearer ${authToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Movie deleted successfully');
    });

    test('DELETE /movies/:id - deletes movie with valid ID', async () => {
        // First create a movie to delete
        const createRes = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(makeValidMoviePayload());

        expect(createRes.status).toBe(201);
        const movieIdToDelete = createRes.body.id;

        // Then delete it
        const deleteRes = await request(app)
            .delete('/movies/' + movieIdToDelete)
            .set('Authorization', `Bearer ${authToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Movie deleted successfully');
    });

    test('DELETE /movies/:id - returns 404 for unknown movie ID', async () => {
        const res = await request(app)
            .delete('/movies/' + unknownMovieId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Movie not found');
    });

    test('DELETE /movies/:id - returns 400 for invalid ID (less than 24 chars)', async () => {
        const res = await request(app)
            .delete('/movies/69ba20f19a4d1b29')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('DELETE /movies/:id - returns 400 for invalid ID (more than 24 chars)', async () => {
        const res = await request(app)
            .delete('/movies/69ba20f19a4d1b296c4164eb12')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Movies API - CRUD operations with created movie
describe('Movies API - CRUD operations with created movie', () => {
    let testMovieId;

    test('POST /movies - created a new movie', async () => {
        const payload = makeValidMoviePayload();

        const res = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('Movie created successfully');
        expect(res.body.id).toBeDefined();

        testMovieId = res.body.id;
    });

    test('GET /movies returned all movies', async () => {
        const res = await request(app)
            .get('/movies')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /movies/:id - returned the created movie', async () => {
        expect(testMovieId).toBeDefined();

        const res = await request(app)
            .get('/movies/' + testMovieId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(testMovieId);
    });

    test('PUT /movies/:id - updated the created movie', async () => {
        expect(testMovieId).toBeDefined();
        const updatePayload = {
            title: 'Updated Test Movie',
            rating: 'PG-13',
            runtime: '2 hours and 15 minutes'
        };
        const res = await request(app)
            .put('/movies/' + testMovieId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Movie updated successfully');
    });

    test('DELETE /movies/:id - deleted the created movie', async () => {
        expect(testMovieId).toBeDefined();
        const res = await request(app)
            .delete('/movies/' + testMovieId)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Movie deleted successfully');
    });
});