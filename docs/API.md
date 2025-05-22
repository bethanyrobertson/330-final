# Design System API Documentation

This document provides comprehensive information about the Design System API endpoints, authentication, and usage.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. To access protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "YOUR_JWT_TOKEN"
}
```

To register as an admin, include the `role` and `adminSecret` fields:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin",
  "adminSecret": "YOUR_ADMIN_SECRET"
}
```

#### Login User

```
POST /auth/login
```

Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "YOUR_JWT_TOKEN"
}
```

#### Get Current User

```
GET /auth/me
```

Get the profile of the currently authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Update User Details

```
PUT /auth/updatedetails
```

Update user name or email.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Update Password

```
PUT /auth/updatepassword
```

Update user password.

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "NEW_JWT_TOKEN"
}
```

#### Logout

```
GET /auth/logout
```

Logout the current user.

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Projects

Projects are collections of design tokens and components.

### Project Endpoints

#### Get All Projects

```
GET /projects
```

Get all projects belonging to the current user. Admins can view all projects.

**Query Parameters:**
- `search`: Search by name, description, or tags
- `status`: Filter by status (draft, published, archived)
- `select`: Comma-separated list of fields to include
- `sort`: Sort by field (prefix with - for descending)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 1,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 10
    }
  },
  "total": 15,
  "data": [
    {
      "_id": "60a1b2c3d4e5f6g7h8i9j0k",
      "name": "My Design System",
      "description": "Corporate design system",
      "slug": "my-design-system",
      "tags": ["corporate", "web"],
      "status": "published",
      "tokenTheme": "light",
      "version": "1.0.0",
      "user": "user_id",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z"
    }
  ]
}
```

#### Get Single Project

```
GET /projects/:id
```

Get a single project by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60a1b2c3d4e5f6g7h8i9j0k",
    "name": "My Design System",
    "description": "Corporate design system",
    "slug": "my-design-system",
    "tags": ["corporate", "web"],
    "status": "published",
    "tokenTheme": "light",
    "version": "1.0.0",
    "user": "user_id",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

#### Create