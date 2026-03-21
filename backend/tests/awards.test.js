const request = require('supertest');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const { app, initApp, closeDb } = require('../server');

let authToken;
let createdAwardId;
let createdTestIds = []; // Track created test items for cleanup

// Existing movie IDs from your database (these definitely exist)
let existingMovieIds = [
    '69a60fe0975615bcb31f46f3', // Jupiter Ascending
    '69a61024975615bcb31f46f7', // League of Extraordinary Gentlemen
    '69a61042975615bcb31f46f9', // Ever After
    '69a61077975615bcb31f46fb', // Hook
    '69a6179f975615bcb31f4720'  // Lord of the Rings
];

// Use an existing movie that has awards
let existingMovieWithAwards = '69a6179f975615bcb31f4720'; // Lord of the Rings
let existingAwardId = '69a61fcc975615bcb31f4726'; // Lord of the Rings award

// Unknown IDs
let unknownMovieId = '69a610f4975615bcb31f4709';
let unknownAwardId = '69b1dcabc1a7b9ae01a0724b';

// Counter to rotate through movies
let movieIndex = 0;

// function to get next movie ID (cycle through existing movies)
const getNextMovieId = () => {
    const movieId = existingMovieIds[movieIndex % existingMovieIds.length];
    movieIndex++;
    return movieId;
};

// function to create a valid award payload using existing movies
const makeValidAwardPayload = () => {
    const currentYear = new Date().getFullYear();
    return {
        movieId: getNextMovieId(),
        awardName: `Test Award ${Date.now()}`,
        category: 'Best Picture',
        year: currentYear - 1,
        winner: false,
        recipient: 'Test Recipient Name'
    };
};

// function to create an award for an existing movie
const makeExistingMovieAwardPayload = () => {
    const currentYear = new Date().getFullYear();
    return {
        movieId: existingMovieIds[0], // Jupiter Ascending
        awardName: `Test Award ${Date.now()}`,
        category: 'Best Actor',
        year: currentYear - 1,
        winner: false,
        recipient: 'Test Actor Name'
    };
};

// function to create an existing award payload (Lord of the Rings)
const makeExistingAwardPayload = () => {
    return {
        movieId: "69a6179f975615bcb31f4720",
        awardName: "Academy Awards",
        category: "Cinematography, Makeup, Original Score, Visual Effects",
        year: 2002,
        winner: true,
        recipient: "Andrew Lesnie (Cinematography), Peter Owen and Richard Taylor (Makeup)"
    };
};

// function to create an award payload with specific overrides
const makeCustomAwardPayload = (overrides = {}) => {
    const currentYear = new Date().getFullYear();
    return {
        movieId: getNextMovieId(),
        awardName: `Test Award ${Date.now()}`,
        category: 'Best Picture',
        year: currentYear - 1,
        winner: false,
        recipient: 'Test Recipient Name',
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
    // Clean up any test items created during tests
    for (const id of createdTestIds) {
        try {
            await request(app)
                .delete('/awards/' + id)
                .set('Authorization', `Bearer ${authToken}`);
        } catch (err) {
            console.log(`Failed to delete test item ${id}`);
        }
    }
    
    await closeDb();
});

// Test Awards API - Unauthorized access (No token)
describe('Awards API - Unauthorized', () => {
    test('GET /awards - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/awards');
        expect(res.status).toBe(401);
    });

    test('GET /awards/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/awards/' + existingAwardId);
        expect(res.status).toBe(401);
    });

    test('GET /awards/movie/:movieId - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/awards/movie/' + existingMovieIds[0]);
        expect(res.status).toBe(401);
    });

    test('POST /awards - returned 401 Unauthorized without token', async () => {
        const res = await request(app).post('/awards').send(makeValidAwardPayload());
        expect(res.status).toBe(401);
    });

    test('PUT /awards/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).put('/awards/' + existingAwardId).send(makeValidAwardPayload());
        expect(res.status).toBe(401);
    });

    test('DELETE /awards/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).delete('/awards/' + existingAwardId);
        expect(res.status).toBe(401);
    });
});

