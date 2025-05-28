# API Documentation

## Overview

This document provides comprehensive documentation for the Démonická API endpoints. All API routes are prefixed with `/api/v1/`.

## Authentication

### Login
```
POST /auth/login
```
Request body:
```json
{
  "username": "string",
  "password": "string"
}
```

### Register
```
POST /auth/register
```
Request body:
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

## Events

### List Events
```
GET /events
```

### Get Event
```
GET /events/:id
```

### Create Event
```
POST /events
```
Request body:
```json
{
  "name": "string",
  "description": "string",
  "startDate": "string (ISO date)"
}
```

### End Event
```
POST /events/:id/end
```

### Make Event Active
```
POST /events/:id/activate
```

## Participants

### List Participants
```
GET /participants
```

### Add Participant
```
POST /participants
```
Request body:
```json
{
  "name": "string",
  "gender": "string"
}
```

## Barrels

### List Barrels
```
GET /barrels
```

### Add Barrel
```
POST /barrels
```
Request body:
```json
{
  "size": "number",
  "orderNumber": "string"
}
```

## Dashboard

### Get Statistics
```
GET /dashboard/stats
```

### Get Leaderboard
```
GET /dashboard/leaderboard
```

## Response Formats

All successful responses follow this format:
```json
{
  "data": {
    // Response data
  },
  "message": "string"
}
```

Error responses:
```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
``` 