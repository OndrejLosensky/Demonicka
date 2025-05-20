# API Routes Documentation

## Authentication Routes (`/api/auth`)

### POST /auth/register
Register a new user.
```typescript
{
  "username": string,    // min 3 chars, alphanumeric with _ and -
  "email": string,      // valid email format
  "password": string,   // min 8 chars, 1 uppercase, 1 lowercase, 1 number/special
  "firstName": string,  // min 2 chars
  "lastName": string    // min 2 chars
}
```

### POST /auth/login
Login with existing credentials.
```typescript
{
  "usernameOrEmail": string,
  "password": string
}
```
Returns: Access token and user data. Refresh token is set as HTTP-only cookie.

### POST /auth/refresh
Refresh the access token using refresh token cookie.
- Requires: Valid refresh token in cookies
- Returns: New access token

### POST /auth/logout
Logout the user.
- Requires: Valid refresh token in cookies
- Effect: Invalidates refresh token and clears cookie

### GET /auth/me
Get current user profile.
- Requires: Valid access token
- Returns: User profile data

## User Routes (`/api/users`)

All user routes require authentication via JWT token in the Authorization header.

### GET /users/:id
Get user profile by ID.
- Requires: Valid access token
- Returns: User profile data
- Note: Users can only access their own profile
```typescript
{
  "id": number,
  "username": string,
  "email": string,
  "firstName": string,
  "lastName": string,
  "createdAt": string,
  "updatedAt": string
}
```

### PATCH /users/:id
Update user profile.
- Requires: Valid access token
- Note: Users can only update their own profile
- Validation:
  - firstName/lastName: min 2 chars
  - email: valid email format and unique

Request body (all fields optional):
```typescript
{
  "firstName"?: string,  // min 2 chars
  "lastName"?: string,   // min 2 chars
  "email"?: string      // valid email format
}
```

Returns: Updated user profile

Error responses:
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (trying to access/update another user's profile)
- 404: User not found
- 409: Conflict (email already exists)

## Authentication Flow

1. **Registration**:
   - Client sends registration data
   - Server creates user and returns tokens
   - Client stores access token and receives refresh token cookie

2. **Login**:
   - Client sends credentials
   - Server validates and returns tokens
   - Client stores access token and receives refresh token cookie

3. **Token Refresh**:
   - When access token expires (401 response)
   - Client calls refresh endpoint with cookie
   - Server validates refresh token and issues new tokens

4. **Protected Routes**:
   - Client includes access token in Authorization header
   - Server validates token for each request
   - On token expiry, client automatically refreshes

5. **Logout**:
   - Client calls logout endpoint
   - Server invalidates refresh token
   - Client clears access token
   - Server clears refresh token cookie 