// Test Awards API - GET operations
describe('Awards API - GET operations', () => {
    test('GET /awards - returned all awards', async () => {
        const res = await request(app)
            .get('/awards')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /awards/:id - returned award with valid ID (Lord of the Rings)', async () => {
        const res = await request(app)
            .get('/awards/' + existingAwardId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(existingAwardId);
        expect(res.body.movieId).toBe(existingMovieWithAwards);
        expect(res.body.awardName).toBe('Academy Awards');
    });

    test('GET /awards/movie/:movieId - returned awards for specific movie', async () => {
        const res = await request(app)
            .get('/awards/movie/' + existingMovieWithAwards)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /awards/:id - returned 404 for unknown award ID', async () => {
        const res = await request(app)
            .get('/awards/' + unknownAwardId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Award not found');
    });

    test('GET /awards/:id - returned 400 for invalid award ID (less than 24 chars)', async () => {
        const res = await request(app)
            .get('/awards/69a610f4')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });
});

// Test suite for Awards API - POST create award validation
describe('Awards API - POST create award validation', () => {
    // Test 1: Create award for existing movie
    test('POST /awards - created award for existing movie', async () => {
        const payload = makeExistingMovieAwardPayload();

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        // Track the created item
        if (res.status === 201 && res.body.id) {
            createdTestIds.push(res.body.id);
            createdAwardId = res.body.id;
        }
        
        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('Award created successfully');
        expect(res.body.id).toBeDefined();
    });

    // Test 2: Missing field
    test('POST /awards - returns 400 for missing field', async () => {
        const payload = {
            movieId: existingMovieIds[0],
            awardName: 'Test Award',
            category: 'Best Picture',
            year: 2024,
            winner: false
            // recipient is missing
        };

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        // Check that recipient is in the errors array
        const recipientError = res.body.errors.find(e => e.field === 'recipient');
        expect(recipientError).toBeDefined();
        expect(recipientError.message).toContain('Recipient is required');
    });

    // Test 3: Multiple validation failures
    test('POST /awards - returns 400 for multiple validation failures', async () => {
        const payload = {
            movieId: '123', // Invalid length
            awardName: 'A', // Too short
            category: 'B', // Too short
            year: 1800, // Too old
            winner: 'not-boolean',
            recipient: 'R' // Too short
        };

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    // Test 4: Invalid movie ID format
    test('POST /awards - returns 400 for invalid movie ID', async () => {
        const payload = makeCustomAwardPayload({
            movieId: 'invalid-movie-id'
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const movieIdError = res.body.errors.find(e => e.field === 'movieId');
        expect(movieIdError).toBeDefined();
    });

    // Test 5: Award name too short
    test('POST /awards - rejects award name less than 2 characters', async () => {
        const payload = makeCustomAwardPayload({
            awardName: 'A'
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const awardNameError = res.body.errors.find(e => e.field === 'awardName');
        expect(awardNameError).toBeDefined();
    });

    // Test 6: Award name too long
    test('POST /awards - rejects award name more than 100 characters', async () => {
        const payload = makeCustomAwardPayload({
            awardName: 'A'.repeat(101)
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 7: Category too short
    test('POST /awards - rejects category less than 2 characters', async () => {
        const payload = makeCustomAwardPayload({
            category: 'B'
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const categoryError = res.body.errors.find(e => e.field === 'category');
        expect(categoryError).toBeDefined();
    });

    // Test 8: Category too long
    test('POST /awards - rejects category more than 100 characters', async () => {
        const payload = makeCustomAwardPayload({
            category: 'B'.repeat(101)
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 9: Year too old (before 1900)
    test('POST /awards - rejects year before 1900', async () => {
        const payload = makeCustomAwardPayload({
            year: 1899
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        
        const yearError = res.body.errors.find(e => e.field === 'year');
        expect(yearError).toBeDefined();
    });

    // Test 10: Year too far in future
    test('POST /awards - rejects year too far in future', async () => {
        const currentYear = new Date().getFullYear();
        const payload = makeCustomAwardPayload({
            year: currentYear + 2
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 11: Valid year range
    test('POST /awards - accepts valid year range', async () => {
        const currentYear = new Date().getFullYear();
        const validYears = [1900, 1950, 2000, currentYear, currentYear + 1];
        
        for (const year of validYears) {
            const payload = makeCustomAwardPayload({
                year: year,
                awardName: `Test Award ${year} ${Date.now()}`
            });

            const res = await request(app)
                .post('/awards')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            
            // Clean up
            if (res.body.id) {
                createdTestIds.push(res.body.id);
            }
        }
    });

    // Test 12: Winner boolean validation
    test('POST /awards - accepts winner as boolean', async () => {
        const payload = makeCustomAwardPayload({
            winner: true,
            awardName: `Test Award True ${Date.now()}`
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        if (res.body.id) {
            createdTestIds.push(res.body.id);
        }
    });

    // Test 13: Recipient too short
    test('POST /awards - rejects recipient less than 2 characters', async () => {
        const payload = makeCustomAwardPayload({
            recipient: 'R'
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 14: Recipient too long
    test('POST /awards - rejects recipient more than 200 characters', async () => {
        const payload = makeCustomAwardPayload({
            recipient: 'R'.repeat(201)
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 15: Valid recipient with special characters
    test('POST /awards - accepts valid recipient with special characters', async () => {
        const payload = makeCustomAwardPayload({
            recipient: "Keira Knightley, Matthew Macfadyen & Co.",
            awardName: `Test Award Special ${Date.now()}`
        });

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        if (res.body.id) {
            createdTestIds.push(res.body.id);
        }
    });
});

// Test suite for Awards API - PUT update award validation
describe('Awards API - PUT update award validation', () => {
    let testAwardId;

    beforeAll(async () => {
        // Create a unique award for PUT tests using an existing movie
        const payload = makeCustomAwardPayload({
            awardName: `PUT Test Award ${Date.now()}`
        });

        const createRes = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        if (createRes.status === 201) {
            testAwardId = createRes.body.id;
            createdTestIds.push(testAwardId);
        }
    });

    // Test 1: Update award with all fields
    test('PUT /awards/:id - updates award with all fields', async () => {
        expect(testAwardId).toBeDefined();

        const payload = {
            awardName: 'Updated BAFTA',
            category: 'Best Director',
            year: 2024,
            winner: true,
            recipient: 'Updated Recipient Name'
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award updated successfully');
    });

    // Test 2: Update with partial fields
    test('PUT /awards/:id - updates award with partial fields', async () => {
        expect(testAwardId).toBeDefined();

        const payload = {
            awardName: 'BAFTA Updated',
            winner: true
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award updated successfully');
    });

    // Test 3: Update with multiple validation failures
    test('PUT /awards/:id - returns 400 for validation failures', async () => {
        const payload = {
            movieId: '123',
            awardName: 'A',
            category: 'B',
            year: 1800,
            winner: 'not-boolean',
            recipient: 'R'
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    // Test 4: Update with invalid year (too old)
    test('PUT /awards/:id - rejects year before 1900', async () => {
        const payload = {
            year: 1899
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 5: Update with year too far in future
    test('PUT /awards/:id - rejects year too far in future', async () => {
        const currentYear = new Date().getFullYear();
        const payload = {
            year: currentYear + 2
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 6: Update with valid year
    test('PUT /awards/:id - accepts valid year', async () => {
        const currentYear = new Date().getFullYear();
        const payload = {
            year: currentYear - 1
        };

        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award updated successfully');
    });

    // Test 7: Update non-existent award
    test('PUT /awards/:id - returns 404 for non-existent award', async () => {
        const payload = makeValidAwardPayload();

        const res = await request(app)
            .put('/awards/' + unknownAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Award not found');
    });

    // Test 8: Update with invalid ID format
    test('PUT /awards/:id - returns 400 for invalid ID format', async () => {
        const payload = makeValidAwardPayload();

        const res = await request(app)
            .put('/awards/invalid-id-format')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Awards API - DELETE operations
describe('Awards API - DELETE operations', () => {
    let testAwardId;

    beforeAll(async () => {
        // Create a unique award for DELETE tests
        const payload = makeCustomAwardPayload({
            awardName: `DELETE Test Award ${Date.now()}`
        });

        const createRes = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        if (createRes.status === 201) {
            testAwardId = createRes.body.id;
        }
    });

    test('DELETE /awards/:id - deletes award with valid ID', async () => {
        expect(testAwardId).toBeDefined();

        const res = await request(app)
            .delete('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award deleted successfully');
    });

    test('DELETE /awards/:id - returns 404 for unknown award ID', async () => {
        const res = await request(app)
            .delete('/awards/' + unknownAwardId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Award not found');
    });

    test('DELETE /awards/:id - returns 400 for invalid ID (less than 24 chars)', async () => {
        const res = await request(app)
            .delete('/awards/69ba20f19a4d1b29')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('DELETE /awards/:id - returns 400 for invalid ID (more than 24 chars)', async () => {
        const res = await request(app)
            .delete('/awards/69ba20f19a4d1b296c4164eb12')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Awards API - CRUD operations with created award
describe('Awards API - CRUD operations with created award', () => {
    let testAwardId;

    test('POST /awards - created a new award', async () => {
        const payload = makeExistingMovieAwardPayload();

        const res = await request(app)
            .post('/awards')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('Award created successfully');
        expect(res.body.id).toBeDefined();

        testAwardId = res.body.id;
        createdTestIds.push(testAwardId);
    });

    test('GET /awards returned all awards', async () => {
        const res = await request(app)
            .get('/awards')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /awards/:id - returned the created award', async () => {
        expect(testAwardId).toBeDefined();

        const res = await request(app)
            .get('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(testAwardId);
    });

    test('GET /awards/movie/:movieId - returned awards for the movie', async () => {
        const res = await request(app)
            .get('/awards/movie/' + existingMovieIds[0])
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('PUT /awards/:id - updated the created award', async () => {
        expect(testAwardId).toBeDefined();
        const updatePayload = {
            awardName: 'Updated Award Name',
            category: 'Updated Category',
            year: 2023,
            winner: true,
            recipient: 'Updated Recipient'
        };
        const res = await request(app)
            .put('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award updated successfully');
    });

    test('DELETE /awards/:id - deleted the created award', async () => {
        expect(testAwardId).toBeDefined();
        const res = await request(app)
            .delete('/awards/' + testAwardId)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Award deleted successfully');
        
        // Remove from tracking array since it's already deleted
        const index = createdTestIds.indexOf(testAwardId);
        if (index > -1) {
            createdTestIds.splice(index, 1);
        }
    });
});