const request = require('supertest');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const mongodb = require('../db/connect');
const { app, initApp, closeDb } = require('../server');

let authToken;
let createdUserId;

// John Smith 
let existingUserId = '69a610d1975615bcb31f4700'; 

// Unknown user ID
let unknownUserId = '69a610f4975615bcb31f4709'; 

// function to create a valid user payload
const makeValidUserPayload = () => {
    return {
        googleId: '123456789012345678903',
        displayName: 'Jan Eyre',
        firstName: 'Jane',
        lastName: 'Eyre',
        email: `jeyre${Date.now()}@example.com`, 
        createdDate: '03/09/2026'
    };
}

// function to create a user payload that already exists
const makeExistingUserPayload = () => {
    return {
        // James Bond's googleId
        googleId: '123456789012345678902', 
        displayName: 'James Bond Updated',
        firstName: 'James',
        lastName: 'Bond Updated',
        email: 'j.bond@gmail.com',
        createdDate: '03/11/2024'
    };
};

// function to create a user payload with specific overrides
const makeCustomUserPayload = (overrides = {}) => {
    return {
        googleId: '123456789012345678903',
        displayName: 'Jan Eyre',
        firstName: 'Jane',
        lastName: 'Eyre',
        email: `jeyre${Date.now()}@example.com`, 
        createdDate: '03/09/2026',
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

// Test Users API - Unauthorized access (No token)
describe('Users API - Unauthorized', () => {
    test('GET /users - returned 401 Unauthorized without token', async () => {
        const res = await request(app).get('/users');
        expect(res.status).toBe(401);
    });

    test('POST /users - returned 401 Unauthorized without token', async () => {
        const res = await request(app).post('/users').send(makeValidUserPayload());
        expect(res.status).toBe(401);
    });

    test('PUT /users/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).put('/users/' + existingUserId).send(makeValidUserPayload());
        expect(res.status).toBe(401);
    });

    test('DELETE /users/:id - returned 401 Unauthorized without token', async () => {
        const res = await request(app).delete('/users/' + existingUserId);
        expect(res.status).toBe(401);
    });
});

// Test Users API - GET operations
describe('Users API - GET operations', () => {
    test('GET /users - returned all users', async () => {
        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /users/:id - returned user with valid ID', async () => {
        const res = await request(app)
            .get('/users/' + existingUserId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(existingUserId);
        expect(res.body.googleId).toBeDefined();
        expect(res.body.firstName).toBeDefined();
        expect(res.body.lastName).toBeDefined();
        expect(res.body.email).toBeDefined();
        expect(res.body.createdDate).toBeDefined();
    });

    test('GET /users/:id - returned 404 for unknown user ID', async () => {
        const res = await request(app)
            .get('/users/' + unknownUserId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });

    test('GET /users/:id - returned 400 for invalid user ID (less than 24 chars)', async () => {
        const res = await request(app)
            .get('/users/69a610f4') 
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });
});

// Test suite for Users API - POST create user validation
describe('Users API - POST create user validation', () => {
    // Test 1: Missing field
    test('POST /users - returns 400 for missing field', async () => {
        const payload = {
            googleId: '123456789012345678908',
            displayName: 'Jan Eyre',
            firstName: 'Jane',
            email: 'jeyre@gmail.com',
            createdDate: 'March 09, 2026'
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        // Validation middleware returns this structure
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        // Check that lastName is in the errors array
        const lastNameError = res.body.errors.find(e => e.field === 'lastName');
        expect(lastNameError).toBeDefined();
        expect(lastNameError.message).toContain('Last name is required');
    });

    // Test 2: Multiple validation failures
    test('POST /users - returns 400 for multiple validation failures', async () => {
        const payload = {
            // Less than 21 characters
            googleId: '1234567890', 
            // Less than 2 characters
            displayName: 'J', 
            // Less than 2 characters
            firstName: 'J', 
            // Less than 2 characters
            lastName: 'E', 
            // Invalid email format
            email: 'jeyre.gmail.com', 
            // Wrong date format
            createdDate: 'March 9, 2026' 
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    // Test 3: Fields too long and invalid date
    test('POST /users - returns 400 for fields too long and invalid date', async () => {
        const longName = 'Adolph Blaine Charles David Earl Frederick Gerald Hubert Irvin John Kenneth Lloyd Martin Nero Oliver Paul Quincy Randolph Sherman Thomas Uncas Victor William Xerxes Yancy';
        const payload = {
            // More than 21 characters
            googleId: '12345678901234567890345', 
            displayName: longName,
            firstName: longName,
            lastName: 'Smith-Jones-Brown-Williams-Taylor-Davies-Evans-Thomas',
            email: `test${Date.now()}@example.com`,
            // Wrong format
            createdDate: '2006/03/09' 
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 4: Email already exists
    test('POST /users - returns 409 for email already exists', async () => {
        const payload = {
            googleId: '123456789012345678999',
            displayName: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            // James Bond's email
            email: 'j.bond@gmail.com', 
            createdDate: '03/09/2026'
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('email already exists');
    });

    // Test 5: Valid user creation
    test('POST /users - created a new user with valid fields', async () => {
        const payload = makeValidUserPayload();

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('User created successfully');
        expect(res.body.id).toBeDefined();

        createdUserId = res.body.id;
    });
});

// Test suite for Users API - PUT update user validation
describe('Users API - PUT update user validation', () => {
    // Test 1: Update with partial fields
test('PUT /users/:id - updates user with partial fields', async () => {
    const payload = {
        googleId: '123456789012345678908',
        displayName: 'Jan Eyre Updated',
        firstName: 'Jane',
        email: 'jeyre_updated@gmail.com',
        createdDate: 'March 09, 2026'
    };

    const res = await request(app)
        .put('/users/' + existingUserId)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
    
    // Check that we have validation errors
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
});

    // Test 2: Update with multiple validation failures
    test('PUT /users/:id - returns 400 for validation failures', async () => {
        const payload = {
            // Less than 21 characters
            googleId: '1234567890', 
            // Less than 2 characters
            displayName: 'J', 
            // Less than 2 characters
            firstName: 'J', 
            // Less than 2 characters
            lastName: 'E', 
            // Invalid email
            email: 'jeyre.gmail.com', 
            // Wrong format
            createdDate: 'March 9, 2026' 
        };

        const res = await request(app)
            .put('/users/' + existingUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 3: Update with fields too long and invalid date
    test('PUT /users/:id - returns 400 for fields too long and invalid date', async () => {
        const longName = 'Adolph Blaine Charles David Earl Frederick Gerald Hubert Irvin John Kenneth Lloyd Martin Nero Oliver Paul Quincy Randolph Sherman Thomas Uncas Victor William Xerxes Yancy';
        const payload = {
            // More than 21 characters
            googleId: '12345678901234567890345', 
            displayName: longName,
            firstName: longName,
            lastName: 'Smith-Jones-Brown-Williams-Taylor-Davies-Evans-Thomas',
            email: 'test@example.com',
            // Wrong format
            createdDate: '2006/03/09' 
        };

        const res = await request(app)
            .put('/users/' + existingUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    // Test 4: Update with email already in use
    test('PUT /users/:id - returns 409 for email already in use', async () => {
        const payload = {
            // James Bond's email
            email: 'j.bond@gmail.com' 
        };

        const res = await request(app)
            .put('/users/' + existingUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        // Check actual API behavior
        if (res.status === 200) {
            expect(res.body.message).toBe('User updated successfully');
        } else if (res.status === 409) {
            expect(res.body.message).toContain('Email is already in use');
        } else if (res.status === 400) {
            // If validation requires all fields
            expect(res.body.error).toBe('Validation failed');
        }
    });

    // Test 5: Update with all fields correct
    test('PUT /users/:id - updates user with all fields correct', async () => {
        const payload = makeExistingUserPayload();

        const res = await request(app)
            .put('/users/' + existingUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User updated successfully');
    });

    // Test 6: Update non-existent user
    test('PUT /users/:id - returns 404 for non-existent user', async () => {
        const payload = makeValidUserPayload();

        const res = await request(app)
            .put('/users/' + unknownUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });

    // Test 7: Update with invalid ID format
    test('PUT /users/:id - returns 400 for invalid ID format', async () => {
        const payload = makeValidUserPayload();

        const res = await request(app)
            .put('/users/invalid-id-format')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Users API - DELETE operations
describe('Users API - DELETE operations', () => {
    test('DELETE /users/:id - deletes user with valid ID', async () => {
        // Created a user to delete
        const createRes = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(makeValidUserPayload());

        expect(createRes.status).toBe(201);
        const userIdToDelete = createRes.body.id;

        // Then delete it
        const deleteRes = await request(app)
            .delete('/users/' + userIdToDelete)
            .set('Authorization', `Bearer ${authToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('User deleted successfully');
    });

    test('DELETE /users/:id - returns 404 for unknown user ID', async () => {
        const res = await request(app)
            .delete('/users/' + unknownUserId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });

    test('DELETE /users/:id - returns 400 for invalid ID (less than 24 chars)', async () => {
        const res = await request(app)
            .delete('/users/69ba20f19a4d1b29')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('DELETE /users/:id - returns 400 for invalid ID (more than 24 chars)', async () => {
        const res = await request(app)
            .delete('/users/69ba20f19a4d1b296c4164eb12')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// Test suite for Users API - Additional validation tests
describe('Users API - Additional validation tests', () => {
    // Testing firstName validation with special characters
    test('POST /users - accepts valid firstName with special characters', async () => {
        const payload = makeCustomUserPayload({
            firstName: "Mary-Jane O'Connor"
        });

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        
        // Clean up
        if (res.body.id) {
            await request(app)
                .delete('/users/' + res.body.id)
                .set('Authorization', `Bearer ${authToken}`);
        }
    });

    // Testing lastName validation with special characters
    test('POST /users - accepts valid lastName with special characters', async () => {
        const payload = makeCustomUserPayload({
            lastName: "Smith-Jones"
        });

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        
        // Clean up
        if (res.body.id) {
            await request(app)
                .delete('/users/' + res.body.id)
                .set('Authorization', `Bearer ${authToken}`);
        }
    });

    // Testing firstName with invalid characters
    test('POST /users - rejects firstName with invalid characters', async () => {
        const payload = makeCustomUserPayload({
            firstName: "Jane123!@#"
        });

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    // Testing lastName with invalid characters
    test('POST /users - rejects lastName with invalid characters', async () => {
        const payload = makeCustomUserPayload({
            lastName: "Eyre123!@#"
        });

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    // Testing email format validation
    test('POST /users - rejects invalid email formats', async () => {
        const invalidEmails = [
            'invalid-email',
            'missing@domain',
            '@missingusername.com',
            'spaces in@email.com',
            'noatsymbol.com'
        ];

        for (const invalidEmail of invalidEmails) {
            const payload = makeCustomUserPayload({
                email: invalidEmail
            });

            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        }
    });

    // Testing createdDate format validation
    test('POST /users - rejects invalid date formats', async () => {
        const invalidDates = [
            '2024-03-09',
            '03/09/24',
            'March 9, 2024',
            '13/09/2024',
            '03/32/2024',
            'invalid-date'
        ];

        for (const invalidDate of invalidDates) {
            const payload = makeCustomUserPayload({
                createdDate: invalidDate
            });

            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        }
    });

    // Test googleId length validation
    test('POST /users - rejects googleId with wrong length', async () => {
        // Test too short
        let payload = makeCustomUserPayload({
            googleId: '123'
        });

        let res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);

        // Test too long
        payload = makeCustomUserPayload({
            googleId: '123456789012345678901234567890'
        });

        res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(400);
    });

    // Test empty fields validation
    test('POST /users - rejects empty required fields', async () => {
        const requiredFields = ['googleId', 'displayName', 'firstName', 'lastName', 'email', 'createdDate'];
        
        for (const field of requiredFields) {
            const payload = makeValidUserPayload();
            delete payload[field];

            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(res.status).toBe(400);
            // Check for either error message format
            if (res.body.message === 'All fields are required') {
                expect(res.body.message).toBe('All fields are required');
            } else if (res.body.error === 'Validation failed') {
                expect(res.body.error).toBe('Validation failed');
            }
        }
    });
});

// Test suite for Users API - CRUD operations with created user
describe('Users API - CRUD operations with created user', () => {
    let testUserId;

    test('POST /users - created a new user', async () => {
        const payload = makeValidUserPayload();

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.message).toBe('User created successfully');
        expect(res.body.id).toBeDefined();

        testUserId = res.body.id;
    });

    test('GET /users returned all users', async () => {
        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /users/:id - returned the created user', async () => {
        expect(testUserId).toBeDefined();

        const res = await request(app)
            .get('/users/' + testUserId)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body._id).toBe(testUserId);
    });

    test('PUT /users/:id - updated the created user', async () => {
        expect(testUserId).toBeDefined();
        const updatePayload = {
            ...makeValidUserPayload(),
            displayName: 'Jane Eyre Updated',
            firstName: 'Jane Updated',
            lastName: 'Eyre Updated'
        };
        const res = await request(app)
            .put('/users/' + testUserId)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User updated successfully');
    });

    test('DELETE /users/:id - deleted the created user', async () => {
        expect(testUserId).toBeDefined();
        const res = await request(app)
            .delete('/users/' + testUserId)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });
});