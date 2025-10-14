# Authentication System Documentation

## Overview

The Tattoo Workshop application now includes a comprehensive user authentication and authorization system with role-based access control (RBAC). This document provides details about the authentication system, its features, and how to use it.

## Features

### Security Features
- **JWT-based Authentication**: Stateless authentication using JSON Web Tokens
- **Password Hashing**: Secure password storage using bcrypt
- **Password Strength Validation**: Enforced password policies
- **Rate Limiting**: Protection against brute force attacks (5 attempts, 15-minute lockout)
- **Role-Based Access Control**: Three user roles with different permission levels
- **Session Management**: Automatic token validation and refresh
- **Secure HTTP**: CORS configuration and cookie security

### User Roles

1. **Admin** 
   - Full system access
   - User management (create, update, delete users)
   - Access to all features
   - Can assign roles to other users

2. **Artist**
   - Access to customer management
   - Access to appointments
   - Portfolio management
   - AI tattoo generator
   - Cannot manage other users

3. **Receptionist**
   - Access to customer management
   - Access to appointments
   - Limited portfolio access
   - Cannot manage users or sensitive settings

## Getting Started

### First-Time Setup

1. **Default Admin Account**
   - Email: `admin@tattoo-workshop.local`
   - Password: `Admin123`
   - **⚠️ IMPORTANT**: Change this password immediately after first login

2. **Change Default Password**
   - Log in with the default credentials
   - Navigate to Profile → Change Password
   - Enter current password and new password
   - New password must meet strength requirements

### Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Example valid passwords:
- `MySecure123`
- `TattooShop2024!`
- `StrongPass1`

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "email": "admin@tattoo-workshop.local",
  "password": "Admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@tattoo-workshop.local",
    "role": "admin",
    "status": "active"
  },
  "message": "Login successful"
}
```

#### POST `/api/auth/register`
Create a new user (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Jane Artist",
  "email": "jane@tattoo-workshop.local",
  "password": "Secure123",
  "role": "artist",
  "phone": "+1234567890",
  "bio": "Professional tattoo artist specializing in traditional styles"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Jane Artist",
    "email": "jane@tattoo-workshop.local",
    "role": "artist",
    "status": "active"
  },
  "message": "User created successfully"
}
```

#### GET `/api/auth/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@tattoo-workshop.local",
    "role": "admin",
    "status": "active",
    "phone": "+1234567890",
    "bio": "Studio administrator",
    "created_at": "2025-10-14 21:23:13",
    "last_login": "2025-10-14 21:29:55"
  }
}
```

#### PUT `/api/auth/me`
Update current user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Admin User Updated",
  "phone": "+1987654321",
  "bio": "Updated bio"
}
```

#### PUT `/api/auth/change-password`
Change current user's password.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "currentPassword": "Admin123",
  "newPassword": "NewSecure456"
}
```

#### GET `/api/auth/users`
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

#### PUT `/api/auth/users/:id`
Update a user (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Updated Name",
  "role": "artist",
  "status": "active"
}
```

#### DELETE `/api/auth/users/:id`
Delete a user (Admin only). Cannot delete your own account.

**Headers:**
```
Authorization: Bearer {token}
```

## Frontend Usage

### Using the Authentication Context

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  // Check user role
  if (hasRole('admin')) {
    return <div>Admin content</div>;
  }

  return <div>Hello, {user.name}!</div>;
}
```

### Protected Routes

```jsx
import ProtectedRoute from './components/ProtectedRoute';

// Require authentication
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Require specific role
<Route path="/users" element={
  <ProtectedRoute roles={['admin']}>
    <UserManagement />
  </ProtectedRoute>
} />
```

## User Management

### Creating New Users (Admin Only)

1. Navigate to **Users** in the navigation menu
2. Click **Add New User**
3. Fill in the user details:
   - Name (required)
   - Email (required, must be unique)
   - Password (required, must meet strength requirements)
   - Role (required: Admin, Artist, or Receptionist)
   - Phone (optional)
   - Bio (optional)
4. Click **Create User**

### Managing Users (Admin Only)

- **Change User Status**: Use the status dropdown to activate, deactivate, or suspend users
- **Delete User**: Click the Delete button (cannot delete your own account)
- **View Last Login**: See when users last accessed the system

### Managing Your Profile

1. Navigate to **Profile** in the navigation menu
2. View your current profile information
3. Click **Edit Profile** to update:
   - Name
   - Phone number
   - Bio
4. Click **Change Password** to update your password

## Security Best Practices

1. **Change Default Password**: Always change the default admin password immediately
2. **Use Strong Passwords**: Follow password requirements strictly
3. **Regular Password Updates**: Change passwords periodically
4. **Logout When Done**: Always log out when finished, especially on shared computers
5. **Monitor User Activity**: Admins should regularly review user last login times
6. **Deactivate Unused Accounts**: Set inactive users to "inactive" status
7. **Secure Token Storage**: Tokens are stored in localStorage; avoid accessing the app on untrusted devices

## Rate Limiting

The login endpoint includes rate limiting to protect against brute force attacks:
- **Maximum Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Per Email**: Rate limiting is applied per email address

If locked out, wait 15 minutes before attempting to log in again.

## Environment Variables

For production deployment, set the following environment variable:

```bash
JWT_SECRET=your-secure-random-secret-key-here
```

**Important**: Never commit secrets to version control. Use environment variables in production.

## Troubleshooting

### Cannot Log In
1. Verify email and password are correct
2. Check if account is locked due to rate limiting (wait 15 minutes)
3. Verify account status is "active"
4. Check browser console for error messages

### Token Expired
- Tokens expire after 7 days
- Log out and log back in to get a new token

### Access Denied
- Verify you have the correct role for the page you're accessing
- Admin-only pages: User Management
- All other pages: Available to all authenticated users

### Lost Admin Password
If you lose the admin password and cannot reset it:
1. Stop the server
2. Delete the database file: `server/tattoo-workshop.db`
3. Restart the server (will create new database)
4. Run migration: `node server/migrations/001-add-users-table.js`
5. Use default admin credentials

## Migration Guide

If you have an existing Tattoo Workshop installation:

1. **Backup Your Database**
   ```bash
   cp server/tattoo-workshop.db server/tattoo-workshop.db.backup
   ```

2. **Install New Dependencies**
   ```bash
   npm install
   ```

3. **Run the Migration**
   ```bash
   node server/migrations/001-add-users-table.js
   ```

4. **Restart the Application**
   ```bash
   npm run dev
   ```

5. **Log In with Default Credentials**
   - Email: admin@tattoo-workshop.local
   - Password: Admin123

6. **Change the Default Password Immediately**

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'artist', 'receptionist')),
  status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'suspended')),
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

## Support

For issues or questions about the authentication system:
1. Check this documentation
2. Review the troubleshooting section
3. Check the browser console for error messages
4. Review server logs for backend errors
