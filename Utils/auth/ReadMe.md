Auth module (Main/Utils/auth)

This module provides authentication endpoints for the AI HR backend.

Environment variables
- PORT: server port (default 5000)
- MONGODB_URI: MongoDB connection string
- MONGODB_DB: optional default database name
- JWT_SECRET: secret used to sign JWTs (required)
- TOKEN_EXPIRES_IN: token expiry (e.g. "1d", default "1d")

How to run
1. Install dependencies: run `npm install` inside `Main/Utils/auth`.
2. Start the server: `node server.js` (or use nodemon).

Base URL
- Health check: GET /Healthz
- Auth API base: /api/auth

Endpoints
1) Register
- URL: POST /api/auth/register
- Body (application/json):
  {
    "name": "Full Name",
    "email": "user@example.com",
    "password": "yourpassword",
    "role": "user" // optional: user|hr|employee
  }
- Success response: 201 Created
  {
    "message": "Registration successful",
    "user": { "id": "<id>", "name": "...", "email": "...", "role": "..." },
    "token": "<jwt>"
  }

2) Login
- URL: POST /api/auth/login
- Body (application/json):
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
- Success response: 200 OK
  {
    "message": "Login successful",
    "user": { "id": "<id>", "name": "...", "email": "...", "role": "..." },
    "token": "<jwt>"
  }

3) Validate Token / Get current user
- URL: GET /api/auth/validate
- Headers: Authorization: Bearer <token>
- Success response: 200 OK
  {
    "message": "Token valid",
    "user": { ...user without password... }
  }

Notes
- Passwords are hashed with bcrypt before saving.
- JWT payload contains { id, role } and expires per TOKEN_EXPIRES_IN.
- Protect middleware expects the token in the Authorization header as "Bearer <token>".

Example (curl)

Register:

curl -X POST https://backend-1s6m.onrender.com/api/auth/register -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password":"pass123"}'

Login:

curl -X POST https://backend-1s6m.onrender.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"pass123"}'

Validate:

curl -X GET https://backend-1s6m.onrender.com/api/auth/validate -H "Authorization: Bearer <token>"

Security
- Ensure `JWT_SECRET` is set in env and kept secret.
- Use HTTPS in production.

Maintenance
- User model is at `models/userModel.js`.
- Token generation at `utils/generateToken.js`.
- Protect middleware at `middleware/authMiddleware.js`.

Contact
- For changes to auth behavior, update controllers in `controllers/authController.js`.