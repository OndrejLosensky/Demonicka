# NestJS & NextJS Authentication System

This is a basic authentication system using NestJS for the backend and NextJS for the frontend with TailwindCSS for styling.

## Project Structure

- `backend/` - NestJS backend with authentication system
- `frontend/` - NextJS frontend with TailwindCSS (to be implemented)

## Backend Authentication Features

- User authentication using Passport.js
- Local authentication strategy with username/password
- JWT-based authentication for protected routes
- Basic user service (in-memory for demo purposes)

## API Endpoints

- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/register` - Register a new user (placeholder)
- `GET /api/profile` - Get user profile (protected route)

## Getting Started

### Backend

1. Navigate to the backend directory:
```
cd backend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run start:dev
```

4. The NestJS server will be running at http://localhost:3000

### Test the Authentication

You can use tools like Postman or curl to test the authentication:

1. Login to get a JWT token:
```
curl -X POST http://localhost:3000/api/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
```

2. Use the token to access a protected route:
```
curl -X GET http://localhost:3000/api/profile -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

- Implement the NextJS frontend with TailwindCSS
- Connect to a real database instead of in-memory storage
- Add user registration functionality
- Implement form validation
- Add refresh token functionality

## Security Notes

- The JWT secret is hardcoded for demonstration purposes. In a production environment, always use environment variables for secrets.
- Passwords are hashed using bcrypt, but a more robust user management system would be needed for production. 