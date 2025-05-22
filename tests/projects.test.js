const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const server = require('../server');

// Test user data
const testUser = {
  name: 'Project Test User',
  email: 'project-test@example.com',
  password: 'password123'
};

// Store JWT token for authenticated requests
let token;
let userId;

// Store created project ID
let projectId;

describe('Projects API', () => {
  // Before all tests, create a user and get token
  beforeAll(async () => {
    // Clear database
    await User.deleteMany({});
    await Project.deleteMany({});
    
    // Create test user
    const res = await request(server)
      .post('/api/auth/register')
      .send(testUser);
    
    token = res.body.token;
    
    // Get user ID
    const userRes = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    userId = userRes.body.data._id;
  });

  // After all tests, clear the database and close the connection
  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  // Test creating a project
  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project',
        tags: ['test', 'design-system'],
        status: 'draft'
      };

      const res = await request(server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(projectData.name);
      expect(res.body.data.description).toBe(projectData.description);
      expect(res.body.data.user).toBe(userId);
      
      // Save project ID for later tests
      projectId = res.body.data._id;
    });

    it('should not create a project without a name', async () => {
      const projectData = {
        description: 'This is an invalid project',
      };

      const res = await request(server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should not create a project without authentication', async () => {
      const projectData = {
        name: 'Unauthorized Project',
        description: 'This should fail',
      };

      const res = await request(server)
        .post('/api/projects')
        .send(projectData);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test getting all projects
  describe('GET /api/projects', () => {
    it('should get all projects for the user', async () => {
      const res = await request(server)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Test Project');
    });

    it('should support pagination', async () => {
      // Create 10 more projects
      for (let i = 0; i < 10; i++) {
        await Project.create({
          name: `Pagination Test ${i}`,
          description: 'Created for pagination test',
          user: userId
        });
      }

      // Test pagination - page 1 with limit 5
      const res1 = await request(server)
        .get('/api/projects?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res1.statusCode).toEqual(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.count).toBe(5);
      expect(res1.body.pagination.next.page).toBe(2);
      
      // Test pagination - page 2 with limit 5
      const res2 = await request(server)
        .get('/api/projects?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res2.statusCode).toEqual(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.count).toBe(5);
      expect(res2.body.pagination.prev.page).toBe(1);
    });

    it('should filter projects by status', async () => {
      // Create a published project
      await Project.create({
        name: 'Published Project',
        description: 'This is a published project',
        status: 'published',
        user: userId
      });

      const res = await request(server)
        .get('/api/projects?status=published')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Published Project');
      expect(res.body.data[0].status).toBe('published');
    });

    it('should search projects by text', async () => {
      // Create a project with specific search terms
      await Project.create({
        name: 'Material Design System',
        description: 'A project for Material Design implementation',
        tags: ['material', 'design', 'components'],
        user: userId
      });

      // Test text search
      const res = await request(server)
        .get('/api/projects?search=material')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some(p => p.name === 'Material Design System')).toBe(true);
    });

    it('should sort projects by field', async () => {
      // Test sorting by name ascending
      const resAsc = await request(server)
        .get('/api/projects?sort=name')
        .set('Authorization', `Bearer ${token}`);

      expect(resAsc.statusCode).toEqual(200);
      expect(resAsc.body.success).toBe(true);
      
      // Check if sorted correctly (alphabetically)
      const projectNames = resAsc.body.data.map(p => p.name);
      const sortedNames = [...projectNames].sort();
      expect(projectNames).toEqual(sortedNames);

      // Test sorting by name descending
      const resDesc = await request(server)
        .get('/api/projects?sort=-name')
        .set('Authorization', `Bearer ${token}`);

      expect(resDesc.statusCode).toEqual(200);
      expect(resDesc.body.success).toBe(true);
      
      // Check if sorted correctly (reverse alphabetically)
      const projectNamesDesc = resDesc.body.data.map(p => p.name);
      const sortedNamesDesc = [...projectNamesDesc].sort().reverse();
      expect(projectNamesDesc).toEqual(sortedNamesDesc);
    });
  });

  // Test getting a single project
  describe('GET /api/projects/:id', () => {
    it('should get a single project by ID', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Project');
      expect(res.body.data._id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test updating a project
  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'This project has been updated',
        status: 'published'
      };

      const res = await request(server)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.description).toBe(updateData.description);
      expect(res.body.data.status).toBe(updateData.status);
    });

    it('should not allow changing project owner', async () => {
      const updateData = {
        user: new mongoose.Types.ObjectId()
      };

      const res = await request(server)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBe(userId);
    });
  });

  // Test getting project stats
  describe('GET /api/projects/:id/stats', () => {
    it('should get project statistics', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.counts).toBeDefined();
      expect(res.body.data.tokenCategories).toBeDefined();
      expect(res.body.data.componentCategories).toBeDefined();
    });
  });

  // Test project export
  describe('GET /api/projects/:id/export/css', () => {
    it('should export project tokens as CSS variables', async () => {
      const res = await request(server)
        .get(`/api/projects/${projectId}/export/css`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.header['content-type']).toBe('text/css; charset=utf-8');
      expect(res.header['content-disposition']).toContain('attachment');
      // The CSS content will be empty since we have not added any tokens yet
    });
  });

  // Test deleting a project
  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      const res = await request(server)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});

      // Verify the project is deleted
      const checkRes = await request(server)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(checkRes.statusCode).toEqual(404);
    });

    it('should return 404 for deleting non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});