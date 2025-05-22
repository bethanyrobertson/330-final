const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const server = require('../server');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

// Test admin data
const testAdmin = {
  name: 'Test Admin',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
  adminSecret: process.env.ADMIN_SECRET
};

// Store JWT token for authenticated requests
let token;
let adminToken;

describe('Auth API', () => {
  // Before all tests, clear the database
  beforeAll(async () => {
    await User.deleteMany({});
  });

  // After all tests, clear the database and close the connection
  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  // Test register route
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      
      // Save token for later tests
      token = res.body.token;
    });

    it('should register a new admin with valid admin secret', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(testAdmin);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      
      // Save admin token for later tests
      adminToken = res.body.token;
    });

    it('should not register a user with the same email', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should not register an admin with invalid admin secret', async () => {
      const invalidAdmin = {
        ...testAdmin,
        email: 'another@example.com',
        adminSecret: 'wrong-secret'
      };

      const res = await request(server)
        .post('/api/auth/register')
        .send(invalidAdmin);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test login route
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test getMe route
  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testUser.name);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.role).toBe('user');
    });

    it('should get admin profile for admin user', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testAdmin.name);
      expect(res.body.data.email).toBe(testAdmin.email);
      expect(res.body.data.role).toBe('admin');
    });

    it('should not access profile without token', async () => {
      const res = await request(server)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test updateDetails route
  describe('PUT /api/auth/updatedetails', () => {
    it('should update user details', async () => {
      const newDetails = {
        name: 'Updated Name',
        email: testUser.email // Keep the same email
      };

      const res = await request(server)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(newDetails);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newDetails.name);
    });

    it('should not update details without token', async () => {
      const res = await request(server)
        .put('/api/auth/updatedetails')
        .send({
          name: 'Another Name'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test updatePassword route
  describe('PUT /api/auth/updatepassword', () => {
    it('should update user password', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: 'newpassword123'
      };

      const res = await request(server)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();

      // Update token with new one after password change
      token = res.body.token;
    });

    it('should not update password with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'anothernewpassword'
      };

      const res = await request(server)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test logout route
  describe('GET /api/auth/logout', () => {
    it('should logout the user', async () => {
      const res = await request(server)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});