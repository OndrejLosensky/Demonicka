# API Routes Documentation

## Base URL

All API routes are prefixed with `/api`. For local development, the base URL is: `http://localhost:3000/api`

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
Returns: User object and tokens (access token in response, refresh token as HTTP-only cookie)

### POST /auth/login
Login with existing credentials.
```typescript
{
  "usernameOrEmail": string,  // username or email
  "password": string
}
```
Returns: 
```typescript
{
  "user": {
    "id": string,
    "username": string,
    "email": string,
    "firstName": string,
    "lastName": string,
    "createdAt": string,
    "updatedAt": string
  },
  "accessToken": string
}
```
Note: Refresh token is set as HTTP-only cookie

### POST /auth/refresh
Refresh the access token using refresh token cookie.
- Requires: Valid refresh token in `refresh_token` cookie
- Returns: New access token
- Errors:
  - 401: Invalid or expired refresh token

### POST /auth/logout
Logout the user.
- Requires: Valid refresh token in cookies
- Effect: Invalidates refresh token and clears cookies
- Returns: 204 No Content

### GET /auth/me
Get current user profile.
- Requires: Valid access token
- Returns: User profile data (password excluded)
- Errors:
  - 401: Invalid or missing token

## Participant Routes (`/api/participants`)

All participant routes require authentication via JWT token.

### GET /participants
Get all participants.
- Returns: Array of participants
```typescript
[{
  "id": string,
  "name": string,
  "gender": "MALE" | "FEMALE",
  "beerCount": number,
  "lastBeerTime": string | null,
  "createdAt": string,
  "updatedAt": string
}]
```

### POST /participants
Create new participant.
```typescript
{
  "name": string,    // unique
  "gender": "MALE" | "FEMALE"
}
```
Returns: Created participant
Errors:
- 409: Name already exists
- 400: Invalid input data

### GET /participants/:id
Get participant by ID.
- Param: `id` (UUID)
- Returns: Participant object
- Errors:
  - 404: Participant not found
  - 400: Invalid UUID format

### PATCH /participants/:id
Update participant.
- Param: `id` (UUID)
```typescript
{
  "name"?: string,
  "gender"?: "MALE" | "FEMALE"
}
```
Returns: Updated participant
Errors:
- 404: Participant not found
- 409: Name already exists
- 400: Invalid input data

### DELETE /participants/:id
Delete participant.
- Param: `id` (UUID)
- Returns: 204 No Content
- Errors:
  - 404: Participant not found
  - 400: Invalid UUID format

## Beer Routes (`/api/participants/:participantId/beers`)

All beer routes require authentication and operate on a specific participant's beers.

### POST /participants/:participantId/beers
Add a beer for participant.
- Param: `participantId` (UUID)
- Returns: Created beer record
```typescript
{
  "id": string,
  "participantId": string,
  "createdAt": string
}
```
Errors:
- 404: Participant not found
- 400: Invalid UUID format

### DELETE /participants/:participantId/beers
Remove most recent beer.
- Param: `participantId` (UUID)
- Returns: 204 No Content
- Errors:
  - 404: Participant not found or no beers to remove
  - 400: Invalid UUID format

### GET /participants/:participantId/beers
Get participant's beer history.
- Param: `participantId` (UUID)
- Returns: Array of beer records (newest first)
- Errors:
  - 404: Participant not found
  - 400: Invalid UUID format

### GET /participants/:participantId/beers/count
Get participant's beer count.
- Param: `participantId` (UUID)
- Returns: `{ count: number }`
- Errors:
  - 404: Participant not found
  - 400: Invalid UUID format

## Error Response Format

All error responses follow this structure:
```typescript
{
  "statusCode": number,   // HTTP status code
  "message": string,      // Error description
  "error": string        // Error type
}
```

Common status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (resource already exists)
- 500: Internal Server Error 