# Beer App - API Routes Overview

This document outlines the API endpoints for the Beer App built with NestJS. The application allows an admin to manage participants, beers, barrels, and view dashboard statistics.

---

## 1. Auth (Admin Login)

- `POST /auth/login`  
  Admin login endpoint.

- `POST /auth/logout`  
  Admin logout (if using session/token-based auth).

---

## 2. Participants (Users/Players)

Participants are created and managed by the admin. These users do not authenticate.

- `GET /participants`  
  Get all participants.

- `GET /participants/:id`  
  Get a single participant.

- `POST /participants`  
  Create a new participant.

- `PATCH /participants/:id`  
  Update a participant's information.

- `DELETE /participants/:id`  
  Delete a participant.

---

## 3. Beers (Per Participant)

Allows the admin to add or remove beers from a participant's tally.

- `POST /participants/:id/beers`  
  Add a beer to a participant.

- `DELETE /participants/:id/beers`  
  Remove the last added beer (or support passing a `beerId` if you log them individually).

- `GET /participants/:id/beers`  
  (Optional) Get beer history for a participant.

---

## 4. Barrels

Manage beer barrels of sizes 15L, 30L, or 50L.

- `GET /barrels`  
  List all barrels.

- `POST /barrels`  
  Create a new barrel. Payload should include barrel size.

- `DELETE /barrels/:id`  
  Delete a barrel.

- `PATCH /barrels/:id`  
  (Optional) Update barrel status or size.

---

## 5. Dashboard (Admin Overview)

Provides an overview of beer statistics, consumption, and rankings.

- `GET /dashboard/overview`  
  Get beer statistics (e.g., total beers per participant, barrel usage, etc.).

- `GET /dashboard/leaderboard`  
  Get the top participants by beer count.

---

## Notes

- All routes are secured and only accessible to authenticated admins.
- Beers can be tracked as simple counts or as individual records (for timestamps, logs, barrel tracking).
