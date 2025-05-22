const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Token = require('../models/Token');
const server = require('../server');

// Test user data
const testUser = {
  name: 'Token Test User',
  email: 'token-test@example.com',
  password: 'password123'
};

// Store JWT token and IDs
let token;
let userId;
let projectId;
let tokenId;

describe('Tokens API', () => {
  // Before all tests, create a user, get token, and create a project
  beforeAll(async () => {
    // Clear database
    await User.deleteMany({});
    await Project.deleteMany({});
    await Token.deleteMany({});
    
    // Create test user
    const userRes = await request(server)
      .post('/api/auth/register')
      .send(testUser);
    
    token = userRes.body.token;
    
    // Get user ID
    const meRes = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    userId = meRes.body.data._id;
    
    // Create a test project
    const projectRes = await request(server)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Token Test Project',
        description: 'Project for testing tokens'
      });
    
    projectId = projectRes.body.data._id;
  });

  // After all tests, clear the database and close the connection
  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Token.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  // Test creating a token
  describe('POST /api/projects/:projectId/tokens', () => {
    it('should create a new token for a project', async () => {
      const tokenData = {
        name: 'primary-color',
        path: 'color.schemes.primary',
        category: 'color',
        value: '#8cd5b4',
        description: 'Primary color for the design system'
      };

      const res = await request(server)
        .post(`/api/projects/${projectId}/tokens`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(tokenData.name);
      expect(res.body.data.value).toBe(tokenData.value);
      expect(res.body.data.project).toBe(projectId);
      expect(res.body.data.user).toBe(userId);
      
      // Save token ID for later tests
      tokenId = res.body.data._id;
    });

    it('should not create a token without required fields', async () => {
      const tokenData = {
        name: 'invalid-token',
        // Missing required category and value
      };

      const res = await request(server)
        .post(`/api/projects/${projectId}/tokens`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should not allow duplicate token names in same project', async () => {
      const tokenData = {
        name: 'primary-color', // Same name as before
        path: 'color.schemes.primary',
        category: 'color',
        value: '#ff0000' // Different value
      };

      const res = await request(server)
        .post(`/api/projects/${projectId}/tokens`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should create tokens with complex values', async () => {
      const tokenData = {
        name: 'box-shadow',
        path: 'effect.shadow.medium',
        category: 'effect',
        value: {
          x: 0,
          y: 4,
          blur: 8,
          spread: 0,
          color: 'rgba(0, 0, 0, 0.2)'
        },
        description: 'Medium box shadow'
      };

      const res = await request(server)
        .post(`/api/projects/${projectId}/tokens`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokenData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toMatchObject(tokenData.value);
    });
  });

  // Test getting all tokens
  describe('GET /api/projects/:projectId/tokens', () => {
    it('should get all tokens for a project', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2); // We created 2 tokens
      expect(res.body.data[0].project).toBeDefined();
    });

    it('should filter tokens by category', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens?category=color`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].category).toBe('color');
    });

    it('should search tokens by text', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens?search=primary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some(t => t.name === 'primary-color')).toBe(true);
    });
  });

  // Test getting a single token
  describe('GET /api/tokens/:id', () => {
    it('should get a single token by ID', async () => {
      const res = await request(server)
        .get(`/api/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('primary-color');
      expect(res.body.data._id).toBe(tokenId);
      expect(res.body.data.project).toBeDefined();
    });

    it('should return 404 for non-existent token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .get(`/api/tokens/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test getting tokens by category
  describe('GET /api/projects/:projectId/tokens/category/:category', () => {
    it('should get tokens by category', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens/category/color`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].category).toBe('color');
    });

    it('should return empty array for category with no tokens', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens/category/spacing`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/tokens/category/invalid`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test updating a token
  describe('PUT /api/tokens/:id', () => {
    it('should update a token', async () => {
      const updateData = {
        value: '#00ff00', // Change color value
        description: 'Updated primary color'
      };

      const res = await request(server)
        .put(`/api/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe(updateData.value);
      expect(res.body.data.description).toBe(updateData.description);
    });

    it('should not allow changing token owner or project', async () => {
      const updateData = {
        user: new mongoose.Types.ObjectId(),
        project: new mongoose.Types.ObjectId()
      };

      const res = await request(server)
        .put(`/api/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBe(userId);
      expect(res.body.data.project).toBe(projectId);
    });
  });

  // Test bulk import tokens
  describe('POST /api/projects/:projectId/tokens/import', () => {
    it('should bulk import tokens', async () => {
      const tokensToImport = {
        tokens: [
          {
            name: 'spacing-sm',
            path: 'spacing.sm',
            category: 'spacing',
            value: 8
          },
          {
            name: 'spacing-md',
            path: 'spacing.md',
            category: 'spacing',
            value: 16
          },
          {
            name: 'spacing-lg',
            path: 'spacing.lg',
            category: 'spacing',
            value: 24
          }
        ]
      };

      const res = await request(server)
        .post(`/api/projects/${projectId}/tokens/import`)
        .set('Authorization', `Bearer ${token}`)
        .send(tokensToImport);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      
      // Verify tokens were created
      const checkRes = await request(server)
        .get(`/api/projects/${projectId}/tokens?category=spacing`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(checkRes.statusCode).toEqual(200);
      expect(checkRes.body.count).toBe(3);
    });
  });

  // Test deleting a token
  describe('DELETE /api/tokens/:id', () => {
    it('should delete a token', async () => {
      const res = await request(server)
        .delete(`/api/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});

      // Verify the token is deleted
      const checkRes = await request(server)
        .get(`/api/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(checkRes.statusCode).toEqual(404);
    });
  });
});