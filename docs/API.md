# Beer App API Documentation

This document provides a comprehensive overview of all API endpoints in the Beer App. The application is built with NestJS and provides functionality for managing participants, beers, barrels, and viewing statistics.

## Authentication

All routes except those marked with 🌐 (public) require a valid JWT token in the Authorization header.

### Routes

#### Admin Authentication
- 🌐 `POST /auth/register`
  - Register a new admin user
  - Body: `{ username: string, email: string, password: string }`
  - Returns: User data and authentication tokens

- 🌐 `POST /auth/login`
  - Admin login
  - Body: `{ username: string, password: string }`
  - Returns: Access token and user data
  - Sets HTTP-only cookie with refresh token

- `POST /auth/refresh`
  - Refresh access token
  - Requires refresh token in HTTP-only cookie
  - Returns: New access token

- `POST /auth/logout`
  - Logout admin user
  - Clears refresh token cookie
  - Returns: 200 OK

- `GET /auth/me`
  - Get current user profile
  - Returns: Current user data

## Participants

### Routes

- `GET /participants`
  - List all participants
  - Returns: Array of participants

- `GET /participants/:id`
  - Get single participant by ID
  - Param: `id` (UUID)
  - Returns: Participant details

- `POST /participants`
  - Create new participant
  - Body: `{ name: string, gender: "MALE" | "FEMALE" }`
  - Returns: Created participant

- `PATCH /participants/:id`
  - Update participant
  - Param: `id` (UUID)
  - Body: `{ name?: string, gender?: "MALE" | "FEMALE" }`
  - Returns: Updated participant

- `DELETE /participants/:id`
  - Delete participant
  - Param: `id` (UUID)
  - Returns: 200 OK

## Beers

### Routes

- `POST /participants/:participantId/beers`
  - Add beer to participant's tally
  - Param: `participantId` (UUID)
  - Returns: Created beer record

- `GET /participants/:participantId/beers`
  - Get participant's beer history
  - Param: `participantId` (UUID)
  - Returns: Array of beer records

- `GET /participants/:participantId/beers/count`
  - Get participant's total beer count
  - Param: `participantId` (UUID)
  - Returns: `{ count: number }`

## Barrels

### Routes

- `GET /barrels`
  - List all barrels
  - Returns: Array of barrels

- `POST /barrels`
  - Create new barrel
  - Body: `{ size: 15 | 30 | 50 }`
  - Returns: Created barrel

- `GET /barrels/:id`
  - Get single barrel
  - Param: `id` (UUID)
  - Returns: Barrel details

- `PATCH /barrels/:id`
  - Update barrel
  - Param: `id` (UUID)
  - Body: `{ size?: 15 | 30 | 50 }`
  - Returns: Updated barrel

- `DELETE /barrels/:id`
  - Delete barrel
  - Param: `id` (UUID)
  - Returns: 200 OK

## Dashboard

### Routes

- `GET /dashboard/overview`
  - Get dashboard statistics
  - Returns: 
    ```typescript
    {
      totalBeers: number;
      totalParticipants: number;
      totalBarrels: number;
      averageBeersPerParticipant: number;
      topParticipants: Array<{
        id: number;
        name: string;
        beerCount: number;
      }>;
      barrelStats: Array<{
        size: number;
        count: number;
      }>;
    }
    ```

- 🌐 `GET /dashboard/leaderboard`
  - Get participant rankings
  - Public endpoint (no authentication required)
  - Returns:
    ```typescript
    {
      males: Array<{
        id: number;
        name: string;
        beerCount: number;
      }>;
      females: Array<{
        id: number;
        name: string;
        beerCount: number;
      }>;
    }
    ```

## Response Formats

### Success Response
```json
{
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

## Notes

- All protected routes require a valid JWT token in the Authorization header: `Bearer <token>`
- Dates are returned in ISO 8601 format
- UUIDs are used for all entity IDs except users
- Cache-Control headers are set appropriately for each endpoint 